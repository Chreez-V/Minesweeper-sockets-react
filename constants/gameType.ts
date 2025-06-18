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
