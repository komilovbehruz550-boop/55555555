export type CardColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';

export type CardValue =
  | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
  | 'skip' | 'reverse' | 'draw2'
  | 'wild' | 'wild4';

export interface Card {
  color: CardColor;
  value: CardValue;
  /** unique instance id, needed because a deck has duplicate color+value cards */
  uid: string;
}

export interface Player {
  id: number; // telegram user id
  name: string;
  lang: Lang;
  hand: Card[];
  saidUno: boolean;
}

export type Lang = 'uz' | 'ru' | 'en';

export type GameStatus = 'lobby' | 'playing' | 'finished';

export interface GameState {
  chatId: number;
  status: GameStatus;
  players: Player[];
  deck: Card[];
  discard: Card[];
  currentIndex: number;
  direction: 1 | -1;
  currentColor: CardColor; // active color (matters after wild)
  pendingDraw: number; // accumulated draw2/draw4 stack
  createdBy: number;
  winnerId?: number;
}
