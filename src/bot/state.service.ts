import { Injectable } from '@nestjs/common';
import { GameState, Lang } from '../game/game.types';
import { createGame } from '../game/game.engine';

@Injectable()
export class StateService {
  /** chatId -> current game in that group */
  private games = new Map<number, GameState>();
  /** userId -> chosen language (persists across games) */
  private userLangs = new Map<number, Lang>();
  /** userId -> has pressed /start in private chat with the bot */
  private startedPrivate = new Set<number>();
  /** userId -> the chatId of the group game they are currently active in (for DM routing) */
  private userActiveChat = new Map<number, number>();
  /** userId -> chatId of a lobby they tried to join before pressing /start in a private chat */
  private pendingJoins = new Map<number, number>();

  // ---------- usage analytics ----------
  /** every distinct user id that has ever interacted with the bot */
  private allUsers = new Set<number>();
  /** every distinct group chat id the bot has been used in */
  private allGroups = new Set<number>();
  private gamesStartedCount = 0;
  private gamesFinishedCount = 0;

  getGame(chatId: number): GameState | undefined {
    return this.games.get(chatId);
  }

  createGame(chatId: number, createdBy: number): GameState {
    const game = createGame(chatId, createdBy);
    this.games.set(chatId, game);
    return game;
  }

  deleteGame(chatId: number): void {
    this.games.delete(chatId);
  }

  getLang(userId: number): Lang {
    return this.userLangs.get(userId) ?? 'uz';
  }

  setLang(userId: number, lang: Lang): void {
    this.userLangs.set(userId, lang);
  }

  markPrivateStarted(userId: number): void {
    this.startedPrivate.add(userId);
  }

  hasStartedPrivate(userId: number): boolean {
    return this.startedPrivate.has(userId);
  }

  setActiveChat(userId: number, chatId: number): void {
    this.userActiveChat.set(userId, chatId);
  }

  getActiveChat(userId: number): number | undefined {
    return this.userActiveChat.get(userId);
  }

  clearActiveChat(userId: number, chatId: number): void {
    if (this.userActiveChat.get(userId) === chatId) {
      this.userActiveChat.delete(userId);
    }
  }

  setPendingJoin(userId: number, chatId: number): void {
    this.pendingJoins.set(userId, chatId);
  }

  getPendingJoin(userId: number): number | undefined {
    return this.pendingJoins.get(userId);
  }

  clearPendingJoin(userId: number): void {
    this.pendingJoins.delete(userId);
  }

  // ---------- usage analytics ----------

  recordUser(userId: number): void {
    this.allUsers.add(userId);
  }

  recordGroup(chatId: number): void {
    this.allGroups.add(chatId);
  }

  incrementGamesStarted(): void {
    this.gamesStartedCount += 1;
  }

  incrementGamesFinished(): void {
    this.gamesFinishedCount += 1;
  }

  getStats() {
    const activeGames = Array.from(this.games.values());
    const lobbies = activeGames.filter((g) => g.status === 'lobby');
    const playing = activeGames.filter((g) => g.status === 'playing');
    const playersInGames = playing.reduce((sum, g) => sum + g.players.length, 0);

    return {
      totalUsers: this.allUsers.size,
      totalGroups: this.allGroups.size,
      activeLobbies: lobbies.length,
      activeGames: playing.length,
      playersInGames,
      gamesStarted: this.gamesStartedCount,
      gamesFinished: this.gamesFinishedCount,
    };
  }
}
