import { Lang } from '../game/game.types';

type Dict = Record<string, string>;

export const LANG_NAMES: Record<Lang, string> = {
  uz: "🇺🇿 O'zbekcha",
  ru: '🇷🇺 Русский',
  en: '🇬🇧 English',
};

const uz: Dict = {
  choose_lang: 'Tilni tanlang / Choose language / Выберите язык:',
  lang_set: "Til o'zbekchaga o'rnatildi ✅",
  welcome_private:
    "Salom! Men UNO botiman 🎴\nMeni guruhga qo'shing va u yerda /uno buyrug'i bilan o'yinni boshlang.\nSizning kartalaringiz shu yerda, shaxsiy chatda ko'rinadi.",
  group_only: "Bu buyruq faqat guruhda ishlaydi.",
  need_private_start:
    "@{username}, avval menga shaxsiy xabar yozing (bot bilan chatni oching va /start bosing), aks holda sizga kartalarni yubora olmayman.",
  lobby_created: "🎴 Yangi UNO o'yini yaratildi!\nO'yinchilar: {count}/10\n\n⏱ 3 daqiqa ichida kamida 2 kishi yig'ilmasa, o'yin avtomatik bekor bo'ladi.\n🎉 10 kishi to'lsa, o'yin avtomatik boshlanadi.\n\nQo'shilish uchun tugmani bosing.",
  lobby_joined: "{name} o'yinga qo'shildi! ({count} o'yinchi)",
  already_joined: 'Siz allaqachon qatnashyapsiz.',
  lobby_full: "Guruhda joy yo'q (maksimum 10 o'yinchi).",
  not_enough_players: "O'yinni boshlash uchun kamida 2 o'yinchi kerak.",
  only_creator_can_start: "Faqat o'yinni yaratgan odam boshlashi mumkin.",
  game_started: "🎮 O'yin boshlandi! Har birga 7 tadan karta tarqatildi.\nBoshlovchi karta: {card}\nNavbat: {player}",
  join_btn: "➕ Qo'shilish",
  start_btn: "▶️ Boshlash",
  cancel_btn: '❌ Bekor qilish',
  lobby_cancelled: "O'yin bekor qilindi.",
  lobby_timeout_cancelled: "⏱ 3 daqiqa ichida yetarli o'yinchi (kamida 2 kishi) yig'ilmadi. O'yin bekor qilindi.\n\nYangi o'yin uchun /uno yozing.",
  lobby_timeout_auto_start: "⏱ Vaqt tugadi, lekin yetarli o'yinchi bor — o'yin avtomatik boshlanmoqda!",
  lobby_full_auto_start: "🎉 Guruh to'ldi (10/10)! O'yin avtomatik boshlanmoqda!",
  auto_joined: "{name} shaxsiy chatni ochdi va o'yinga avtomatik qo'shildi! ({count} o'yinchi)",
  not_your_turn: 'Hozir sizning navbatingiz emas.',
  no_active_game: "Hozir bu guruhda faol o'yin yo'q. /uno buyrug'i bilan yangisini boshlang.",
  already_in_game: "Bu guruhda allaqachon o'yin ketyapti.",
  your_turn_dm: "🎯 Sizning navbatingiz!\n\nUstidagi karta:「{card}」\nFaol rang: {color}\n\nPastdan kartangizni tanlang 👇",
  your_hand: 'Sizning kartalaringiz ({count} ta):',
  card_played: '{name} tashladi: {card}',
  you_played: 'Siz tashladingiz: {card}',
  card_illegal: "Bu kartani hozir tashlab bo'lmaydi.",
  choose_color: 'Rangni tanlang:',
  color_chosen: '{name} rangni tanladi: {color}',
  drew_cards: '{name} {count} ta karta oldi.',
  you_drew: 'Siz {count} ta karta oldingiz.',
  no_playable_draw_btn: "🃏 Karta olish",
  uno_btn: '🔥 UNO!',
  uno_called: '{name} — UNO! deb baqirdi 🔥',
  uno_missed_penalty: "{name} UNO deyishni unutdi va 2 ta jarima karta oldi!",
  catch_uno_btn: "⚠️ UNO deb aytmadi!",
  winner_msg: "🏆 {name} g'olib bo'ldi! Tabriklaymiz!\n\nYangi o'yin uchun /uno yozing.",
  skip_msg: "⏭ {name} navbati o'tkazib yuborildi.",
  reverse_msg: "🔄 Yo'nalish teskari bo'ldi.",
  draw_pending: '{name} {count} ta karta olishi kerak (yoki mos karta tashlashi mumkin).',
  turn_notice_group: '👉 Navbat: {name}',
  hand_updated: 'Kartalaringiz yangilandi.',
  color_red: '🔴 Qizil',
  color_yellow: '🟡 Sariq',
  color_green: '🟢 Yashil',
  color_blue: "🔵 Ko'k",
  card_wild: 'Rang tanlash',
  card_wild4: '+4 va rang tanlash',
  card_skip: "O'tkazib yuborish",
  card_reverse: 'Teskari',
  card_draw2: '+2',
  help_text:
    "UNO Bot buyruqlari:\n/uno — yangi o'yin boshlash (guruhda)\n/join — o'yinga qo'shilish\n/startgame — o'yinni boshlash (yaratgan odam)\n/cancel — o'yinni bekor qilish\n/status — joriy holatni ko'rish\n/lang — tilni o'zgartirish\n/stats — foydalanish statistikasi\n/help — yordam",
  status_lobby: "Lobbi ochiq. O'yinchilar: {list}",
  status_playing: "O'yin davom etyapti. Navbat: {name}. Qolgan kartalar soni: {counts}",
  stats_admin_only: "Bu buyruq faqat bot administratori uchun.",
  stats_text:
    "📊 Bot statistikasi:\n\n👤 Jami foydalanuvchilar: {users}\n👥 Jami guruhlar: {groups}\n\n🕓 Hozir kutayotgan lobbilar: {lobbies}\n🎮 Hozir davom etayotgan o'yinlar: {activeGames} ({playersInGames} o'yinchi)\n\n▶️ Jami boshlangan o'yinlar: {started}\n🏆 Jami tugagan o'yinlar: {finished}",
};

const ru: Dict = {
  choose_lang: 'Tilni tanlang / Choose language / Выберите язык:',
  lang_set: 'Язык установлен на русский ✅',
  welcome_private:
    'Привет! Я бот UNO 🎴\nДобавь меня в группу и запусти игру командой /uno.\nТвои карты будут показаны здесь, в личном чате.',
  group_only: 'Эта команда работает только в группе.',
  need_private_start:
    '@{username}, сначала напиши мне в личные сообщения (открой чат с ботом и нажми /start), иначе я не смогу отправлять тебе карты.',
  lobby_created: '🎴 Новая игра UNO создана!\nИгроки: {count}/10\n\n⏱ Если за 3 минуты не наберётся минимум 2 игрока, игра будет отменена автоматически.\n🎉 Если наберётся 10 игроков, игра начнётся автоматически.\n\nНажми кнопку, чтобы присоединиться.',
  lobby_joined: '{name} присоединился к игре! ({count} игроков)',
  already_joined: 'Вы уже участвуете.',
  lobby_full: 'Нет мест в группе (максимум 10 игроков).',
  not_enough_players: 'Нужно минимум 2 игрока, чтобы начать.',
  only_creator_can_start: 'Начать игру может только тот, кто её создал.',
  game_started: '🎮 Игра началась! Каждому роздано по 7 карт.\nСтартовая карта: {card}\nХод: {player}',
  join_btn: '➕ Присоединиться',
  start_btn: '▶️ Начать',
  cancel_btn: '❌ Отменить',
  lobby_cancelled: 'Игра отменена.',
  lobby_timeout_cancelled: '⏱ За 3 минуты не набралось достаточно игроков (минимум 2). Игра отменена.\n\nНапишите /uno для новой игры.',
  lobby_timeout_auto_start: '⏱ Время вышло, но игроков достаточно — игра начинается автоматически!',
  lobby_full_auto_start: '🎉 Группа заполнена (10/10)! Игра начинается автоматически!',
  auto_joined: '{name} открыл(а) личный чат и автоматически присоединился(лась) к игре! ({count} игроков)',
  not_your_turn: 'Сейчас не ваш ход.',
  no_active_game: 'Сейчас в этой группе нет активной игры. Начните новую командой /uno.',
  already_in_game: 'В этой группе уже идёт игра.',
  your_turn_dm: '🎯 Ваш ход!\n\nВерхняя карта:「{card}」\nАктивный цвет: {color}\n\nВыберите карту снизу 👇',
  your_hand: 'Ваши карты ({count} шт.):',
  card_played: '{name} сыграл: {card}',
  you_played: 'Вы сыграли: {card}',
  card_illegal: 'Эту карту сейчас нельзя сыграть.',
  choose_color: 'Выберите цвет:',
  color_chosen: '{name} выбрал цвет: {color}',
  drew_cards: '{name} взял {count} карт(ы).',
  you_drew: 'Вы взяли {count} карт(ы).',
  no_playable_draw_btn: '🃏 Взять карту',
  uno_btn: '🔥 UNO!',
  uno_called: '{name} крикнул UNO! 🔥',
  uno_missed_penalty: '{name} забыл сказать UNO и взял 2 штрафные карты!',
  catch_uno_btn: '⚠️ Не сказал UNO!',
  winner_msg: '🏆 {name} победил! Поздравляем!\n\nНапишите /uno для новой игры.',
  skip_msg: '⏭ Ход {name} пропущен.',
  reverse_msg: '🔄 Направление изменено.',
  draw_pending: '{name} должен взять {count} карт(ы) (или сыграть подходящую карту).',
  turn_notice_group: '👉 Ход: {name}',
  hand_updated: 'Ваши карты обновлены.',
  color_red: '🔴 Красный',
  color_yellow: '🟡 Жёлтый',
  color_green: '🟢 Зелёный',
  color_blue: '🔵 Синий',
  card_wild: 'Выбор цвета',
  card_wild4: '+4 и выбор цвета',
  card_skip: 'Пропуск',
  card_reverse: 'Реверс',
  card_draw2: '+2',
  help_text:
    'Команды UNO бота:\n/uno — начать новую игру (в группе)\n/join — присоединиться к игре\n/startgame — начать игру (создатель)\n/cancel — отменить игру\n/status — посмотреть текущее состояние\n/lang — сменить язык\n/stats — статистика использования\n/help — помощь',
  status_lobby: 'Лобби открыто. Игроки: {list}',
  status_playing: 'Игра идёт. Ход: {name}. Карт у игроков: {counts}',
  stats_admin_only: 'Эта команда доступна только администратору бота.',
  stats_text:
    '📊 Статистика бота:\n\n👤 Всего пользователей: {users}\n👥 Всего групп: {groups}\n\n🕓 Лобби сейчас ожидают: {lobbies}\n🎮 Игр сейчас идёт: {activeGames} ({playersInGames} игроков)\n\n▶️ Всего начато игр: {started}\n🏆 Всего завершено игр: {finished}',
};

const en: Dict = {
  choose_lang: 'Tilni tanlang / Choose language / Выберите язык:',
  lang_set: 'Language set to English ✅',
  welcome_private:
    "Hi! I'm the UNO bot 🎴\nAdd me to a group and start a game there with /uno.\nYour cards will be shown here, in this private chat.",
  group_only: 'This command only works in a group.',
  need_private_start:
    '@{username}, please message me privately first (open a chat with the bot and press /start), otherwise I can\'t send you your cards.',
  lobby_created: "🎴 New UNO game created!\nPlayers: {count}/10\n\n⏱ If at least 2 players don't join within 3 minutes, the game will be cancelled automatically.\n🎉 If 10 players join, the game starts automatically.\n\nTap the button to join.",
  lobby_joined: '{name} joined the game! ({count} players)',
  already_joined: "You're already in this game.",
  lobby_full: 'The group is full (max 10 players).',
  not_enough_players: 'At least 2 players are needed to start.',
  only_creator_can_start: 'Only the person who created the game can start it.',
  game_started: '🎮 Game started! Everyone got 7 cards.\nStarting card: {card}\nTurn: {player}',
  join_btn: '➕ Join',
  start_btn: '▶️ Start',
  cancel_btn: '❌ Cancel',
  lobby_cancelled: 'Game cancelled.',
  lobby_timeout_cancelled: "⏱ Not enough players (minimum 2) joined within 3 minutes. The game has been cancelled.\n\nType /uno to start a new one.",
  lobby_timeout_auto_start: "⏱ Time's up, but there are enough players — the game is starting automatically!",
  lobby_full_auto_start: '🎉 The group is full (10/10)! The game is starting automatically!',
  auto_joined: '{name} opened a private chat and was automatically added to the game! ({count} players)',
  not_your_turn: "It's not your turn.",
  no_active_game: 'There is no active game in this group. Start one with /uno.',
  already_in_game: 'A game is already running in this group.',
  your_turn_dm: "🎯 It's your turn!\n\nTop card:「{card}」\nActive color: {color}\n\nPick a card below 👇",
  your_hand: 'Your cards ({count}):',
  card_played: '{name} played: {card}',
  you_played: 'You played: {card}',
  card_illegal: "You can't play that card right now.",
  choose_color: 'Choose a color:',
  color_chosen: '{name} chose the color: {color}',
  drew_cards: '{name} drew {count} card(s).',
  you_drew: 'You drew {count} card(s).',
  no_playable_draw_btn: '🃏 Draw a card',
  uno_btn: '🔥 UNO!',
  uno_called: '{name} called UNO! 🔥',
  uno_missed_penalty: '{name} forgot to say UNO and drew 2 penalty cards!',
  catch_uno_btn: "⚠️ Didn't say UNO!",
  winner_msg: '🏆 {name} won! Congratulations!\n\nType /uno to start a new game.',
  skip_msg: "⏭ {name}'s turn was skipped.",
  reverse_msg: '🔄 Direction reversed.',
  draw_pending: '{name} must draw {count} card(s) (or play a matching card).',
  turn_notice_group: '👉 Turn: {name}',
  hand_updated: 'Your hand was updated.',
  color_red: '🔴 Red',
  color_yellow: '🟡 Yellow',
  color_green: '🟢 Green',
  color_blue: '🔵 Blue',
  card_wild: 'Choose color',
  card_wild4: '+4 and choose color',
  card_skip: 'Skip',
  card_reverse: 'Reverse',
  card_draw2: '+2',
  help_text:
    'UNO bot commands:\n/uno — start a new game (in a group)\n/join — join the game\n/startgame — start the game (creator only)\n/cancel — cancel the game\n/status — view current status\n/lang — change language\n/stats — usage statistics\n/help — help',
  status_lobby: 'Lobby is open. Players: {list}',
  status_playing: 'Game in progress. Turn: {name}. Cards left per player: {counts}',
  stats_admin_only: "This command is only available to the bot's admin.",
  stats_text:
    "📊 Bot statistics:\n\n👤 Total users: {users}\n👥 Total groups: {groups}\n\n🕓 Lobbies waiting right now: {lobbies}\n🎮 Games in progress: {activeGames} ({playersInGames} players)\n\n▶️ Total games started: {started}\n🏆 Total games finished: {finished}",
};

const DICTS: Record<Lang, Dict> = { uz, ru, en };

export function t(lang: Lang, key: string, vars: Record<string, string | number> = {}): string {
  const dict = DICTS[lang] || DICTS.en;
  let str = dict[key] ?? DICTS.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return str;
}

const COLOR_EMOJI: Record<string, string> = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
  wild: '⬛',
};

export function colorLabel(lang: Lang, color: string): string {
  const key = `color_${color}` as const;
  if (color === 'wild') return '⬛';
  return t(lang, key);
}

const NUMBER_EMOJI: Record<string, string> = {
  '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣', '4': '4️⃣',
  '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣', '9': '9️⃣',
};

const SPECIAL_EMOJI: Record<string, string> = {
  skip: '⛔',
  reverse: '🔁',
  draw2: '➕2️⃣',
  wild: '🌈',
  wild4: '🌈➕4️⃣',
};

/** Short, highly visual card label used inside buttons: e.g. "🔴 5️⃣" / "🟡 ⛔" / "🌈 +4". */
export function cardLabel(lang: Lang, card: { color: string; value: string }): string {
  const colorDot = COLOR_EMOJI[card.color] ?? '';

  if (card.color === 'wild') {
    const label = card.value === 'wild4' ? t(lang, 'card_wild4') : t(lang, 'card_wild');
    return `${SPECIAL_EMOJI[card.value]}  ${label}`;
  }

  if (NUMBER_EMOJI[card.value]) {
    return `${colorDot} ${NUMBER_EMOJI[card.value]}`;
  }

  const valueMap: Record<string, string> = {
    skip: t(lang, 'card_skip'),
    reverse: t(lang, 'card_reverse'),
    draw2: t(lang, 'card_draw2'),
  };
  const symbol = SPECIAL_EMOJI[card.value] ?? '';
  const label = valueMap[card.value] ?? card.value;
  return `${colorDot} ${symbol} ${label}`;
}
