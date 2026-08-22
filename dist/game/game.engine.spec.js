"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const game_engine_1 = require("./game.engine");
const COLORS = ['red', 'yellow', 'green', 'blue'];
function totalCards(game) {
    const inHands = game.players.reduce((s, p) => s + p.hand.length, 0);
    return inHands + game.deck.length + game.discard.length;
}
function runOneGame(numPlayers, maxTurns = 3000) {
    const game = (0, game_engine_1.createGame)(1, 100);
    for (let i = 0; i < numPlayers; i++) {
        (0, game_engine_1.addPlayer)(game, i + 1, `P${i + 1}`, 'uz');
    }
    (0, game_engine_1.startGame)(game);
    let turns = 0;
    while (game.status === 'playing' && turns < maxTurns) {
        turns++;
        const before = totalCards(game);
        if (before !== 108) {
            throw new Error(`Card count mismatch before turn ${turns}: ${before}`);
        }
        const player = (0, game_engine_1.currentPlayer)(game);
        const playable = player.hand.filter((c) => (0, game_engine_1.canPlayCard)(game, c));
        if (playable.length > 0) {
            const card = playable[Math.floor(Math.random() * playable.length)];
            const color = card.color === 'wild' ? COLORS[Math.floor(Math.random() * COLORS.length)] : undefined;
            const res = (0, game_engine_1.playCard)(game, player.id, card.uid, color);
            if (!res.ok)
                throw new Error(`Unexpected illegal move: ${JSON.stringify(res)}`);
            if (player.hand.length === 1)
                (0, game_engine_1.callUno)(game, player.id);
            if (res.gameWon)
                break;
        }
        else {
            const res = (0, game_engine_1.drawForCurrentPlayer)(game, player.id);
            if (!res.ok)
                throw new Error('Draw failed unexpectedly');
        }
        const after = totalCards(game);
        if (after !== 108) {
            throw new Error(`Card count mismatch after turn ${turns}: ${after}`);
        }
    }
    if (turns >= maxTurns) {
        throw new Error(`Game did not finish within ${maxTurns} turns (players=${numPlayers})`);
    }
    const top = (0, game_engine_1.topCard)(game);
    if (!top)
        throw new Error('No top card at end of game');
    return { turns, winner: game.status === 'finished' };
}
function main() {
    const totalGames = 300;
    let maxTurns = 0;
    let minTurns = Infinity;
    let failures = 0;
    for (let i = 0; i < totalGames; i++) {
        const numPlayers = 2 + (i % 9);
        try {
            const { turns } = runOneGame(numPlayers);
            maxTurns = Math.max(maxTurns, turns);
            minTurns = Math.min(minTurns, turns);
        }
        catch (e) {
            failures++;
            console.error(`Game ${i} FAILED (players=${numPlayers}):`, e.message);
        }
    }
    console.log(`Simulyatsiya yakunlandi: ${totalGames} o'yin, xatolar: ${failures}`);
    console.log(`Min/Max yurishlar soni: ${minTurns}/${maxTurns}`);
    if (failures > 0) {
        process.exit(1);
    }
    else {
        console.log('BARCHA TESTLAR MUVAFFAQIYATLI O\'TDI ✅');
    }
}
main();
//# sourceMappingURL=game.engine.spec.js.map