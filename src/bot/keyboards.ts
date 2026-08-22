import { Markup } from 'telegraf';
import { Card, GameState, Lang } from '../game/game.types';
import { cardLabel, colorLabel, t } from '../i18n/i18n';
import { canPlayCard } from '../game/game.engine';

export function langKeyboard() {
  return Markup.inlineKeyboard([
    [Markup.button.callback("🇺🇿 O'zbekcha", 'lang:uz')],
    [Markup.button.callback('🇷🇺 Русский', 'lang:ru')],
    [Markup.button.callback('🇬🇧 English', 'lang:en')],
  ]);
}

export function lobbyKeyboard(lang: Lang, chatId: number) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(t(lang, 'join_btn'), `join:${chatId}`),
      Markup.button.callback(t(lang, 'start_btn'), `startgame:${chatId}`),
    ],
    [Markup.button.callback(t(lang, 'cancel_btn'), `cancel:${chatId}`)],
  ]);
}

const COLOR_ORDER: Record<string, number> = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };
const VALUE_ORDER: Record<string, number> = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  skip: 10, reverse: 11, draw2: 12, wild: 13, wild4: 14,
};

/** Sort by color first, then by value, so same-color cards sit together and are easy to scan. */
function sortForDisplay(hand: Card[]): Card[] {
  return hand
    .slice()
    .sort((a, b) => {
      const c = (COLOR_ORDER[a.color] ?? 9) - (COLOR_ORDER[b.color] ?? 9);
      if (c !== 0) return c;
      return (VALUE_ORDER[a.value] ?? 99) - (VALUE_ORDER[b.value] ?? 99);
    });
}

export function handKeyboard(game: GameState, lang: Lang, hand: Card[]) {
  const sorted = sortForDisplay(hand);
  const buttons = sorted.map((card) =>
    Markup.button.callback(
      `${canPlayCard(game, card) ? '' : '🚫 '}${cardLabel(lang, card)}`,
      `play:${game.chatId}:${card.uid}`,
    ),
  );

  // 2 cards per row -> easier to read the whole hand at a glance.
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  rows.push([Markup.button.callback(t(lang, 'no_playable_draw_btn'), `draw:${game.chatId}`)]);
  rows.push([Markup.button.callback(t(lang, 'uno_btn'), `uno:${game.chatId}`)]);
  return Markup.inlineKeyboard(rows);
}

export function colorKeyboard(lang: Lang, chatId: number, cardUid: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(colorLabel(lang, 'red'), `color:${chatId}:${cardUid}:red`),
      Markup.button.callback(colorLabel(lang, 'yellow'), `color:${chatId}:${cardUid}:yellow`),
    ],
    [
      Markup.button.callback(colorLabel(lang, 'green'), `color:${chatId}:${cardUid}:green`),
      Markup.button.callback(colorLabel(lang, 'blue'), `color:${chatId}:${cardUid}:blue`),
    ],
  ]);
}

export function catchUnoKeyboard(lang: Lang, chatId: number, targetId: number) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(t(lang, 'catch_uno_btn'), `catchuno:${chatId}:${targetId}`)],
  ]);
}
