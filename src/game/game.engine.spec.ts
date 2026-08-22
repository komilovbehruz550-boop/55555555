/* eslint-disable no-console */
import {
  addPlayer,
  callUno,
  canPlayCard,
  createGame,
  currentPlayer,
  drawForCurrentPlayer,
  playCard,
  startGame,
  topCard,
} from './game.engine';
import { CardColor } from './game.types';

const COLORS: Exclude<CardColor, 'wild'>[] = ['red', 'yellow', 'green', 'blue'];

function totalCards(game: ReturnType<typeof createGame>): number {
  const inHands = game.players.reduce((s, p) => s + p.hand.length, 0);
  return inHands + game.deck.length + game.discard.length;
}

function runOneGame(numPlayers: number, maxTurns = 3000): { turns: number; winner: boolean } {
  const game = createGame(1, 100);
  for (let i = 0; i < numPlayers; i++) {
    addPlayer(game, i + 1, `P${i + 1}`, 'uz');
  }
  startGame(game);

  let turns = 0;
  while (game.status === 'playing' && turns < maxTurns) {
    turns++;
    const before = totalCards(game);
    if (before !== 108) {
      throw new Error(`Card count mismatch before turn ${turns}: ${before}`);
    }

    const player = currentPlayer(game);
    const playable = player.hand.filter((c) => canPlayCard(game, c));

    if (playable.length > 0) {
      const card = playable[Math.floor(Math.random() * playable.length)];
      const color = card.color === 'wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : undefined;
      const res = playCard(game, player.id, card.uid, color);
      if (!res.ok) throw new Error(`Unexpected illegal move: ${JSON.stringify(res)}`);
      if (player.hand.length === 1) callUno(game, player.id);
      if (res.gameWon) break;
    } else {
      const res = drawForCurrentPlayer(game, player.id);
      if (!res.ok) throw new Error('Draw failed unexpectedly');
    }

    const after = totalCards(game);
    if (after !== 108) {
      throw new Error(`Card count mismatch after turn ${turns}: ${after}`);
    }
  }

  if (turns >= maxTurns) {
    throw new Error(`Game did not finish within ${maxTurns} turns (players=${numPlayers})`);
  }

  // sanity: top card must always be a valid card object
  const top = topCard(game);
  if (!top) throw new Error('No top card at end of game');

  return { turns, winner: game.status === 'finished' };
}

function main() {
  const totalGames = 300;
  let maxTurns = 0;
  let minTurns = Infinity;
  let failures = 0;

  for (let i = 0; i < totalGames; i++) {
    const numPlayers = 2 + (i % 9); // 2..10 players
    try {
      const { turns } = runOneGame(numPlayers);
      maxTurns = Math.max(maxTurns, turns);
      minTurns = Math.min(minTurns, turns);
    } catch (e) {
      failures++;
      console.error(`Game ${i} FAILED (players=${numPlayers}):`, (e as Error).message);
    }
  }

  console.log(`Simulyatsiya yakunlandi: ${totalGames} o'yin, xatolar: ${failures}`);
  console.log(`Min/Max yurishlar soni: ${minTurns}/${maxTurns}`);

  if (failures > 0) {
    process.exit(1);
  } else {
    console.log('BARCHA TESTLAR MUVAFFAQIYATLI O\'TDI ✅');
  }
}

main();
