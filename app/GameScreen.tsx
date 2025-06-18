import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { GameConfig } from '@/constants/gameType';
import { createBoard, revealCell, toggleFlag, checkWinCondition } from '@/constants/gameLogic';
import GameBoard from '@/components/GameBoard';
import GameStatus from '@/components/GameStatus';

interface GameScreenProps {
  gameConfig: GameConfig;
  onBack: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({ gameConfig, onBack }) => {
  const [board, setBoard] = useState(() => createBoard(gameConfig));
  const [gameState, setGameState] = useState({
    gameOver: false,
    gameWon: false,
    bombsLeft: gameConfig.bombs,
    moves: 0,
  });
  const [command, setCommand] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (gameState.gameOver || gameState.gameWon) {
      const message = gameState.gameWon 
        ? '¡Ganaste! 😎' 
        : '¡Boom! Perdiste 💥';
      Alert.alert('Fin del juego', message, [
        { text: 'OK', onPress: () => onBack() }
      ]);
    }
  }, [gameState.gameOver, gameState.gameWon]);

const handleCommand = () => {
  if (gameState.gameOver || gameState.gameWon) return;

  const parts = command.trim().toLowerCase().split(' ');
  const action = parts[0];
  const coords = parts[1]?.split(',');

  // Comandos especiales
  if (action === 'help') {
    setShowHelp(!showHelp);
    setCommand('');
    return;
  }

  if (action === 'exit') {
    onBack();
    return;
  }

  // Validar comandos de juego
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

  let newBoard = [...board];
  let newBombsLeft = gameState.bombsLeft;
  let newGameOver = gameState.gameOver;
  let newGameWon = gameState.gameWon;
  let newGameState = { ...gameState }; // Creamos copia del estado

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

  // Verificar condición de victoria
  const isGameWon = checkWinCondition(newBoard);

  // Actualizar estado
  setBoard(newBoard);
  setGameState({
    ...newGameState,
    bombsLeft: newBombsLeft,
    moves: gameState.moves + 1,
    gameWon: isGameWon
  });

  setCommand('');

  // Mostrar mensaje de victoria
  if (newGameWon) {
    Alert.alert(
      '¡Ganaste!', 
      `Completaste el juego en ${gameState.moves + 1} movimientos`,
      [{ text: 'OK', onPress: onBack }]
    );
  }
};

  return (


  <View style={styles.container}>
    <GameStatus 
      bombsLeft={gameState.bombsLeft} 
      moves={gameState.moves}
      gameOver={gameState.gameOver}
      gameWon={gameState.gameWon}
      onBack={onBack} 
    />
    
    <GameBoard 
      board={board} 
      gameOver={gameState.gameOver} 
      gameWon={gameState.gameWon} 
    />
    
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
  </View>      

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
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
