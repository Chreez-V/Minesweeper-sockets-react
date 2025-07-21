// Constants/gameType.ts
export type GameMode = 'easy' | 'medium' | 'hard' | 'custom';

export interface GameConfig {
  rows: number;
  cols: number;
  bombs: number;
}

export interface Cell {
  id: string;
  row: number;
  col: number;
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborBombs: number;
}

export interface GameState {
  board: Cell[][];
  gameOver: boolean;
  gameWon: boolean;
  bombsLeft: number;
  moves: number;
}

export interface GameStatusProps {
  bombsLeft: number;
  moves: number;
  gameOver: boolean; 
  gameWon: boolean; 
  onBack: () => void;
}

// New interfaces for multiplayer
export interface Player {
  id: string;
  name: string;
}

export interface RoomState {
  id: string;
  players: { [socketId: string]: Player };
  board: Cell[][];
  gameConfig: GameConfig;
  gameState: {
    gameOver: boolean;
    gameWon: boolean;
    bombsLeft: number;
    moves: number;
  };
  hostId: string;
}