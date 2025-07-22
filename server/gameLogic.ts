import { Cell, GameConfig } from './gameType';


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

    // Colocar bombas aleatoriamente
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
    if (row < 0 || row >= board.length || col < 0 || col >= board[0]?.length) {
        return board;
    }

    const cell = board[row][col];

    if (cell.isRevealed || cell.isFlagged) {
        return board;
    }

    // Crear una copia profunda del tablero
    const newBoard = board.map(r => r.map(c => ({ ...c })));
    const currentCell = { ...newBoard[row][col] };
    newBoard[row][col] = currentCell;

    currentCell.isRevealed = true;

    if (currentCell.isBomb) {
        return newBoard;
    }

    // Revelado recursivo optimizado
    if (currentCell.neighborBombs === 0) {
        const stack: { r: number, c: number }[] = [{ r: row, c: col }];
        const visited = new Set<string>();

        while (stack.length > 0) {
            const { r, c } = stack.pop()!;
            const cellId = `${r}-${c}`;

            if (visited.has(cellId)) continue;
            visited.add(cellId);

            const cellToReveal = newBoard[r][c];
            if (cellToReveal.isFlagged) continue;

            // Asegurarse de que estamos trabajando con una copia actualizada
            const updatedCell = { ...cellToReveal, isRevealed: true };
            newBoard[r][c] = updatedCell;

            if (updatedCell.neighborBombs === 0) {
                // Explorar vecinos
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;

                        const nRow = r + dr;
                        const nCol = c + dc;

                        if (nRow >= 0 && nRow < newBoard.length && nCol >= 0 && nCol < newBoard[0].length) {
                            const neighbor = newBoard[nRow][nCol];
                            if (!neighbor.isRevealed && !neighbor.isFlagged) {
                                stack.push({ r: nRow, c: nCol });
                            }
                        }
                    }
                }
            }
        }
    }

    return newBoard;
};

export const toggleFlag = (board: Cell[][], row: number, col: number, bombsLeft: number): { newBoard: Cell[][], newBombsLeft: number } => {
    if (row < 0 || row >= board.length || col < 0 || col >= board[0]?.length) {
        return { newBoard: board, newBombsLeft: bombsLeft };
    }

    const cell = board[row][col];

    if (bombsLeft <= 0 && !cell.isFlagged) {
        return { newBoard: board, newBombsLeft: bombsLeft };
    }

    if (!cell.isRevealed) {
        const newBoard = board.map(r => r.map(c => ({ ...c })));
        const updatedCell = { ...newBoard[row][col], isFlagged: !newBoard[row][col].isFlagged };
        newBoard[row][col] = updatedCell;

        return {
            newBoard,
            newBombsLeft: bombsLeft + (updatedCell.isFlagged ? -1 : 1)
        };
    }

    return { newBoard: board, newBombsLeft: bombsLeft };
};

export const checkWinCondition = (board: Cell[][]): boolean => {
    let allNonBombsRevealed = true;
    let totalBombs = 0;
    let flaggedBombs = 0;

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[0].length; col++) {
            const cell = board[row][col];
            if (cell.isBomb) {
                totalBombs++;
                if (cell.isFlagged) flaggedBombs++;
            } else if (!cell.isRevealed) {
                allNonBombsRevealed = false;
            }
        }
    }

    return allNonBombsRevealed || (totalBombs === flaggedBombs);
};

export const getGameConfig = (mode: GameMode, customConfig?: Partial<GameConfig>): GameConfig => {
    switch (mode) {
        case 'easy': return { rows: 8, cols: 8, bombs: 10 };
        case 'medium': return { rows: 16, cols: 16, bombs: 40 };
        case 'hard': return { rows: 16, cols: 30, bombs: 99 };
        case 'custom': return {
            rows: customConfig?.rows || 10,
            cols: customConfig?.cols || 10,
            bombs: customConfig?.bombs || 20
        };
        default: return { rows: 8, cols: 8, bombs: 10 };
    }
};

export const countFlagsAround = (board: Cell[][], row: number, col: number): number => {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(board.length - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(board[0].length - 1, col + 1); c++) {
            if (board[r]?.[c]?.isFlagged) count++;
        }
    }
    return count;
};
