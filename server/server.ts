// server/server.ts
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { checkWinCondition, createBoard, getGameConfig, revealCell, toggleFlag } from './gameLogic';
import { Cell, GameConfig, GameMode } from './gameType';

// Define the structure for a game room
interface GameRoom {
    id: string;
    players: { [socketId: string]: { id: string; name: string; } };
    board: Cell[][];
    gameConfig: GameConfig;
    gameState: {
        gameOver: boolean;
        gameWon: boolean;
        bombsLeft: number;
        moves: number;
    };
    hostId: string; // The socket ID of the player who created the room
    currentPlayerTurnId: string | null;
}

const app = express();
app.use(cors()); // Enable CORS for all origins

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for development
        methods: ["GET", "POST"]
    }
});

const gameRooms: { [roomId: string]: GameRoom } = {};

// Creador de ID ALEATORIO para la sala
const generateRoomId = (): string => {
    let id: string;
    do {
        id = Math.random().toString(36).substring(2, 8).toUpperCase();
    } while (gameRooms[id]);
    return id;
};

io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // evento a crear una nueva sala
    socket.on('createGame', (gameMode: GameMode, customConfig?: Partial<GameConfig>, playerName: string = 'Player 1') => {
        const roomConfig = getGameConfig(gameMode, customConfig);
        const initialBoard = createBoard(roomConfig);
        const roomId = generateRoomId();

        gameRooms[roomId] = {
            id: roomId,
            players: {
                [socket.id]: { id: socket.id, name: playerName }
            },
            board: initialBoard,
            gameConfig: roomConfig,
            gameState: {
                gameOver: false,
                gameWon: false,
                bombsLeft: roomConfig.bombs,
                moves: 0,
            },
            hostId: socket.id,
            currentPlayerTurnId: socket.id,
        };

        socket.join(roomId);
        console.log(`Game room created: ${roomId} by ${playerName} (${socket.id}). Host has the first turn.`);
        io.to(socket.id).emit('gameCreated', roomId, gameRooms[roomId].board, gameRooms[roomId].gameState, gameRooms[roomId].gameConfig,gameRooms[roomId].currentPlayerTurnId);
        io.to(roomId).emit('playerJoined', gameRooms[roomId].players[socket.id]);
        io.to(roomId).emit('roomUpdate', gameRooms[roomId].players);
    });

    // Event to join an existing game room
    socket.on('joinGame', (roomId: string, playerName: string = 'Player 2') => {
        const room = gameRooms[roomId];
        if (room) {
            if (Object.keys(room.players).length >= 2) { // Limit to 2 players for now
                io.to(socket.id).emit('joinError', 'Room is full.');
                return;
            }
            socket.join(roomId);
            room.players[socket.id] = { id: socket.id, name: playerName };
            console.log(`Client ${playerName} (${socket.id}) joined room: ${roomId}`);
            io.to(socket.id).emit('gameJoined', roomId, room.board, room.gameState, room.gameConfig,room.currentPlayerTurnId);
            io.to(roomId).emit('playerJoined', room.players[socket.id]);
            io.to(roomId).emit('roomUpdate', room.players); // Notify all players about the new player
        } else {
            io.to(socket.id).emit('joinError', 'Room not found.');
        }
    });

    // Event for player actions (reveal or flag)
    socket.on('playerAction', (roomId: string, action: 'reveal' | 'flag', row: number, col: number) => {

        const room = gameRooms[roomId];

        if (!room || room.gameState.gameOver || room.gameState.gameWon) {
            return; // Game is over or room doesn't exist
        }
          // Check if it's the current player's turn
        if (socket.id !== room.currentPlayerTurnId) {
            io.to(socket.id).emit('turnError', 'It is not your turn.');
            return;
        }

        let newBoard = room.board.map(r => r.map(c => ({ ...c }))); // Deep copy
        let newBombsLeft = room.gameState.bombsLeft;
        let newGameOver: boolean = room.gameState.gameOver;
        let newGameWon: boolean = room.gameState.gameWon;

        if (action === 'reveal') {
             const originalCell = newBoard[row][col];
            newBoard = revealCell(newBoard, row, col);
            if (newBoard[row][col].isBomb && !originalCell.isRevealed) {
                newGameOver = true;
                newBoard = newBoard.map(r => r.map(c => c.isBomb ? { ...c, isRevealed: true } : c));
            }
        } else if (action === 'flag') {
            const result = toggleFlag(newBoard, row, col, room.gameState.bombsLeft);
            newBoard = result.newBoard;
            newBombsLeft = result.newBombsLeft;
        }
 newGameWon = checkWinCondition(newBoard);
        if (newGameWon) {
            newGameOver = true; // Game is over if won
        }
        newGameWon = checkWinCondition(newBoard);

        // Update room state
        room.board = newBoard;
        room.gameState = {
            ...room.gameState,
            bombsLeft: newBombsLeft,
            moves: room.gameState.moves + 1,
            gameOver: newGameOver,
            gameWon: newGameWon,
        };

        // Determine the next player's turn
         if (!newGameOver) {
        const playerIds = Object.keys(room.players);
        const currentPlayerIndex = playerIds.indexOf(socket.id);
        const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
        room.currentPlayerTurnId = playerIds[nextPlayerIndex];
         } else{
          // If game is over, keep the current player as the last one to act
            room.currentPlayerTurnId = socket.id; 
        }
        // Emit updated board, game state, and current turn to all players in the room
        io.to(roomId).emit('boardUpdate', room.board, room.gameState, room.currentPlayerTurnId);

        if (newGameOver || newGameWon) {
            io.to(roomId).emit('gameOver', room.gameState.gameWon);
            // Optionally, remove the room after some time or on explicit request
           
        }
   
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Find which room the disconnected client was in
        for (const roomId in gameRooms) {
            if (gameRooms[roomId].players[socket.id]) {
                const room = gameRooms[roomId];
                delete room.players[socket.id];
                console.log(`Player ${socket.id} left room ${roomId}`);

                if (Object.keys(room.players).length === 0) {
                    // If no players left, delete the room
                    delete gameRooms[roomId];
                    console.log(`Room ${roomId} deleted as it's empty.`);
                } else {
                    // Notify remaining players that someone left
                    io.to(roomId).emit('playerLeft', socket.id);
                    io.to(roomId).emit('roomUpdate', room.players);
                    // If the host left, assign a new host
                    if (room.hostId === socket.id) {
                        const newHostId = Object.keys(room.players)[0];
                        if (newHostId) {
                            room.hostId = newHostId;
                            io.to(roomId).emit('newHost', newHostId);
                            console.log(`New host for room ${roomId}: ${newHostId}`);
                        }
                    }
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
    console.log(`To connect from a mobile device on the same network, use your local IP address (e.g., http://192.168.1.X:${PORT})`);
});
