"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateService = void 0;
const common_1 = require("@nestjs/common");
const game_engine_1 = require("../game/game.engine");
let StateService = class StateService {
    constructor() {
        this.games = new Map();
        this.userLangs = new Map();
        this.startedPrivate = new Set();
        this.userActiveChat = new Map();
        this.pendingJoins = new Map();
    }
    getGame(chatId) {
        return this.games.get(chatId);
    }
    createGame(chatId, createdBy) {
        const game = (0, game_engine_1.createGame)(chatId, createdBy);
        this.games.set(chatId, game);
        return game;
    }
    deleteGame(chatId) {
        this.games.delete(chatId);
    }
    getLang(userId) {
        return this.userLangs.get(userId) ?? 'uz';
    }
    setLang(userId, lang) {
        this.userLangs.set(userId, lang);
    }
    markPrivateStarted(userId) {
        this.startedPrivate.add(userId);
    }
    hasStartedPrivate(userId) {
        return this.startedPrivate.has(userId);
    }
    setActiveChat(userId, chatId) {
        this.userActiveChat.set(userId, chatId);
    }
    getActiveChat(userId) {
        return this.userActiveChat.get(userId);
    }
    clearActiveChat(userId, chatId) {
        if (this.userActiveChat.get(userId) === chatId) {
            this.userActiveChat.delete(userId);
        }
    }
    setPendingJoin(userId, chatId) {
        this.pendingJoins.set(userId, chatId);
    }
    getPendingJoin(userId) {
        return this.pendingJoins.get(userId);
    }
    clearPendingJoin(userId) {
        this.pendingJoins.delete(userId);
    }
};
exports.StateService = StateService;
exports.StateService = StateService = __decorate([
    (0, common_1.Injectable)()
], StateService);
//# sourceMappingURL=state.service.js.map