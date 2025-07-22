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

// --- MODIFICACIÓN CLAVE EN revealCell ---
export const revealCell = (board: Cell[][], row: number, col: number): Cell[][] => {
    // Validar índices primero
    if (row < 0 || row >= board.length || col < 0 || col >= board[0]?.length) {
        return board; // Devolver el tablero original si los índices son inválidos
    }

    const cell = board[row][col];

    // Si ya está revelada o marcada, no hacer nada y devolver el tablero original
    if (cell.isRevealed || cell.isFlagged) {
        return board;
    }

    // Crear una copia profunda del tablero para mantener la inmutabilidad
    // Esto es crucial para que React y el servidor detecten los cambios
    let newBoard = board.map(r => r.map(c => ({ ...c })));
    let currentCell = newBoard[row][col];

    currentCell.isRevealed = true; // Revelar la celda actual

    // Si es una bomba, el juego termina (esta lógica se manejará fuera de esta función,
    // pero la celda se marca como revelada aquí)
    if (currentCell.isBomb) {
        return newBoard;
    }

    // Revelado recursivo solo si no hay bombas alrededor (celda vacía)
    if (currentCell.neighborBombs === 0) {
        // Usamos una pila (stack) para gestionar las celdas a visitar
        // Esto evita problemas de recursión profunda y permite un mejor control
        const stack: { r: number, c: number }[] = [{ r: row, c: col }];
        const visited: Set<string> = new Set(); // Para evitar bucles infinitos

        while (stack.length > 0) {
            const { r, c } = stack.pop()!;
            const id = `${r}-${c}`;

            if (visited.has(id)) {
                continue;
            }
            visited.add(id);

            const cellToProcess = newBoard[r][c];

            // Si la celda no está revelada y no está marcada, revelarla
            if (!cellToProcess.isRevealed && !cellToProcess.isFlagged) {
                cellToProcess.isRevealed = true;

                // Si es una celda vacía (0 bombas vecinas), añadir sus vecinos a la pila
                if (cellToProcess.neighborBombs === 0) {
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            if (dr === 0 && dc === 0) continue; // No la celda actual

                            const nRow = r + dr;
                            const nCol = c + dc;

                            // Verificar límites del tablero
                            if (nRow >= 0 && nRow < newBoard.length && nCol >= 0 && nCol < newBoard[0].length) {
                                const neighborCell = newBoard[nRow][nCol];
                                // Solo añadir si no está revelada y no está marcada
                                if (!neighborCell.isRevealed && !neighborCell.isFlagged) {
                                    stack.push({ r: nRow, c: nCol });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    return newBoard;
};

// --- MODIFICACIÓN CLAVE EN toggleFlag ---
export const toggleFlag = (board: Cell[][], row: number, col: number, bombsLeft: number): { newBoard: Cell[][], newBombsLeft: number } => {
    // Validar índices
    if (row < 0 || row >= board.length || col < 0 || col >= board[0]?.length) {
        return { newBoard: board, newBombsLeft: bombsLeft };
    }

    const cell = board[row][col];

    // No permitir colocar banderas si no quedan bombas por marcar Y la celda no tiene una bandera ya
    if (bombsLeft <= 0 && !cell.isFlagged) {
        return { newBoard: board, newBombsLeft: bombsLeft };
    }

    if (!cell.isRevealed) {
        // Crear una nueva copia de la celda modificada para mantener la inmutabilidad
        const updatedCell = { ...cell, isFlagged: !cell.isFlagged };

        // Crear una nueva copia profunda del tablero con la celda actualizada
        const newBoard = board.map((r, rIdx) =>
            rIdx === row
                ? r.map((c, cIdx) => (cIdx === col ? updatedCell : { ...c })) // Copia la celda actualizada
                : r.map(c => ({ ...c })) // Copia las otras filas y sus celdas
        );

        const bombChange = updatedCell.isFlagged ? -1 : 1; // Ajuste basado en el nuevo estado de la bandera
        return {
            newBoard,
            newBombsLeft: bombsLeft + bombChange // Permitir que sea negativo temporalmente si desmarca una bomba con 0 left. Math.max(0, ...) se manejará en el estado.
        };
    }

    return { newBoard: board, newBombsLeft: bombsLeft };
};

export const checkWinCondition = (board: Cell[][]): boolean => {
    let allNonBombsRevealed = true;
    let allBombsFlagged = true;
    let totalBombs = 0;
    let flaggedBombs = 0;

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[0].length; col++) {
            const cell = board[row][col];
            if (cell.isBomb) {
                totalBombs++;
                if (cell.isFlagged) {
                    flaggedBombs++;
                }
            } else {
                if (!cell.isRevealed) {
                    allNonBombsRevealed = false;
                }
            }
        }
    }
    // Una condición de victoria clásica es que todas las celdas no bombas estén reveladas
    // O que todas las bombas estén correctamente marcadas y no haya banderas extra
    // La segunda parte (allBombsFlagged) es más compleja para multijugador y se puede simplificar
    // a solo revelar las no-bombas. Aquí usaremos la lógica clásica de Minesweeper.
    return allNonBombsRevealed && (totalBombs === flaggedBombs);
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
            return { rows: 8, cols: 8, bombs: 10 };
    }
};

// Función utilitaria adicional
export const countFlagsAround = (board: Cell[][], row: number, col: number): number => {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(board.length - 1, row + 1); r++) {
        for (let c = Math.max(0, col - 1); c <= Math.min(board[0].length - 1, board[0].length + 1); c++) {
            if (board[r]?.[c]?.isFlagged) count++; // Asegura que la celda exista
        }
    }
    return count;
};