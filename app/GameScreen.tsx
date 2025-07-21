import GameBoard from '@/components/GameBoard';
import GameStatus from '@/components/GameStatus';
import { checkWinCondition, createBoard, revealCell, toggleFlag } from '@/constants/gameLogic'; // Keep these for initial board creation/local logic if needed
import { Cell, GameConfig, GameState } from '@/constants/gameType';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { Socket } from 'socket.io-client'; // Import Socket type


interface GameScreenProps {
  gameConfig: GameConfig;
  onBack: () => void;
  socket?: Socket; // Socket.IO client instance for multiplayer
  roomId?: string; // Room ID for multiplayer game
  initialBoard?: Cell[][];
  initialGameState?: GameState;
  playerName?: string; // Current player's name for display
}


const GameScreen: React.FC<GameScreenProps> = ({
  gameConfig,
  onBack,
  socket,
  roomId,
  initialBoard,
  initialGameState,
}) => {
  // Use initial board and game state if provided (for multiplayer)
  const [board, setBoard] = useState<Cell[][]>(() => initialBoard || createBoard(gameConfig));
  const [gameState, setGameState] = useState<GameState>(() => initialGameState || {
     board: createBoard(gameConfig),
     gameOver: false,
    gameWon: false,
    bombsLeft: gameConfig.bombs,
    moves: 0,
  });
  const [command, setCommand] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Effect for multiplayer updates
  useEffect(() => {
    if (socket && roomId) {
      // Listen for board updates from the server
      socket.on('boardUpdate', (updatedBoard: Cell[][], updatedGameState: GameState) => {
        setBoard(updatedBoard);
        setGameState(updatedGameState);
      });

      // Listen for game over event from server
      socket.on('gameOver', (gameWon: boolean) => {
        setGameState(prevState => ({ ...prevState, gameOver: true, gameWon: gameWon }));
      });

      return () => {
        // Clean up listeners on unmount
        socket.off('boardUpdate');
        socket.off('gameOver');
      };
    }
  }, [socket, roomId]);

  // Effect for local game over/win conditions (and for multiplayer when server signals it)
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

    const parts = command.trim().toLowerCase().split(' ');
    const action = parts[0];
    const coords = parts[1]?.split(',');

    // Special commands
    if (action === 'help') {
      setShowHelp(!showHelp);
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

    // If in multiplayer mode, emit action to server
    if (socket && roomId) {
      if (action === 'r' || action === 'reveal' || action === 'f' || action === 'flag') {
        socket.emit('playerAction', roomId, action === 'r' || action === 'reveal' ? 'reveal' : 'flag', row, col);
      } else {
        Alert.alert('Error', 'Acción desconocida. Usa "reveal" o "flag"');
      }
    } else {
      // Single player mode logic (existing logic)
      let newBoard = [...board];
      let newBombsLeft = gameState.bombsLeft;
      let newGameOver = gameState.gameOver;
      let newGameWon = gameState.gameWon;
      let newGameState = { ...gameState };

      if (action === 'r' || action === 'reveal') {
        newBoard = revealCell(board, row, col);
        if (board[row][col].isBomb) {
          newGameState = { ...newGameState, gameOver: true };
        }
      }
      else if (action === 'f' || action === 'flag') {
        const result = toggleFlag(board, row, col, gameState.bombsLeft);
        newBoard = result.newBoard;
        newBombsLeft = result.newBombsLeft;
      }
      else {
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

  return (
    <View style={styles.container}>
      {!gameState.gameOver && !gameState.gameWon && (
        <View style={styles.commandContainer}>
          <TextInput
            style={styles.input}
            value={command}
            onChangeText={setCommand}
            onSubmitEditing={handleCommand}
            placeholder="Ej: reveal 5,4 o flag 3,2"
            editable={!gameState.gameOver && !gameState.gameWon}
          />
        </View>
      )}

    <GameStatus
        bombsLeft={gameState.bombsLeft}
        moves={gameState.moves}

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
  },
  helpButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButtonText: {
    color: '#000',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpContainer: {
    marginTop: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#0f0',
  },
  helpText: {
    color: '#0f0',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});

export default GameScreen;