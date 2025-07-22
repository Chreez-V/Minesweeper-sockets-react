import GameBoard from '@/components/GameBoard';
import GameStatus from '@/components/GameStatus';
import { checkWinCondition, createBoard, revealCell, toggleFlag } from '@/constants/gameLogic';
import { Cell, GameConfig, GameState } from '@/constants/gameType';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View, Text } from 'react-native';
import { Socket } from 'socket.io-client';

interface GameScreenProps {
  gameConfig: GameConfig;
  onBack: () => void;
  socket?: Socket;
  roomId?: string;
  initialBoard?: Cell[][];
  initialGameState?: GameState;
  playerName?: string;
  initialCurrentPlayerTurnId?: string | null;
}

const GameScreen: React.FC<GameScreenProps> = ({
  gameConfig,
  onBack,
  socket,
  roomId,
  initialBoard,
  initialGameState,
  playerName,
  initialCurrentPlayerTurnId,
}) => {
  const [board, setBoard] = useState<Cell[][]>(() => initialBoard || createBoard(gameConfig));
  const [gameState, setGameState] = useState<GameState>(() => initialGameState || {
    board: createBoard(gameConfig),
    gameOver: false,
    gameWon: false,
    bombsLeft: gameConfig.bombs,
    moves: 0,
  });
  const [command, setCommand] = useState('');
  const [currentPlayerTurnId, setCurrentPlayerTurnId] = useState<string | null>(initialCurrentPlayerTurnId || null);
  const [playersInRoom, setPlayersInRoom] = useState<{ [socketId: string]: { id: string; name: string } }>({});

  // Effect for multiplayer updates
  useEffect(() => {
    if (socket && roomId) {
      const handleBoardUpdate = (updatedBoard: Cell[][], updatedGameState: GameState, currentTurnId: string) => {
        // Asegurarse de que todas las celdas tienen sus propiedades completas
        const completeBoard = updatedBoard.map(row => 
          row.map(cell => ({
            id: cell.id || `${cell.row}-${cell.col}`,
            row: cell.row,
            col: cell.col,
            isBomb: cell.isBomb,
            isRevealed: cell.isRevealed,
            isFlagged: cell.isFlagged,
            neighborBombs: cell.neighborBombs || 0 // Asegurar que siempre tenga valor
          }))
        );
        
        setBoard(completeBoard);
        setGameState(updatedGameState);
        setCurrentPlayerTurnId(currentTurnId);
      };

      socket.on('boardUpdate', handleBoardUpdate);
      socket.on('gameOver', (gameWon: boolean) => {
        setGameState(prev => ({ ...prev, gameOver: true, gameWon }));
      });
      socket.on('roomUpdate', setPlayersInRoom);
      socket.on('turnError', (message: string) => {
        Alert.alert('Error de Turno', message);
      });
      socket.on('turnUpdate', setCurrentPlayerTurnId);

      return () => {
        socket.off('boardUpdate', handleBoardUpdate);
        socket.off('gameOver');
        socket.off('roomUpdate');
        socket.off('turnError');
        socket.off('turnUpdate');
      };
    }
  }, [socket, roomId]);

  // Effect for game over/win conditions
  useEffect(() => {
    if (gameState.gameOver || gameState.gameWon) {
      const message = gameState.gameWon
        ? '¡Ganaste! 😎'
        : '¡Boom! Perdiste 💥';

      Alert.alert('Fin del juego', message, [
        { text: 'OK', onPress: () => onBack() }
      ]);
    }
  }, [gameState.gameOver, gameState.gameWon, onBack]);

  const handleCommand = () => {
    if (gameState.gameOver || gameState.gameWon) return;
    
    if (socket && socket.id !== currentPlayerTurnId) {
      Alert.alert('No es tu turno', 'Por favor, espera tu turno para realizar una acción.');
      setCommand('');
      return;
    }

    const parts = command.trim().toLowerCase().split(' ');
    const action = parts[0];
    const coords = parts[1]?.split(',');

    // Special commands
    if (action === 'help') {
      Alert.alert('Ayuda', 'Comandos:\n- reveal 3,4 (o r 3,4) - Revelar celda\n- flag 2,5 (o f 2,5) - Marcar/desmarcar bandera\n- exit - Salir del juego');
      setCommand('');
      return;
    }

    if (action === 'exit') {
      onBack();
      return;
    }

    // Validate game commands
    if (!coords || coords.length !== 2) {
      Alert.alert('Error', 'Formato incorrecto. Usa: [acción] [fila,columna]');
      setCommand('');
      return;
    }

    const row = parseInt(coords[0]);
    const col = parseInt(coords[1]);

    if (isNaN(row) || isNaN(col) ||
      row < 0 || row >= gameConfig.rows ||
      col < 0 || col >= gameConfig.cols) {
      Alert.alert('Error', 'Coordenadas inválidas');
      setCommand('');
      return;
    }

    // Multiplayer mode - emit action to server
    if (socket && roomId) {
      if (action === 'r' || action === 'reveal' || action === 'f' || action === 'flag') {
        socket.emit('playerAction', roomId, action === 'r' || action === 'reveal' ? 'reveal' : 'flag', row, col);
      } else {
        Alert.alert('Error', 'Acción desconocida. Usa "reveal" o "flag"');
      }
    } else {
      // Single player mode
      let newBoard = [...board];
      let newBombsLeft = gameState.bombsLeft;
      let newGameState = { ...gameState };

      if (action === 'r' || action === 'reveal') {
        newBoard = revealCell(board, row, col);
        if (board[row][col].isBomb) {
          newGameState.gameOver = true;
        }
      } else if (action === 'f' || action === 'flag') {
        const result = toggleFlag(board, row, col, gameState.bombsLeft);
        newBoard = result.newBoard;
        newBombsLeft = result.newBombsLeft;
      } else {
        Alert.alert('Error', 'Acción desconocida. Usa "reveal" o "flag"');
        setCommand('');
        return;
      }

      const isGameWon = checkWinCondition(newBoard);

      setBoard(newBoard);
      setGameState({
        ...newGameState,
        bombsLeft: newBombsLeft,
        moves: gameState.moves + 1,
        gameWon: isGameWon
      });
    }

    setCommand('');
  };

  const isMyTurn = socket && socket.id === currentPlayerTurnId;
  const currentPlayerName = currentPlayerTurnId ? (playersInRoom[currentPlayerTurnId]?.name || 'Cargando...') : 'N/A';
  const myPlayerName = playerName || 'Tú';

  return (
    <View style={styles.container}>
      {socket && roomId && (
        <View style={styles.turnIndicatorContainer}>
          <Text style={styles.turnIndicatorText}>
            Turno de: <Text style={styles.currentPlayerName}>{currentPlayerName}</Text>
          </Text>
          <Text style={[styles.turnStatusText, isMyTurn ? styles.myTurn : styles.otherTurn]}>
            {isMyTurn ? '¡ES TU TURNO!' : 'ESPERA TU TURNO'}
          </Text>
        </View>
      )}

      {!gameState.gameOver && !gameState.gameWon && (
        <View style={styles.commandContainer}>
          <TextInput
            style={styles.input}
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={handleCommand}
            placeholder={isMyTurn ? "Ej: reveal 5,4 o flag 3,2" : "Esperando tu turno..."}
            editable={isMyTurn && !gameState.gameOver && !gameState.gameWon}
            placeholderTextColor="#0f0"
          />
        </View>
      )}

      <GameStatus
        bombsLeft={gameState.bombsLeft}
        moves={gameState.moves}
        gameOver={gameState.gameOver}
        gameWon={gameState.gameWon}
        onBack={onBack}
      />

      <View style={styles.boardContainer}>
        <GameBoard
          board={board}
          gameOver={gameState.gameOver}
          gameWon={gameState.gameWon}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  boardContainer: {
    flex: 1,
    marginVertical: 10,
  },
  commandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    color: '#0f0',
    fontFamily: 'monospace',
    marginRight: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0f0',
    color: '#0f0',
    fontFamily: 'monospace',
    padding: 8,
    borderRadius: 5,
  },
  turnIndicatorContainer: {
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#111',
    borderRadius: 5,
  },
  turnIndicatorText: {
    color: '#40E0D0',
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  currentPlayerName: {
    color: '#0f0',
    fontSize: 18,
  },
  turnStatusText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 5,
    fontWeight: 'bold',
  },
  myTurn: {
    color: '#0f0',
  },
  otherTurn: {
    color: '#FFA500',
  },
});

export default GameScreen;
