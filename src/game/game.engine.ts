import { Card, CardColor, CardValue, GameState, Lang, Player } from './game.types';

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `c${uidCounter}_${Date.now().toString(36)}`;
}

const COLORS: Exclude<CardColor, 'wild'>[] = ['red', 'yellow', 'green', 'blue'];
const NUMBERS: CardValue[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS: CardValue[] = ['skip', 'reverse', 'draw2'];

/** Standard 108-card UNO deck. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];

  for (const color of COLORS) {
    // one "0"
    deck.push({ color, value: '0', uid: nextUid() });
    // two of each 1-9
    for (const num of NUMBERS.slice(1)) {
      deck.push({ color, value: num, uid: nextUid() });
      deck.push({ color, value: num, uid: nextUid() });
    }
    // two of each action card
    for (const action of ACTIONS) {
      deck.push({ color, value: action, uid: nextUid() });
      deck.push({ color, value: action, uid: nextUid() });
    }
  }

  // 4 wild, 4 wild draw four
  for (let i = 0; i < 4; i++) {
    deck.push({ color: 'wild', value: 'wild', uid: nextUid() });
    deck.push({ color: 'wild', value: 'wild4', uid: nextUid() });
  }

  return deck;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(chatId: number, createdBy: number): GameState {
  return {
    chatId,
    status: 'lobby',
    players: [],
    deck: [],
    discard: [],
    currentIndex: 0,
    direction: 1,
    currentColor: 'red',
    pendingDraw: 0,
    createdBy,
  };
}

export function addPlayer(game: GameState, id: number, name: string, lang: Lang): boolean {
  if (game.status !== 'lobby') return false;
  if (game.players.some((p) => p.id === id)) return false;
  if (game.players.length >= 10) return false;
  game.players.push({ id, name, lang, hand: [], saidUno: false });
  return true;
}

export function removePlayer(game: GameState, id: number): void {
  game.players = game.players.filter((p) => p.id !== id);
}

/** Draws `count` cards for a player, reshuffling discard into deck if needed. */
export function drawCards(game: GameState, player: Player, count: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (game.deck.length === 0) {
      reshuffleDiscardIntoDeck(game);
      if (game.deck.length === 0) break; // truly out of cards, safety guard
    }
    const card = game.deck.pop();
    if (card) {
      drawn.push(card);
      player.hand.push(card);
    }
  }
  player.saidUno = false;
  return drawn;
}

function reshuffleDiscardIntoDeck(game: GameState): void {
  if (game.discard.length <= 1) return; // nothing to reshuffle
  const top = game.discard[game.discard.length - 1];
  const rest = game.discard.slice(0, -1);
  game.deck = shuffle(rest);
  game.discard = [top];
}

export function startGame(game: GameState): void {
  uidCounter = uidCounter; // no-op, keeps ids fresh across games
  game.deck = shuffle(buildDeck());
  game.discard = [];
  game.direction = 1;
  game.pendingDraw = 0;

  for (const player of game.players) {
    player.hand = [];
    player.saidUno = false;
    drawCards(game, player, 7);
  }

  // Flip a starting card that is not a wild4 (to keep opening fair);
  // wild/action cards are allowed and their effect resolves normally.
  let startCard: Card | undefined;
  do {
    if (game.deck.length === 0) reshuffleDiscardIntoDeck(game);
    startCard = game.deck.pop();
    if (startCard && startCard.value === 'wild4') {
      // put it back in the middle and try again
      game.deck.unshift(startCard);
      game.deck = shuffle(game.deck);
      startCard = undefined;
    }
  } while (!startCard);

  game.discard.push(startCard);
  game.currentColor = startCard.color === 'wild' ? pickRandomColor() : startCard.color;
  game.currentIndex = 0;
  game.status = 'playing';

  // Resolve the effect of the opening card on the first player.
  applyOpeningCardEffect(game, startCard);
}

function pickRandomColor(): Exclude<CardColor, 'wild'> {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function applyOpeningCardEffect(game: GameState, card: Card): void {
  if (card.value === 'skip') {
    game.currentIndex = nextIndex(game);
  } else if (card.value === 'reverse') {
    game.direction = -1;
    if (game.players.length === 2) game.currentIndex = nextIndex(game);
  } else if (card.value === 'draw2') {
    game.pendingDraw = 2;
  } else if (card.value === 'wild') {
    // color already randomized above; first player just plays normally
  }
}

export function currentPlayer(game: GameState): Player {
  return game.players[game.currentIndex];
}

function nextIndex(game: GameState, from = game.currentIndex): number {
  const n = game.players.length;
  return (((from + game.direction) % n) + n) % n;
}

export function topCard(game: GameState): Card {
  return game.discard[game.discard.length - 1];
}

export function canPlayCard(game: GameState, card: Card): boolean {
  const top = topCard(game);
  if (game.pendingDraw > 0) {
    // must stack same family (draw2 on draw2, wild4 anytime) or draw
    if (top.value === 'draw2') return card.value === 'draw2';
    if (top.value === 'wild4') return card.value === 'wild4';
  }
  if (card.color === 'wild') return true;
  if (card.color === game.currentColor) return true;
  if (card.value === top.value) return true;
  return false;
}

export interface PlayResult {
  ok: boolean;
  error?: 'not_turn' | 'not_found' | 'illegal' | 'needs_color';
  gameWon?: boolean;
  skippedPlayers?: Player[];
  drawnByNext?: number;
}

export function playCard(
  game: GameState,
  playerId: number,
  cardUid: string,
  chosenColor?: Exclude<CardColor, 'wild'>,
): PlayResult {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { ok: false, error: 'not_turn' };

  const cardIdx = player.hand.findIndex((c) => c.uid === cardUid);
  if (cardIdx === -1) return { ok: false, error: 'not_found' };
  const card = player.hand[cardIdx];

  if (!canPlayCard(game, card)) return { ok: false, error: 'illegal' };
  if (card.color === 'wild' && !chosenColor) return { ok: false, error: 'needs_color' };

  // remove from hand, place on discard
  player.hand.splice(cardIdx, 1);
  game.discard.push(card);
  game.currentColor = card.color === 'wild' ? (chosenColor as Exclude<CardColor, 'wild'>) : card.color;

  if (player.hand.length === 0) {
    game.status = 'finished';
    game.winnerId = player.id;
    return { ok: true, gameWon: true };
  }

  if (player.hand.length !== 1) player.saidUno = false;

  const result: PlayResult = { ok: true };

  switch (card.value) {
    case 'skip': {
      const skipped = game.players[nextIndex(game)];
      game.currentIndex = nextIndex(game, nextIndex(game));
      result.skippedPlayers = [skipped];
      return result;
    }
    case 'reverse': {
      game.direction = game.direction === 1 ? -1 : 1;
      if (game.players.length === 2) {
        // acts like skip for 2 players
        const skipped = game.players[nextIndex(game)];
        game.currentIndex = nextIndex(game, nextIndex(game));
        result.skippedPlayers = [skipped];
        return result;
      }
      game.currentIndex = nextIndex(game);
      return result;
    }
    case 'draw2': {
      game.pendingDraw += 2;
      game.currentIndex = nextIndex(game);
      return result;
    }
    case 'wild4': {
      game.pendingDraw += 4;
      game.currentIndex = nextIndex(game);
      return result;
    }
    default: {
      game.currentIndex = nextIndex(game);
      return result;
    }
  }
}

export interface DrawResult {
  ok: boolean;
  error?: 'not_turn';
  drawn: Card[];
  turnPassed: boolean;
}

/** Player chooses to draw instead of playing (or must draw due to pendingDraw). */
export function drawForCurrentPlayer(game: GameState, playerId: number): DrawResult {
  const player = currentPlayer(game);
  if (player.id !== playerId) return { ok: false, error: 'not_turn', drawn: [], turnPassed: false };

  const count = game.pendingDraw > 0 ? game.pendingDraw : 1;
  const drawn = drawCards(game, player, count);
  game.pendingDraw = 0;
  game.currentIndex = nextIndex(game);
  return { ok: true, drawn, turnPassed: true };
}

export function callUno(game: GameState, playerId: number): boolean {
  const player = game.players.find((p) => p.id === playerId);
  if (!player) return false;
  if (player.hand.length === 1) {
    player.saidUno = true;
    return true;
  }
  return false;
}

/** Catches a player who has 1 card and did not say UNO -> they draw 2 penalty cards. */
export function catchMissedUno(game: GameState, targetId: number): boolean {
  const target = game.players.find((p) => p.id === targetId);
  if (!target) return false;
  if (target.hand.length === 1 && !target.saidUno) {
    drawCards(game, target, 2);
    return true;
  }
  return false;
}
