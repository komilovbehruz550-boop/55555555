import { Update, Ctx, Start, Command, Action, On, InjectBot } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';
import { StateService } from './state.service';
import { Lang, Player, GameState } from '../game/game.types';
import { t, cardLabel, colorLabel } from '../i18n/i18n';
import {
  addPlayer,
  callUno,
  canPlayCard,
  catchMissedUno,
  currentPlayer,
  drawForCurrentPlayer,
  playCard,
  removePlayer,
  startGame,
  topCard,
} from '../game/game.engine';
import { langKeyboard, lobbyKeyboard, handKeyboard, colorKeyboard, catchUnoKeyboard } from './keyboards';
import { CardColor } from '../game/game.types';

function displayName(from?: { first_name?: string; username?: string }): string {
  if (!from) return 'Player';
  return from.username ? from.username : from.first_name ?? 'Player';
}

const LOBBY_WAIT_MS = 3 * 60 * 1000; // 3 daqiqa

// Decorative banner images (generated on the fly, no API key needed).
// If they fail to load (no internet on the host, blocked domain, etc.) we
// automatically fall back to a plain text message, so the bot never breaks.
const LOBBY_BANNER = 'https://placehold.co/800x400/1f6feb/ffffff/png?text=UNO%0AJoin+the+game!';
const START_BANNER = 'https://placehold.co/800x400/e6394b/ffffff/png?text=UNO%0AGame+Started!';
const WINNER_BANNER = 'https://placehold.co/800x400/f5b301/222222/png?text=UNO%0AWinner!';

@Update()
export class BotUpdate {
  /** chatId -> pending 3-minute lobby timeout */
  private lobbyTimers = new Map<number, NodeJS.Timeout>();

  constructor(
    private readonly state: StateService,
    @InjectBot() private readonly bot: Telegraf<Context>,
  ) {}

  // ---------- basic commands ----------

  @Start()
  async onStart(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;
    const isPrivate = ctx.chat?.type === 'private';

    if (isPrivate) {
      this.state.markPrivateStarted(userId);
      const lang = this.state.getLang(userId);
      await ctx.reply(t(lang, 'welcome_private'));
      await ctx.reply(t(lang, 'choose_lang'), langKeyboard());

      // They clicked "Join" in a group earlier but hadn't started a private
      // chat yet -> now that they have, add them to that lobby automatically.
      const pendingChat = this.state.getPendingJoin(userId);
      if (pendingChat !== undefined) {
        this.state.clearPendingJoin(userId);
        const pendingGame = this.state.getGame(pendingChat);
        if (
          pendingGame &&
          pendingGame.status === 'lobby' &&
          !pendingGame.players.some((p) => p.id === userId)
        ) {
          const joined = addPlayer(pendingGame, userId, displayName(ctx.from), lang);
          if (joined) {
            this.state.setActiveChat(userId, pendingChat);
            await this.announce(
              pendingChat,
              t(lang, 'auto_joined', { name: displayName(ctx.from), count: pendingGame.players.length }),
            );
            await this.checkAutoStartIfFull(pendingChat);
          }
        }
      }

      // If they were mid-invite to a group game, resend their hand
      const activeChat = this.state.getActiveChat(userId);
      if (activeChat) {
        const game = this.state.getGame(activeChat);
        if (game && game.status === 'playing') {
          const player = game.players.find((p) => p.id === userId);
          if (player) await this.sendHandIfTurn(game, player);
        }
      }
    } else {
      await ctx.reply(t(this.state.getLang(userId), 'welcome_private'));
    }
  }

  @Command('lang')
  async onLang(@Ctx() ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.reply(t(this.state.getLang(userId), 'choose_lang'), langKeyboard());
  }

  @Action(/^lang:(uz|ru|en)$/)
  async setLang(@Ctx() ctx: any) {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = ctx.match[1] as Lang;
    this.state.setLang(userId, lang);
    await ctx.answerCbQuery();
    await ctx.editMessageText(t(lang, 'lang_set'));
  }

  @Command('help')
  async onHelp(@Ctx() ctx: Context) {
    const userId = ctx.from?.id ?? 0;
    await ctx.reply(t(this.state.getLang(userId), 'help_text'));
  }

  // ---------- lobby management ----------

  @Command('uno')
  async onUno(@Ctx() ctx: Context) {
    if (ctx.chat?.type === 'private') {
      await ctx.reply(t(this.state.getLang(ctx.from!.id), 'group_only'));
      return;
    }
    const chatId = ctx.chat!.id;
    const userId = ctx.from!.id;
    const lang = this.state.getLang(userId);

    const existing = this.state.getGame(chatId);
    if (existing && existing.status !== 'finished') {
      await ctx.reply(t(lang, 'already_in_game'));
      return;
    }

    const game = this.state.createGame(chatId, userId);
    addPlayer(game, userId, displayName(ctx.from), lang);
    this.state.setActiveChat(userId, chatId);

    await this.sendGroupPhoto(
      chatId,
      LOBBY_BANNER,
      t(lang, 'lobby_created', { count: game.players.length }),
      lobbyKeyboard(lang, chatId),
    );
    this.scheduleLobbyTimeout(chatId);
  }

  @Action(/^join:(-?\d+)$/)
  async onJoin(@Ctx() ctx: any) {
    const chatId = Number(ctx.match[1]);
    const userId = ctx.from.id;
    const lang = this.state.getLang(userId);
    const game = this.state.getGame(chatId);

    if (!game || game.status !== 'lobby') {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    if (game.players.some((p) => p.id === userId)) {
      await ctx.answerCbQuery(t(lang, 'already_joined'));
      return;
    }
    if (!this.state.hasStartedPrivate(userId)) {
      // Remember this so that as soon as they press /start in a private
      // chat with the bot, they get added to this lobby automatically.
      this.state.setPendingJoin(userId, chatId);
      await ctx.answerCbQuery();
      await ctx.reply(t(lang, 'need_private_start', { username: displayName(ctx.from) }));
      return;
    }
    const ok = addPlayer(game, userId, displayName(ctx.from), lang);
    if (!ok) {
      await ctx.answerCbQuery(t(lang, 'lobby_full'));
      return;
    }
    this.state.setActiveChat(userId, chatId);
    await ctx.answerCbQuery();
    try {
      await ctx.editMessageCaption(
        t(lang, 'lobby_created', { count: game.players.length }),
        lobbyKeyboard(lang, chatId),
      );
    } catch {
      // ignore edit failures (e.g. message too old)
    }
    await ctx.reply(t(lang, 'lobby_joined', { name: displayName(ctx.from), count: game.players.length }));
    await this.checkAutoStartIfFull(chatId);
  }

  @Command('join')
  async onJoinCmd(@Ctx() ctx: Context) {
    if (ctx.chat?.type === 'private') return;
    const chatId = ctx.chat!.id;
    const userId = ctx.from!.id;
    const lang = this.state.getLang(userId);
    const game = this.state.getGame(chatId);
    if (!game || game.status !== 'lobby') {
      await ctx.reply(t(lang, 'no_active_game'));
      return;
    }
    if (game.players.some((p) => p.id === userId)) {
      await ctx.reply(t(lang, 'already_joined'));
      return;
    }
    if (!this.state.hasStartedPrivate(userId)) {
      this.state.setPendingJoin(userId, chatId);
      await ctx.reply(t(lang, 'need_private_start', { username: displayName(ctx.from) }));
      return;
    }
    const ok = addPlayer(game, userId, displayName(ctx.from), lang);
    if (!ok) {
      await ctx.reply(t(lang, 'lobby_full'));
      return;
    }
    this.state.setActiveChat(userId, chatId);
    await ctx.reply(t(lang, 'lobby_joined', { name: displayName(ctx.from), count: game.players.length }));
    await this.checkAutoStartIfFull(chatId);
  }

  @Action(/^cancel:(-?\d+)$/)
  async onCancelBtn(@Ctx() ctx: any) {
    await this.cancelGame(ctx, Number(ctx.match[1]), ctx.from.id, true);
  }

  @Command('cancel')
  async onCancelCmd(@Ctx() ctx: Context) {
    if (ctx.chat?.type === 'private') return;
    await this.cancelGame(ctx, ctx.chat!.id, ctx.from!.id, false);
  }

  private async cancelGame(ctx: any, chatId: number, userId: number, isCallback: boolean) {
    const lang = this.state.getLang(userId);
    const game = this.state.getGame(chatId);
    if (!game) {
      if (isCallback) await ctx.answerCbQuery(t(lang, 'no_active_game'));
      else await ctx.reply(t(lang, 'no_active_game'));
      return;
    }
    if (game.createdBy !== userId) {
      if (isCallback) await ctx.answerCbQuery(t(lang, 'only_creator_can_start'));
      else await ctx.reply(t(lang, 'only_creator_can_start'));
      return;
    }
    this.clearLobbyTimer(chatId);
    this.state.deleteGame(chatId);
    if (isCallback) {
      await ctx.answerCbQuery();
      try {
        await ctx.editMessageCaption(t(lang, 'lobby_cancelled'));
      } catch {
        // ignore
      }
    } else {
      await ctx.reply(t(lang, 'lobby_cancelled'));
    }
  }

  @Action(/^startgame:(-?\d+)$/)
  async onStartGameBtn(@Ctx() ctx: any) {
    await this.startGameFlow(ctx, Number(ctx.match[1]), ctx.from.id, true);
  }

  @Command('startgame')
  async onStartGameCmd(@Ctx() ctx: Context) {
    if (ctx.chat?.type === 'private') return;
    await this.startGameFlow(ctx, ctx.chat!.id, ctx.from!.id, false);
  }

  private async startGameFlow(ctx: any, chatId: number, userId: number, isCallback: boolean) {
    const lang = this.state.getLang(userId);
    const game = this.state.getGame(chatId);
    const reply = async (text: string, cb = false) => {
      if (cb) await ctx.answerCbQuery(text);
      else await ctx.reply(text);
    };

    if (!game || game.status !== 'lobby') {
      await reply(t(lang, 'no_active_game'), isCallback);
      return;
    }
    if (game.createdBy !== userId) {
      await reply(t(lang, 'only_creator_can_start'), isCallback);
      return;
    }
    if (game.players.length < 2) {
      await reply(t(lang, 'not_enough_players'), isCallback);
      return;
    }

    if (isCallback) {
      await ctx.answerCbQuery();
      try {
        await ctx.editMessageReplyMarkup(undefined);
      } catch {
        // ignore
      }
    }

    await this.doStartGame(chatId);
  }

  /** Core "flip cards and go" logic, usable both from a user action and from the auto-start timer. */
  private async doStartGame(chatId: number): Promise<void> {
    const game = this.state.getGame(chatId);
    if (!game || game.status !== 'lobby') return;

    this.clearLobbyTimer(chatId);
    startGame(game);
    const top = topCard(game);
    const first = currentPlayer(game);
    const lang = this.state.getLang(game.createdBy);

    const text = t(lang, 'game_started', {
      card: cardLabel(lang, top),
      player: first.name,
    });

    await this.sendGroupPhoto(chatId, START_BANNER, text);

    for (const p of game.players) {
      await this.sendHandIfTurn(game, p, true);
    }
  }

  /** Called after any join: if the lobby just filled up (10/10), start immediately. */
  private async checkAutoStartIfFull(chatId: number): Promise<void> {
    const game = this.state.getGame(chatId);
    if (!game || game.status !== 'lobby') return;
    if (game.players.length >= 10) {
      const lang = this.state.getLang(game.createdBy);
      await this.announce(chatId, t(lang, 'lobby_full_auto_start'));
      await this.doStartGame(chatId);
    }
  }

  private scheduleLobbyTimeout(chatId: number): void {
    this.clearLobbyTimer(chatId);
    const timer = setTimeout(() => {
      this.handleLobbyTimeout(chatId).catch(() => undefined);
    }, LOBBY_WAIT_MS);
    this.lobbyTimers.set(chatId, timer);
  }

  private clearLobbyTimer(chatId: number): void {
    const timer = this.lobbyTimers.get(chatId);
    if (timer) {
      clearTimeout(timer);
      this.lobbyTimers.delete(chatId);
    }
  }

  private async handleLobbyTimeout(chatId: number): Promise<void> {
    this.lobbyTimers.delete(chatId);
    const game = this.state.getGame(chatId);
    if (!game || game.status !== 'lobby') return;
    const lang = this.state.getLang(game.createdBy);

    if (game.players.length >= 2) {
      await this.announce(chatId, t(lang, 'lobby_timeout_auto_start'));
      await this.doStartGame(chatId);
    } else {
      this.state.deleteGame(chatId);
      await this.announce(chatId, t(lang, 'lobby_timeout_cancelled'));
    }
  }

  @Command('status')
  async onStatus(@Ctx() ctx: Context) {
    if (ctx.chat?.type === 'private') return;
    const chatId = ctx.chat!.id;
    const userId = ctx.from!.id;
    const lang = this.state.getLang(userId);
    const game = this.state.getGame(chatId);
    if (!game) {
      await ctx.reply(t(lang, 'no_active_game'));
      return;
    }
    if (game.status === 'lobby') {
      await ctx.reply(t(lang, 'status_lobby', { list: game.players.map((p) => p.name).join(', ') }));
    } else if (game.status === 'playing') {
      const counts = game.players.map((p) => `${p.name}: ${p.hand.length}`).join(', ');
      await ctx.reply(t(lang, 'status_playing', { name: currentPlayer(game).name, counts }));
    }
  }

  // ---------- gameplay ----------

  /** Sends (or resends) the player's hand as a private message if it is currently their turn, or always if force=true right after game start. */
  private async sendHandIfTurn(game: GameState, player: Player, force = false) {
    const isTurn = currentPlayer(game).id === player.id;
    if (!isTurn && !force) return;
    if (!this.state.hasStartedPrivate(player.id)) return; // can't DM them

    const lang = player.lang;
    const top = topCard(game);
    try {
      if (isTurn) {
        await this.bot.telegram.sendMessage(
          player.id,
          t(lang, 'your_turn_dm', { card: cardLabel(lang, top), color: colorLabel(lang, game.currentColor) }),
        );
      }
      await this.bot.telegram.sendMessage(
        player.id,
        t(lang, 'your_hand', { count: player.hand.length }),
        handKeyboard(game, lang, player.hand),
      );
    } catch {
      // user blocked the bot or hasn't opened a DM; ignore
    }
  }

  private async announce(chatId: number, text: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, text);
    } catch {
      // ignore
    }
  }

  /** Sends a decorative banner photo with a caption; silently falls back to plain text if the photo can't be fetched. */
  private async sendGroupPhoto(chatId: number, photoUrl: string, caption: string, extra: object = {}) {
    try {
      await this.bot.telegram.sendPhoto(chatId, photoUrl, { caption, ...extra });
    } catch {
      await this.announce(chatId, caption);
    }
  }

  private async afterTurnAdvance(game: GameState) {
    const next = currentPlayer(game);
    await this.announce(game.chatId, t(next.lang, 'turn_notice_group', { name: next.name }));
    await this.sendHandIfTurn(game, next);
  }

  @Action(/^play:(-?\d+):(.+)$/)
  async onPlay(@Ctx() ctx: any) {
    const chatId = Number(ctx.match[1]);
    const cardUid = ctx.match[2];
    const userId = ctx.from.id;
    const game = this.state.getGame(chatId);
    const lang = this.state.getLang(userId);

    if (!game || game.status !== 'playing') {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    const player = game.players.find((p) => p.id === userId);
    if (!player) {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    if (currentPlayer(game).id !== userId) {
      await ctx.answerCbQuery(t(lang, 'not_your_turn'));
      return;
    }
    const card = player.hand.find((c) => c.uid === cardUid);
    if (!card) {
      await ctx.answerCbQuery(t(lang, 'card_illegal'));
      return;
    }
    if (!canPlayCard(game, card)) {
      await ctx.answerCbQuery(t(lang, 'card_illegal'));
      return;
    }

    await ctx.answerCbQuery();

    if (card.color === 'wild') {
      await ctx.editMessageText(t(lang, 'you_played', { card: cardLabel(lang, card) }));
      await ctx.reply(t(lang, 'choose_color'), colorKeyboard(lang, chatId, cardUid));
      return;
    }

    const result = playCard(game, userId, cardUid);
    await ctx.editMessageText(t(lang, 'you_played', { card: cardLabel(lang, card) }));

    if (result.gameWon) {
      await this.sendGroupPhoto(chatId, WINNER_BANNER, t(lang, 'winner_msg', { name: player.name }));
      this.state.deleteGame(chatId);
      return;
    }

    await this.announceMoveEffects(game, player, card, result);
  }

  @Action(/^color:(-?\d+):(.+):(red|yellow|green|blue)$/)
  async onColor(@Ctx() ctx: any) {
    const chatId = Number(ctx.match[1]);
    const cardUid = ctx.match[2];
    const color = ctx.match[3] as Exclude<CardColor, 'wild'>;
    const userId = ctx.from.id;
    const game = this.state.getGame(chatId);
    const lang = this.state.getLang(userId);

    if (!game || game.status !== 'playing') {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    const player = game.players.find((p) => p.id === userId);
    if (!player || currentPlayer(game).id !== userId) {
      await ctx.answerCbQuery(t(lang, 'not_your_turn'));
      return;
    }
    const card = player.hand.find((c) => c.uid === cardUid);
    if (!card) {
      await ctx.answerCbQuery(t(lang, 'card_illegal'));
      return;
    }

    await ctx.answerCbQuery();
    const result = playCard(game, userId, cardUid, color);
    await ctx.editMessageText(
      t(lang, 'you_played', { card: cardLabel(lang, card) }) + ' -> ' + colorLabel(lang, color),
    );

    if (result.gameWon) {
      await this.sendGroupPhoto(chatId, WINNER_BANNER, t(lang, 'winner_msg', { name: player.name }));
      this.state.deleteGame(chatId);
      return;
    }

    await this.announce(chatId, t(lang, 'color_chosen', { name: player.name, color: colorLabel(lang, color) }));
    await this.announceMoveEffects(game, player, card, result, true);
  }

  private async announceMoveEffects(
    game: GameState,
    player: Player,
    card: { color: string; value: string },
    result: { skippedPlayers?: Player[] },
    colorAlreadyAnnounced = false,
  ) {
    if (!colorAlreadyAnnounced) {
      await this.announce(game.chatId, t(player.lang, 'card_played', { name: player.name, card: cardLabel(player.lang, card as any) }));
    }

    if (result.skippedPlayers?.length) {
      for (const skipped of result.skippedPlayers) {
        await this.announce(game.chatId, t(skipped.lang, 'skip_msg', { name: skipped.name }));
      }
    }
    if (card.value === 'reverse' && game.players.length > 2) {
      await this.announce(game.chatId, t(player.lang, 'reverse_msg'));
    }
    if (game.pendingDraw > 0) {
      const next = currentPlayer(game);
      await this.announce(game.chatId, t(next.lang, 'draw_pending', { name: next.name, count: game.pendingDraw }));
    }

    await this.afterTurnAdvance(game);
  }

  @Action(/^draw:(-?\d+)$/)
  async onDraw(@Ctx() ctx: any) {
    const chatId = Number(ctx.match[1]);
    const userId = ctx.from.id;
    const game = this.state.getGame(chatId);
    const lang = this.state.getLang(userId);

    if (!game || game.status !== 'playing') {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    const player = game.players.find((p) => p.id === userId);
    if (!player || currentPlayer(game).id !== userId) {
      await ctx.answerCbQuery(t(lang, 'not_your_turn'));
      return;
    }

    await ctx.answerCbQuery();
    const res = drawForCurrentPlayer(game, userId);
    await ctx.editMessageText(t(lang, 'you_drew', { count: res.drawn.length }));
    await this.announce(chatId, t(player.lang, 'drew_cards', { name: player.name, count: res.drawn.length }));
    await this.afterTurnAdvance(game);
  }

  @Action(/^uno:(-?\d+)$/)
  async onUnoCall(@Ctx() ctx: any) {
    const chatId = Number(ctx.match[1]);
    const userId = ctx.from.id;
    const game = this.state.getGame(chatId);
    const lang = this.state.getLang(userId);
    if (!game || game.status !== 'playing') {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    const player = game.players.find((p) => p.id === userId);
    if (!player) {
      await ctx.answerCbQuery();
      return;
    }
    const ok = callUno(game, userId);
    await ctx.answerCbQuery();
    if (ok) {
      await this.announce(chatId, t(lang, 'uno_called', { name: player.name }));
    }
  }

  @Action(/^catchuno:(-?\d+):(\d+)$/)
  async onCatchUno(@Ctx() ctx: any) {
    const chatId = Number(ctx.match[1]);
    const targetId = Number(ctx.match[2]);
    const game = this.state.getGame(chatId);
    const lang = this.state.getLang(ctx.from.id);
    if (!game || game.status !== 'playing') {
      await ctx.answerCbQuery(t(lang, 'no_active_game'));
      return;
    }
    const target = game.players.find((p) => p.id === targetId);
    if (!target) {
      await ctx.answerCbQuery();
      return;
    }
    const caught = catchMissedUno(game, targetId);
    await ctx.answerCbQuery();
    if (caught) {
      await this.announce(chatId, t(target.lang, 'uno_missed_penalty', { name: target.name }));
      await this.sendHandIfTurn(game, target, true);
    }
  }

  // Any player leaving the group chat also leaves an active lobby.
  @On('left_chat_member')
  async onLeftChatMember(@Ctx() ctx: any) {
    const chatId = ctx.chat?.id;
    const leftId = ctx.message?.left_chat_member?.id;
    if (!chatId || !leftId) return;
    const game = this.state.getGame(chatId);
    if (game && game.status === 'lobby') {
      removePlayer(game, leftId);
    }
  }
}
