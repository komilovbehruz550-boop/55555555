# UNO Telegram Bot (NestJS + Telegraf)

Telegram guruhida o'ynaladigan UNO boti. 3 til: 🇺🇿 o'zbekcha, 🇷🇺 ruscha, 🇬🇧 inglizcha.

O'yin mantig'i (`src/game/game.engine.ts`) 300 ta avtomatik simulyatsiya bilan sinovdan
o'tkazilgan — 2 dan 10 tagacha o'yinchi bilan, hech qanday xatosiz (`npm run test:engine`).

## Qanday ishlaydi

- Guruhga botni qo'shasiz, `/uno` bilan lobbi ochiladi (rasmli banner bilan), odamlar
  "➕ Qo'shilish" tugmasini bosadi.
- Agar odam hali botga shaxsiy `/start` bosmagan bo'lsa, tugmani bossa ham bot buni
  "eslab qoladi" — u shaxsiy chatda `/start` bosishi bilan **avtomatik** o'yinga
  qo'shiladi, qayta "Qo'shilish" bosishning hojati yo'q.
- **⏱ 3 daqiqalik taymer**: lobbi ochilgandan keyin 3 daqiqa ichida kamida 2 kishi
  yig'ilmasa, o'yin avtomatik bekor qilinadi. Agar 3 daqiqa ichida (yoki undan oldin)
  guruh 10 kishiga to'lsa, o'yin avtomatik boshlanadi. Aks holda, 3 daqiqadan keyin
  kamida 2 kishi bo'lsa ham, o'yin avtomatik boshlanadi.
- O'yin boshlangach, har bir o'yinchining kartalari **shaxsiy chatda** (bot bilan) tugmalar
  ko'rinishida chiqadi — guruhda hech kim boshqa birovning kartasini ko'rmaydi. Kartalar
  rang bo'yicha saralanadi va katta, aniq emoji bilan ko'rsatiladi.
- Guruhga faqat umumiy holat chiqadi (rasmli e'lonlar bilan — lobbi, o'yin boshlanishi,
  g'olib): kim yurdi, qanday karta tashladi, navbat kimda.
- Barcha standart UNO qoidalari qo'llab-quvvatlanadi: Skip, Reverse, +2, Wild, Wild +4,
  qoldirilgan kartalarni qayta aralashtirish, "UNO!" deyish va buni unutganlarni "tutish"
  (jarima 2 karta).

## O'rnatish

1. Node.js 18+ kerak.
2. Bog'liqliklarni o'rnating:
   ```bash
   npm install
   ```
3. `.env.example` faylidan nusxa oling va o'z tokeningizni qo'ying:
   ```bash
   cp .env.example .env
   ```
   `.env` ichida:
   ```
   BOT_TOKEN=SIZNING_BOTFATHER_TOKENINGIZ
   ```
4. **MUHIM**: BotFather'da botingiz uchun **Group Privacy**ni o'chiring, aks holda bot
   guruhdagi `/uno`, `/join` kabi buyruqlarni ko'ra olmaydi:
   - @BotFather ga yozing → `/mybots` → botingizni tanlang → `Bot Settings` →
     `Group Privacy` → `Turn off`.
5. Ishga tushirish (production build):
   ```bash
   npm run build
   npm start
   ```
   Yoki development rejimida (fayl o'zgarganda avtomatik qayta yuklanadi):
   ```bash
   npm run start:dev
   ```

## Foydalanish

1. Botni guruhga qo'shing.
2. Har bir o'yinchi avval botga **shaxsiy** `/start` bosishi kerak (bu Telegram cheklovi —
   aks holda bot ularga karta yubora olmaydi). Bot buni eslatib turadi.
3. Guruhda `/uno` — yangi o'yin (lobbi) ochiladi.
4. O'yinchilar "➕ Qo'shilish" tugmasini bosadi (kamida 2 kishi kerak).
5. Lobbini yaratgan odam "▶️ Boshlash" tugmasini bosadi.
6. Har kim shaxsiy chatda o'z navbatida kartalarini ko'radi va bosib o'ynaydi.

### Buyruqlar

| Buyruq | Tavsif |
|---|---|
| `/uno` | Guruhda yangi o'yin (lobbi) ochish |
| `/join` | Lobbiga qo'shilish (tugma o'rniga) |
| `/startgame` | O'yinni boshlash (faqat yaratgan odam) |
| `/cancel` | O'yin/lobbini bekor qilish (faqat yaratgan odam) |
| `/status` | Joriy holatni ko'rish |
| `/lang` | Tilni o'zgartirish |
| `/help` | Yordam |

## Loyiha tuzilishi

```
src/
  game/
    game.types.ts       # Kartalar, o'yinchi, o'yin holati tiplari
    game.engine.ts       # Sof o'yin mantig'i (Telegram'dan mustaqil)
    game.engine.spec.ts  # 300 o'yinlik avtomatik simulyatsiya testi
  i18n/
    i18n.ts               # uz/ru/en matnlar
  bot/
    state.service.ts     # Xotirada saqlanuvchi o'yin holatlari (guruh boshiga bitta)
    keyboards.ts          # Inline tugmalar
    bot.update.ts         # Telegram buyruq/callback handlerlari
    bot.module.ts
  app.module.ts
  main.ts
```

## Eslatmalar / cheklovlar

- Holat **xotirada** saqlanadi (baza yo'q) — bot qayta ishga tushsa, davom etayotgan
  o'yinlar yo'qoladi. Agar kerak bo'lsa, keyinroq SQLite/Redis qo'shib, holatni
  disk/bazaga saqlash mumkin.
- Bir vaqtning o'zida bir guruhda faqat bitta o'yin bo'lishi mumkin.
- Bot ishlashi uchun serveringiz (yoki kompyuteringiz) doimiy internetga ulangan va
  `npm start` jarayoni ishlab turishi kerak (masalan VPS, yoki `pm2` bilan fon rejimida).
