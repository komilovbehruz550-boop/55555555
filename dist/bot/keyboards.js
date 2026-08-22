"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.langKeyboard = langKeyboard;
exports.lobbyKeyboard = lobbyKeyboard;
exports.handKeyboard = handKeyboard;
exports.colorKeyboard = colorKeyboard;
exports.catchUnoKeyboard = catchUnoKeyboard;
const telegraf_1 = require("telegraf");
const i18n_1 = require("../i18n/i18n");
const game_engine_1 = require("../game/game.engine");
function langKeyboard() {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz')],
        [telegraf_1.Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
        [telegraf_1.Markup.button.callback('🇬🇧 English', 'lang:en')],
    ]);
}
function lobbyKeyboard(lang, chatId) {
    return telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback((0, i18n_1.t)(lang, 'join_btn'), `join:${chatId}`),
            telegraf_1.Markup.button.callback((0, i18n_1.t)(lang, 'start_btn'), `startgame:${chatId}`),
        ],
        [telegraf_1.Markup.button.callback((0, i18n_1.t)(lang, 'cancel_btn'), `cancel:${chatId}`)],
    ]);
}
const COLOR_ORDER = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };
const VALUE_ORDER = {
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    skip: 10, reverse: 11, draw2: 12, wild: 13, wild4: 14,
};
function sortForDisplay(hand) {
    return hand
        .slice()
        .sort((a, b) => {
        const c = (COLOR_ORDER[a.color] ?? 9) - (COLOR_ORDER[b.color] ?? 9);
        if (c !== 0)
            return c;
        return (VALUE_ORDER[a.value] ?? 99) - (VALUE_ORDER[b.value] ?? 99);
    });
}
function handKeyboard(game, lang, hand) {
    const sorted = sortForDisplay(hand);
    const buttons = sorted.map((card) => telegraf_1.Markup.button.callback(`${(0, game_engine_1.canPlayCard)(game, card) ? '' : '🚫 '}${(0, i18n_1.cardLabel)(lang, card)}`, `play:${game.chatId}:${card.uid}`));
    const rows = [];
    for (let i = 0; i < buttons.length; i += 2) {
        rows.push(buttons.slice(i, i + 2));
    }
    rows.push([telegraf_1.Markup.button.callback((0, i18n_1.t)(lang, 'no_playable_draw_btn'), `draw:${game.chatId}`)]);
    rows.push([telegraf_1.Markup.button.callback((0, i18n_1.t)(lang, 'uno_btn'), `uno:${game.chatId}`)]);
    return telegraf_1.Markup.inlineKeyboard(rows);
}
function colorKeyboard(lang, chatId, cardUid) {
    return telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback((0, i18n_1.colorLabel)(lang, 'red'), `color:${chatId}:${cardUid}:red`),
            telegraf_1.Markup.button.callback((0, i18n_1.colorLabel)(lang, 'yellow'), `color:${chatId}:${cardUid}:yellow`),
        ],
        [
            telegraf_1.Markup.button.callback((0, i18n_1.colorLabel)(lang, 'green'), `color:${chatId}:${cardUid}:green`),
            telegraf_1.Markup.button.callback((0, i18n_1.colorLabel)(lang, 'blue'), `color:${chatId}:${cardUid}:blue`),
        ],
    ]);
}
function catchUnoKeyboard(lang, chatId, targetId) {
    return telegraf_1.Markup.inlineKeyboard([
        [telegraf_1.Markup.button.callback((0, i18n_1.t)(lang, 'catch_uno_btn'), `catchuno:${chatId}:${targetId}`)],
    ]);
}
//# sourceMappingURL=keyboards.js.map