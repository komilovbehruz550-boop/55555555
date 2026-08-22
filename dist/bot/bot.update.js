"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotUpdate = void 0;
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const state_service_1 = require("./state.service");
const i18n_1 = require("../i18n/i18n");
const game_engine_1 = require("../game/game.engine");
const keyboards_1 = require("./keyboards");
function displayName(from) {
    if (!from)
        return 'Player';
    return from.username ? from.username : from.first_name ?? 'Player';
}
const LOBBY_WAIT_MS = 3 * 60 * 1000;
const LOBBY_BANNER = 'https://placehold.co/800x400/1f6feb/ffffff/png?text=UNO%0AJoin+the+game!';
const START_BANNER = 'https://placehold.co/800x400/e6394b/ffffff/png?text=UNO%0AGame+Started!';
const WINNER_BANNER = 'https://placehold.co/800x400/f5b301/222222/png?text=UNO%0AWinner!';
let BotUpdate = class BotUpdate {
    constructor(state, bot) {
        this.state = state;
        this.bot = bot;
        this.lobbyTimers = new Map();
    }
    async onStart(ctx) {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        const isPrivate = ctx.chat?.type === 'private';
        if (isPrivate) {
            this.state.markPrivateStarted(userId);
            const lang = this.state.getLang(userId);
            await ctx.reply((0, i18n_1.t)(lang, 'welcome_private'));
            await ctx.reply((0, i18n_1.t)(lang, 'choose_lang'), (0, keyboards_1.langKeyboard)());
            const pendingChat = this.state.getPendingJoin(userId);
            if (pendingChat !== undefined) {
                this.state.clearPendingJoin(userId);
                const pendingGame = this.state.getGame(pendingChat);
                if (pendingGame &&
                    pendingGame.status === 'lobby' &&
                    !pendingGame.players.some((p) => p.id === userId)) {
                    const joined = (0, game_engine_1.addPlayer)(pendingGame, userId, displayName(ctx.from), lang);
                    if (joined) {
                        this.state.setActiveChat(userId, pendingChat);
                        await this.announce(pendingChat, (0, i18n_1.t)(lang, 'auto_joined', { name: displayName(ctx.from), count: pendingGame.players.length }));
                        await this.checkAutoStartIfFull(pendingChat);
                    }
                }
            }
            const activeChat = this.state.getActiveChat(userId);
            if (activeChat) {
                const game = this.state.getGame(activeChat);
                if (game && game.status === 'playing') {
                    const player = game.players.find((p) => p.id === userId);
                    if (player)
                        await this.sendHandIfTurn(game, player);
                }
            }
        }
        else {
            await ctx.reply((0, i18n_1.t)(this.state.getLang(userId), 'welcome_private'));
        }
    }
    async onLang(ctx) {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        await ctx.reply((0, i18n_1.t)(this.state.getLang(userId), 'choose_lang'), (0, keyboards_1.langKeyboard)());
    }
    async setLang(ctx) {
        const userId = ctx.from?.id;
        if (!userId)
            return;
        const lang = ctx.match[1];
        this.state.setLang(userId, lang);
        await ctx.answerCbQuery();
        await ctx.editMessageText((0, i18n_1.t)(lang, 'lang_set'));
    }
    async onHelp(ctx) {
        const userId = ctx.from?.id ?? 0;
        await ctx.reply((0, i18n_1.t)(this.state.getLang(userId), 'help_text'));
    }
    async onUno(ctx) {
        if (ctx.chat?.type === 'private') {
            await ctx.reply((0, i18n_1.t)(this.state.getLang(ctx.from.id), 'group_only'));
            return;
        }
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;
        const lang = this.state.getLang(userId);
        const existing = this.state.getGame(chatId);
        if (existing && existing.status !== 'finished') {
            await ctx.reply((0, i18n_1.t)(lang, 'already_in_game'));
            return;
        }
        const game = this.state.createGame(chatId, userId);
        (0, game_engine_1.addPlayer)(game, userId, displayName(ctx.from), lang);
        this.state.setActiveChat(userId, chatId);
        await this.sendGroupPhoto(chatId, LOBBY_BANNER, (0, i18n_1.t)(lang, 'lobby_created', { count: game.players.length }), (0, keyboards_1.lobbyKeyboard)(lang, chatId));
        this.scheduleLobbyTimeout(chatId);
    }
    async onJoin(ctx) {
        const chatId = Number(ctx.match[1]);
        const userId = ctx.from.id;
        const lang = this.state.getLang(userId);
        const game = this.state.getGame(chatId);
        if (!game || game.status !== 'lobby') {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        if (game.players.some((p) => p.id === userId)) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'already_joined'));
            return;
        }
        if (!this.state.hasStartedPrivate(userId)) {
            this.state.setPendingJoin(userId, chatId);
            await ctx.answerCbQuery();
            await ctx.reply((0, i18n_1.t)(lang, 'need_private_start', { username: displayName(ctx.from) }));
            return;
        }
        const ok = (0, game_engine_1.addPlayer)(game, userId, displayName(ctx.from), lang);
        if (!ok) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'lobby_full'));
            return;
        }
        this.state.setActiveChat(userId, chatId);
        await ctx.answerCbQuery();
        try {
            await ctx.editMessageCaption((0, i18n_1.t)(lang, 'lobby_created', { count: game.players.length }), (0, keyboards_1.lobbyKeyboard)(lang, chatId));
        }
        catch {
        }
        await ctx.reply((0, i18n_1.t)(lang, 'lobby_joined', { name: displayName(ctx.from), count: game.players.length }));
        await this.checkAutoStartIfFull(chatId);
    }
    async onJoinCmd(ctx) {
        if (ctx.chat?.type === 'private')
            return;
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;
        const lang = this.state.getLang(userId);
        const game = this.state.getGame(chatId);
        if (!game || game.status !== 'lobby') {
            await ctx.reply((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        if (game.players.some((p) => p.id === userId)) {
            await ctx.reply((0, i18n_1.t)(lang, 'already_joined'));
            return;
        }
        if (!this.state.hasStartedPrivate(userId)) {
            this.state.setPendingJoin(userId, chatId);
            await ctx.reply((0, i18n_1.t)(lang, 'need_private_start', { username: displayName(ctx.from) }));
            return;
        }
        const ok = (0, game_engine_1.addPlayer)(game, userId, displayName(ctx.from), lang);
        if (!ok) {
            await ctx.reply((0, i18n_1.t)(lang, 'lobby_full'));
            return;
        }
        this.state.setActiveChat(userId, chatId);
        await ctx.reply((0, i18n_1.t)(lang, 'lobby_joined', { name: displayName(ctx.from), count: game.players.length }));
        await this.checkAutoStartIfFull(chatId);
    }
    async onCancelBtn(ctx) {
        await this.cancelGame(ctx, Number(ctx.match[1]), ctx.from.id, true);
    }
    async onCancelCmd(ctx) {
        if (ctx.chat?.type === 'private')
            return;
        await this.cancelGame(ctx, ctx.chat.id, ctx.from.id, false);
    }
    async cancelGame(ctx, chatId, userId, isCallback) {
        const lang = this.state.getLang(userId);
        const game = this.state.getGame(chatId);
        if (!game) {
            if (isCallback)
                await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            else
                await ctx.reply((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        if (game.createdBy !== userId) {
            if (isCallback)
                await ctx.answerCbQuery((0, i18n_1.t)(lang, 'only_creator_can_start'));
            else
                await ctx.reply((0, i18n_1.t)(lang, 'only_creator_can_start'));
            return;
        }
        this.clearLobbyTimer(chatId);
        this.state.deleteGame(chatId);
        if (isCallback) {
            await ctx.answerCbQuery();
            try {
                await ctx.editMessageCaption((0, i18n_1.t)(lang, 'lobby_cancelled'));
            }
            catch {
            }
        }
        else {
            await ctx.reply((0, i18n_1.t)(lang, 'lobby_cancelled'));
        }
    }
    async onStartGameBtn(ctx) {
        await this.startGameFlow(ctx, Number(ctx.match[1]), ctx.from.id, true);
    }
    async onStartGameCmd(ctx) {
        if (ctx.chat?.type === 'private')
            return;
        await this.startGameFlow(ctx, ctx.chat.id, ctx.from.id, false);
    }
    async startGameFlow(ctx, chatId, userId, isCallback) {
        const lang = this.state.getLang(userId);
        const game = this.state.getGame(chatId);
        const reply = async (text, cb = false) => {
            if (cb)
                await ctx.answerCbQuery(text);
            else
                await ctx.reply(text);
        };
        if (!game || game.status !== 'lobby') {
            await reply((0, i18n_1.t)(lang, 'no_active_game'), isCallback);
            return;
        }
        if (game.createdBy !== userId) {
            await reply((0, i18n_1.t)(lang, 'only_creator_can_start'), isCallback);
            return;
        }
        if (game.players.length < 2) {
            await reply((0, i18n_1.t)(lang, 'not_enough_players'), isCallback);
            return;
        }
        if (isCallback) {
            await ctx.answerCbQuery();
            try {
                await ctx.editMessageReplyMarkup(undefined);
            }
            catch {
            }
        }
        await this.doStartGame(chatId);
    }
    async doStartGame(chatId) {
        const game = this.state.getGame(chatId);
        if (!game || game.status !== 'lobby')
            return;
        this.clearLobbyTimer(chatId);
        (0, game_engine_1.startGame)(game);
        const top = (0, game_engine_1.topCard)(game);
        const first = (0, game_engine_1.currentPlayer)(game);
        const lang = this.state.getLang(game.createdBy);
        const text = (0, i18n_1.t)(lang, 'game_started', {
            card: (0, i18n_1.cardLabel)(lang, top),
            player: first.name,
        });
        await this.sendGroupPhoto(chatId, START_BANNER, text);
        for (const p of game.players) {
            await this.sendHandIfTurn(game, p, true);
        }
    }
    async checkAutoStartIfFull(chatId) {
        const game = this.state.getGame(chatId);
        if (!game || game.status !== 'lobby')
            return;
        if (game.players.length >= 10) {
            const lang = this.state.getLang(game.createdBy);
            await this.announce(chatId, (0, i18n_1.t)(lang, 'lobby_full_auto_start'));
            await this.doStartGame(chatId);
        }
    }
    scheduleLobbyTimeout(chatId) {
        this.clearLobbyTimer(chatId);
        const timer = setTimeout(() => {
            this.handleLobbyTimeout(chatId).catch(() => undefined);
        }, LOBBY_WAIT_MS);
        this.lobbyTimers.set(chatId, timer);
    }
    clearLobbyTimer(chatId) {
        const timer = this.lobbyTimers.get(chatId);
        if (timer) {
            clearTimeout(timer);
            this.lobbyTimers.delete(chatId);
        }
    }
    async handleLobbyTimeout(chatId) {
        this.lobbyTimers.delete(chatId);
        const game = this.state.getGame(chatId);
        if (!game || game.status !== 'lobby')
            return;
        const lang = this.state.getLang(game.createdBy);
        if (game.players.length >= 2) {
            await this.announce(chatId, (0, i18n_1.t)(lang, 'lobby_timeout_auto_start'));
            await this.doStartGame(chatId);
        }
        else {
            this.state.deleteGame(chatId);
            await this.announce(chatId, (0, i18n_1.t)(lang, 'lobby_timeout_cancelled'));
        }
    }
    async onStatus(ctx) {
        if (ctx.chat?.type === 'private')
            return;
        const chatId = ctx.chat.id;
        const userId = ctx.from.id;
        const lang = this.state.getLang(userId);
        const game = this.state.getGame(chatId);
        if (!game) {
            await ctx.reply((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        if (game.status === 'lobby') {
            await ctx.reply((0, i18n_1.t)(lang, 'status_lobby', { list: game.players.map((p) => p.name).join(', ') }));
        }
        else if (game.status === 'playing') {
            const counts = game.players.map((p) => `${p.name}: ${p.hand.length}`).join(', ');
            await ctx.reply((0, i18n_1.t)(lang, 'status_playing', { name: (0, game_engine_1.currentPlayer)(game).name, counts }));
        }
    }
    async sendHandIfTurn(game, player, force = false) {
        const isTurn = (0, game_engine_1.currentPlayer)(game).id === player.id;
        if (!isTurn && !force)
            return;
        if (!this.state.hasStartedPrivate(player.id))
            return;
        const lang = player.lang;
        const top = (0, game_engine_1.topCard)(game);
        try {
            if (isTurn) {
                await this.bot.telegram.sendMessage(player.id, (0, i18n_1.t)(lang, 'your_turn_dm', { card: (0, i18n_1.cardLabel)(lang, top), color: (0, i18n_1.colorLabel)(lang, game.currentColor) }));
            }
            await this.bot.telegram.sendMessage(player.id, (0, i18n_1.t)(lang, 'your_hand', { count: player.hand.length }), (0, keyboards_1.handKeyboard)(game, lang, player.hand));
        }
        catch {
        }
    }
    async announce(chatId, text) {
        try {
            await this.bot.telegram.sendMessage(chatId, text);
        }
        catch {
        }
    }
    async sendGroupPhoto(chatId, photoUrl, caption, extra = {}) {
        try {
            await this.bot.telegram.sendPhoto(chatId, photoUrl, { caption, ...extra });
        }
        catch {
            await this.announce(chatId, caption);
        }
    }
    async afterTurnAdvance(game) {
        const next = (0, game_engine_1.currentPlayer)(game);
        await this.announce(game.chatId, (0, i18n_1.t)(next.lang, 'turn_notice_group', { name: next.name }));
        await this.sendHandIfTurn(game, next);
    }
    async onPlay(ctx) {
        const chatId = Number(ctx.match[1]);
        const cardUid = ctx.match[2];
        const userId = ctx.from.id;
        const game = this.state.getGame(chatId);
        const lang = this.state.getLang(userId);
        if (!game || game.status !== 'playing') {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        const player = game.players.find((p) => p.id === userId);
        if (!player) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        if ((0, game_engine_1.currentPlayer)(game).id !== userId) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'not_your_turn'));
            return;
        }
        const card = player.hand.find((c) => c.uid === cardUid);
        if (!card) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'card_illegal'));
            return;
        }
        if (!(0, game_engine_1.canPlayCard)(game, card)) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'card_illegal'));
            return;
        }
        await ctx.answerCbQuery();
        if (card.color === 'wild') {
            await ctx.editMessageText((0, i18n_1.t)(lang, 'you_played', { card: (0, i18n_1.cardLabel)(lang, card) }));
            await ctx.reply((0, i18n_1.t)(lang, 'choose_color'), (0, keyboards_1.colorKeyboard)(lang, chatId, cardUid));
            return;
        }
        const result = (0, game_engine_1.playCard)(game, userId, cardUid);
        await ctx.editMessageText((0, i18n_1.t)(lang, 'you_played', { card: (0, i18n_1.cardLabel)(lang, card) }));
        if (result.gameWon) {
            await this.sendGroupPhoto(chatId, WINNER_BANNER, (0, i18n_1.t)(lang, 'winner_msg', { name: player.name }));
            this.state.deleteGame(chatId);
            return;
        }
        await this.announceMoveEffects(game, player, card, result);
    }
    async onColor(ctx) {
        const chatId = Number(ctx.match[1]);
        const cardUid = ctx.match[2];
        const color = ctx.match[3];
        const userId = ctx.from.id;
        const game = this.state.getGame(chatId);
        const lang = this.state.getLang(userId);
        if (!game || game.status !== 'playing') {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        const player = game.players.find((p) => p.id === userId);
        if (!player || (0, game_engine_1.currentPlayer)(game).id !== userId) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'not_your_turn'));
            return;
        }
        const card = player.hand.find((c) => c.uid === cardUid);
        if (!card) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'card_illegal'));
            return;
        }
        await ctx.answerCbQuery();
        const result = (0, game_engine_1.playCard)(game, userId, cardUid, color);
        await ctx.editMessageText((0, i18n_1.t)(lang, 'you_played', { card: (0, i18n_1.cardLabel)(lang, card) }) + ' -> ' + (0, i18n_1.colorLabel)(lang, color));
        if (result.gameWon) {
            await this.sendGroupPhoto(chatId, WINNER_BANNER, (0, i18n_1.t)(lang, 'winner_msg', { name: player.name }));
            this.state.deleteGame(chatId);
            return;
        }
        await this.announce(chatId, (0, i18n_1.t)(lang, 'color_chosen', { name: player.name, color: (0, i18n_1.colorLabel)(lang, color) }));
        await this.announceMoveEffects(game, player, card, result, true);
    }
    async announceMoveEffects(game, player, card, result, colorAlreadyAnnounced = false) {
        if (!colorAlreadyAnnounced) {
            await this.announce(game.chatId, (0, i18n_1.t)(player.lang, 'card_played', { name: player.name, card: (0, i18n_1.cardLabel)(player.lang, card) }));
        }
        if (result.skippedPlayers?.length) {
            for (const skipped of result.skippedPlayers) {
                await this.announce(game.chatId, (0, i18n_1.t)(skipped.lang, 'skip_msg', { name: skipped.name }));
            }
        }
        if (card.value === 'reverse' && game.players.length > 2) {
            await this.announce(game.chatId, (0, i18n_1.t)(player.lang, 'reverse_msg'));
        }
        if (game.pendingDraw > 0) {
            const next = (0, game_engine_1.currentPlayer)(game);
            await this.announce(game.chatId, (0, i18n_1.t)(next.lang, 'draw_pending', { name: next.name, count: game.pendingDraw }));
        }
        await this.afterTurnAdvance(game);
    }
    async onDraw(ctx) {
        const chatId = Number(ctx.match[1]);
        const userId = ctx.from.id;
        const game = this.state.getGame(chatId);
        const lang = this.state.getLang(userId);
        if (!game || game.status !== 'playing') {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        const player = game.players.find((p) => p.id === userId);
        if (!player || (0, game_engine_1.currentPlayer)(game).id !== userId) {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'not_your_turn'));
            return;
        }
        await ctx.answerCbQuery();
        const res = (0, game_engine_1.drawForCurrentPlayer)(game, userId);
        await ctx.editMessageText((0, i18n_1.t)(lang, 'you_drew', { count: res.drawn.length }));
        await this.announce(chatId, (0, i18n_1.t)(player.lang, 'drew_cards', { name: player.name, count: res.drawn.length }));
        await this.afterTurnAdvance(game);
    }
    async onUnoCall(ctx) {
        const chatId = Number(ctx.match[1]);
        const userId = ctx.from.id;
        const game = this.state.getGame(chatId);
        const lang = this.state.getLang(userId);
        if (!game || game.status !== 'playing') {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        const player = game.players.find((p) => p.id === userId);
        if (!player) {
            await ctx.answerCbQuery();
            return;
        }
        const ok = (0, game_engine_1.callUno)(game, userId);
        await ctx.answerCbQuery();
        if (ok) {
            await this.announce(chatId, (0, i18n_1.t)(lang, 'uno_called', { name: player.name }));
        }
    }
    async onCatchUno(ctx) {
        const chatId = Number(ctx.match[1]);
        const targetId = Number(ctx.match[2]);
        const game = this.state.getGame(chatId);
        const lang = this.state.getLang(ctx.from.id);
        if (!game || game.status !== 'playing') {
            await ctx.answerCbQuery((0, i18n_1.t)(lang, 'no_active_game'));
            return;
        }
        const target = game.players.find((p) => p.id === targetId);
        if (!target) {
            await ctx.answerCbQuery();
            return;
        }
        const caught = (0, game_engine_1.catchMissedUno)(game, targetId);
        await ctx.answerCbQuery();
        if (caught) {
            await this.announce(chatId, (0, i18n_1.t)(target.lang, 'uno_missed_penalty', { name: target.name }));
            await this.sendHandIfTurn(game, target, true);
        }
    }
    async onLeftChatMember(ctx) {
        const chatId = ctx.chat?.id;
        const leftId = ctx.message?.left_chat_member?.id;
        if (!chatId || !leftId)
            return;
        const game = this.state.getGame(chatId);
        if (game && game.status === 'lobby') {
            (0, game_engine_1.removePlayer)(game, leftId);
        }
    }
};
exports.BotUpdate = BotUpdate;
__decorate([
    (0, nestjs_telegraf_1.Start)(),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStart", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('lang'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onLang", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^lang:(uz|ru|en)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "setLang", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('help'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onHelp", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('uno'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onUno", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^join:(-?\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onJoin", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('join'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onJoinCmd", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^cancel:(-?\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCancelBtn", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('cancel'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCancelCmd", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^startgame:(-?\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStartGameBtn", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('startgame'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStartGameCmd", null);
__decorate([
    (0, nestjs_telegraf_1.Command)('status'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [telegraf_1.Context]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onStatus", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^play:(-?\d+):(.+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onPlay", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^color:(-?\d+):(.+):(red|yellow|green|blue)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onColor", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^draw:(-?\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onDraw", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^uno:(-?\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onUnoCall", null);
__decorate([
    (0, nestjs_telegraf_1.Action)(/^catchuno:(-?\d+):(\d+)$/),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onCatchUno", null);
__decorate([
    (0, nestjs_telegraf_1.On)('left_chat_member'),
    __param(0, (0, nestjs_telegraf_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BotUpdate.prototype, "onLeftChatMember", null);
exports.BotUpdate = BotUpdate = __decorate([
    (0, nestjs_telegraf_1.Update)(),
    __param(1, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [state_service_1.StateService,
        telegraf_1.Telegraf])
], BotUpdate);
//# sourceMappingURL=bot.update.js.map