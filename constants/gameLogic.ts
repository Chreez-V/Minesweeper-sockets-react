import { Cell, GameConfig, GameState } from '../types/gameTypes';

export const createBoard = (config: GameConfig): Cell[][] => {
  const { rows, cols, bombs } = config;
  const board: Cell[][] = [];
  const totalCells = rows * cols;

  // Crear matriz vacía
  for (let row = 0; row < rows; row++) {
    const newRow: Cell[] = [];
    for (let col = 0; col < cols; col++) {
      newRow.push({
        id: `${row}-${col}`,
        row,
        col,
        isBomb: false,
        isRevealed: false,
        isFlagged: false,
        neighborBombs: 0,
      });
    }
    board.push(newRow);
  }

  // Colocar bombas aleatoriamente
  let bombsPlaced = 0;
  while (bombsPlaced < bombs) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);
    
    if (!board[randomRow][randomCol].isBomb) {
      board[randomRow][randomCol].isBomb = true;
      bombsPlaced++;
    }
  }

  // Calcular bombas vecinas
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!board[row][col].isBomb) {
        let count = 0;
        
        // Verificar las 8 celdas circundantes
        for (let r = Math.max(0, row - 1); r <= Math.min(rows - 1, row + 1); r++) {
          for (let c = Math.max(0, col - 1); c <= Math.min(cols - 1, col + 1); c++) {
            if (board[r][c].isBomb) count++;
          }
        }
        
        board[row][col].neighborBombs = count;
      }
    }
  }

  return board;
};

export const revealCell = (board: Cell[][], row: number, col: number): Cell[][] => {
  const newBoard = [...board];
  const cell = newBoard[row][col];

  if (cell.isRevealed || cell.isFlagged) return newBoard;

  cell.isRevealed = true;

  // Si es una bomba, termina el juego
  if (cell.isBomb) {
    return newBoard;
  }

  // Si no tiene bombas alrededor, revelar celdas vecinas
  if (cell.neighborBombs === 0) {
    for (let r = Math.max(0, row - 1); r <= Math.min(newBoard.length - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(newBoard[0].length - 1, col + 1); c++) {
        if (!newBoard[r][c].isRevealed && !newBoard[r][c].isFlagged) {
          newBoard = revealCell(newBoard, r, c);
        }
      }
    }
  }

  return newBoard;
};

export const toggleFlag = (board: Cell[][], row: number, col: number): Cell[][] => {
  const newBoard = [...board];
  const cell = newBoard[row][col];

  if (!cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged;
  }

  return newBoard;
};

export const checkWinCondition = (board: Cell[][]): boolean => {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      const cell = board[row][col];
      if (!cell.isBomb && !cell.isRevealed) {
        return false;
      }
    }
  }
  return true;
};

export const getGameConfig = (mode: GameMode, customConfig?: Partial<GameConfig>): GameConfig => {
  switch (mode) {
    case 'easy':
      return { rows: 8, cols: 8, bombs: 10 };
    case 'medium':
      return { rows: 16, cols: 16, bombs: 40 };
    case 'hard':
      return { rows: 16, cols: 30, bombs: 99 };
    case 'custom':
      return {
        rows: customConfig?.rows || 10,
        cols: customConfig?.cols || 10,
        bombs: customConfig?.bombs || 20,
      };
    default:
      return { rows: 8, cols: 8, bombs: 10 };
  }
};
