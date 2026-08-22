"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeck = buildDeck;
exports.shuffle = shuffle;
exports.createGame = createGame;
exports.addPlayer = addPlayer;
exports.removePlayer = removePlayer;
exports.drawCards = drawCards;
exports.startGame = startGame;
exports.currentPlayer = currentPlayer;
exports.topCard = topCard;
exports.canPlayCard = canPlayCard;
exports.playCard = playCard;
exports.drawForCurrentPlayer = drawForCurrentPlayer;
exports.callUno = callUno;
exports.catchMissedUno = catchMissedUno;
let uidCounter = 0;
function nextUid() {
    uidCounter += 1;
    return `c${uidCounter}_${Date.now().toString(36)}`;
}
const COLORS = ['red', 'yellow', 'green', 'blue'];
const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const ACTIONS = ['skip', 'reverse', 'draw2'];
function buildDeck() {
    const deck = [];
    for (const color of COLORS) {
        deck.push({ color, value: '0', uid: nextUid() });
        for (const num of NUMBERS.slice(1)) {
            deck.push({ color, value: num, uid: nextUid() });
            deck.push({ color, value: num, uid: nextUid() });
        }
        for (const action of ACTIONS) {
            deck.push({ color, value: action, uid: nextUid() });
            deck.push({ color, value: action, uid: nextUid() });
        }
    }
    for (let i = 0; i < 4; i++) {
        deck.push({ color: 'wild', value: 'wild', uid: nextUid() });
        deck.push({ color: 'wild', value: 'wild4', uid: nextUid() });
    }
    return deck;
}
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function createGame(chatId, createdBy) {
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
function addPlayer(game, id, name, lang) {
    if (game.status !== 'lobby')
        return false;
    if (game.players.some((p) => p.id === id))
        return false;
    if (game.players.length >= 10)
        return false;
    game.players.push({ id, name, lang, hand: [], saidUno: false });
    return true;
}
function removePlayer(game, id) {
    game.players = game.players.filter((p) => p.id !== id);
}
function drawCards(game, player, count) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
        if (game.deck.length === 0) {
            reshuffleDiscardIntoDeck(game);
            if (game.deck.length === 0)
                break;
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
function reshuffleDiscardIntoDeck(game) {
    if (game.discard.length <= 1)
        return;
    const top = game.discard[game.discard.length - 1];
    const rest = game.discard.slice(0, -1);
    game.deck = shuffle(rest);
    game.discard = [top];
}
function startGame(game) {
    uidCounter = uidCounter;
    game.deck = shuffle(buildDeck());
    game.discard = [];
    game.direction = 1;
    game.pendingDraw = 0;
    for (const player of game.players) {
        player.hand = [];
        player.saidUno = false;
        drawCards(game, player, 7);
    }
    let startCard;
    do {
        if (game.deck.length === 0)
            reshuffleDiscardIntoDeck(game);
        startCard = game.deck.pop();
        if (startCard && startCard.value === 'wild4') {
            game.deck.unshift(startCard);
            game.deck = shuffle(game.deck);
            startCard = undefined;
        }
    } while (!startCard);
    game.discard.push(startCard);
    game.currentColor = startCard.color === 'wild' ? pickRandomColor() : startCard.color;
    game.currentIndex = 0;
    game.status = 'playing';
    applyOpeningCardEffect(game, startCard);
}
function pickRandomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
}
function applyOpeningCardEffect(game, card) {
    if (card.value === 'skip') {
        game.currentIndex = nextIndex(game);
    }
    else if (card.value === 'reverse') {
        game.direction = -1;
        if (game.players.length === 2)
            game.currentIndex = nextIndex(game);
    }
    else if (card.value === 'draw2') {
        game.pendingDraw = 2;
    }
    else if (card.value === 'wild') {
    }
}
function currentPlayer(game) {
    return game.players[game.currentIndex];
}
function nextIndex(game, from = game.currentIndex) {
    const n = game.players.length;
    return (((from + game.direction) % n) + n) % n;
}
function topCard(game) {
    return game.discard[game.discard.length - 1];
}
function canPlayCard(game, card) {
    const top = topCard(game);
    if (game.pendingDraw > 0) {
        if (top.value === 'draw2')
            return card.value === 'draw2';
        if (top.value === 'wild4')
            return card.value === 'wild4';
    }
    if (card.color === 'wild')
        return true;
    if (card.color === game.currentColor)
        return true;
    if (card.value === top.value)
        return true;
    return false;
}
function playCard(game, playerId, cardUid, chosenColor) {
    const player = currentPlayer(game);
    if (player.id !== playerId)
        return { ok: false, error: 'not_turn' };
    const cardIdx = player.hand.findIndex((c) => c.uid === cardUid);
    if (cardIdx === -1)
        return { ok: false, error: 'not_found' };
    const card = player.hand[cardIdx];
    if (!canPlayCard(game, card))
        return { ok: false, error: 'illegal' };
    if (card.color === 'wild' && !chosenColor)
        return { ok: false, error: 'needs_color' };
    player.hand.splice(cardIdx, 1);
    game.discard.push(card);
    game.currentColor = card.color === 'wild' ? chosenColor : card.color;
    if (player.hand.length === 0) {
        game.status = 'finished';
        game.winnerId = player.id;
        return { ok: true, gameWon: true };
    }
    if (player.hand.length !== 1)
        player.saidUno = false;
    const result = { ok: true };
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
function drawForCurrentPlayer(game, playerId) {
    const player = currentPlayer(game);
    if (player.id !== playerId)
        return { ok: false, error: 'not_turn', drawn: [], turnPassed: false };
    const count = game.pendingDraw > 0 ? game.pendingDraw : 1;
    const drawn = drawCards(game, player, count);
    game.pendingDraw = 0;
    game.currentIndex = nextIndex(game);
    return { ok: true, drawn, turnPassed: true };
}
function callUno(game, playerId) {
    const player = game.players.find((p) => p.id === playerId);
    if (!player)
        return false;
    if (player.hand.length === 1) {
        player.saidUno = true;
        return true;
    }
    return false;
}
function catchMissedUno(game, targetId) {
    const target = game.players.find((p) => p.id === targetId);
    if (!target)
        return false;
    if (target.hand.length === 1 && !target.saidUno) {
        drawCards(game, target, 2);
        return true;
    }
    return false;
}
//# sourceMappingURL=game.engine.js.map