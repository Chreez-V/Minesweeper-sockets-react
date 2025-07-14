import { Cell, GameConfig } from './gameType';

// Definimos GameMode si no está en gameType.ts
type GameMode = 'easy' | 'medium' | 'hard' | 'custom';

export const createBoard = (config: GameConfig): Cell[][] => {
  const { rows, cols, bombs } = config;
  const board: Cell[][] = [];
  
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

  // Optimización: Colocar bombas aleatoriamente usando algoritmo Fisher-Yates
  let availableCells = Array.from({ length: rows * cols }, (_, i) => i);
  let bombsPlaced = 0;

  while (bombsPlaced < bombs && availableCells.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const cellIndex = availableCells.splice(randomIndex, 1)[0];
    const row = Math.floor(cellIndex / cols);
    const col = cellIndex % cols;
    board[row][col].isBomb = true;
    bombsPlaced++;
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
  // Validar índices primero
  if (row < 0 || row >= board.length || col < 0 || col >= board[0]?.length) {
    return board;
  }

  // Crear copia profunda del tablero
  const newBoard = board.map(row => row.map(cell => ({ ...cell })));
  
  const cell = newBoard[row][col];

  if (cell.isRevealed || cell.isFlagged) return newBoard;

  cell.isRevealed = true;

  if (cell.isBomb) return newBoard;

  // Revelado recursivo solo si no hay bombas alrededor
  if (cell.neighborBombs === 0) {
    for (let r = Math.max(0, row - 1); r <= Math.min(newBoard.length - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(newBoard[0].length - 1, col + 1); c++) {
        if (!newBoard[r][c].isRevealed && !newBoard[r][c].isFlagged) {
          const updatedBoard = revealCell(newBoard, r, c);
          // Actualizar el estado local con los cambios
          updatedBoard.forEach((updatedRow, i) => {
            updatedRow.forEach((updatedCell, j) => {
              if (updatedCell.isRevealed) {
                newBoard[i][j].isRevealed = true;
              }
            });
          });
        }
      }
    }
  }

  return newBoard;
};

export const toggleFlag = (board: Cell[][], row: number, col: number, bombsLeft: number): { newBoard: Cell[][], newBombsLeft: number } => {
  // Validar índices
  if (row < 0 || row >= board.length || col < 0 || col >= board[0]?.length) {
    return { newBoard: board, newBombsLeft: bombsLeft };
  }

  const newBoard = board.map(row => [...row]);
  const cell = newBoard[row][col];

  // No permitir colocar banderas si no quedan bombas por marcar
  if (bombsLeft <= 0 && !cell.isFlagged) {
    return { newBoard: board, newBombsLeft: bombsLeft };
  }

  if (!cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged;
    const bombChange = cell.isFlagged ? -1 : 1;
    return { 
      newBoard, 
      newBombsLeft: Math.max(0, bombsLeft + bombChange) // Nunca menor que 0
    };
  }

  return { newBoard, newBombsLeft: bombsLeft };
};

export const checkWinCondition = (board: Cell[][]): boolean => {
  // Verificar dos condiciones:
  // 1. Todas las celdas no bombas están reveladas
  // 2. Todas las bombas están marcadas con banderas
  const allNonBombsRevealed = board.every(row => 
    row.every(cell => 
      cell.isBomb || cell.isRevealed
    )
  );
  
  const allBombsFlagged = board.every(row =>
    row.every(cell =>
      !cell.isBomb || cell.isFlagged
    )
  );

  return allNonBombsRevealed && allBombsFlagged;
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
        bombs: customConfig?.bombs || 20
      };
    default:
      return { rows: 8, cols: 8, bombs: 10};
  }
};

// Función utilitaria adicional
export const countFlagsAround = (board: Cell[][], row: number, col: number): number => {
  let count = 0;
  for (let r = Math.max(0, row - 1); r <= Math.min(board.length - 1, row + 1); r++) {
    for (let c = Math.max(0, col - 1); c <= Math.min(board[0].length - 1, col + 1); c++) {
      if (board[r][c].isFlagged) count++;
    }
  }
  return count;
};
