import { getGameConfig } from '@/constants/gameLogic';
import { Cell, GameConfig, GameMode, GameState, Player } from '@/constants/gameType';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import GameScreen from './GameScreen';

interface MultiplayerMenuProps {
  onBack: () => void;
}

const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({ onBack }) => {
  const [serverIp, setServerIp] = useState('10.15.53.183'); 
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('Jugador');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [inGame, setInGame] = useState(false);
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
  const [board, setBoard] = useState<Cell[][] | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [playersInRoom, setPlayersInRoom] = useState<{ [socketId: string]: Player }>({});
  const [selectedGameMode, setSelectedGameMode] = useState<GameMode | null>(null);
  const [customConfig, setCustomConfig] = useState({
    rows: 10,
    cols: 10,
    bombs: 20,
  });

  // Effect to manage socket connection
  useEffect(() => {
    if (serverIp) {
      const newSocket = io(`http://${serverIp}:3000`);

      newSocket.on('connect', () => {
        console.log('Connected to Socket.IO server');
        Alert.alert('Conexión Exitosa', `Conectado al servidor: ${serverIp}`);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from Socket.IO server');
        Alert.alert('Desconectado', 'Se ha perdido la conexión con el servidor.');
        setInGame(false);
        setSocket(null);
        setGameConfig(null);
        setBoard(null);
        setGameState(null);
        setCurrentRoomId(null);
        setPlayersInRoom({});
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
        Alert.alert('Error de Conexión', `No se pudo conectar al servidor: ${err.message}. Asegúrate de que la IP sea correcta y el servidor esté corriendo.`);
        setSocket(null);
      });

      newSocket.on('gameCreated', (id: string, initialBoard: Cell[][], initialGameState: GameState, config: GameConfig) => {
        setCurrentRoomId(id);
        setBoard(initialBoard);
        setGameState(initialGameState);
        setGameConfig(config);
        setInGame(true);
        Alert.alert('Partida Creada', `ID de la Partida: ${id}`);
      });

      newSocket.on('gameJoined', (id: string, initialBoard: Cell[][], initialGameState: GameState, config: GameConfig) => {
        setCurrentRoomId(id);
        setBoard(initialBoard);
        setGameState(initialGameState);
        setGameConfig(config);
        setInGame(true);
        Alert.alert('Partida Unida', `Te has unido a la partida: ${id}`);
      });

      newSocket.on('joinError', (message: string) => {
        Alert.alert('Error al Unirse', message);
      });

      newSocket.on('boardUpdate', (updatedBoard: Cell[][], updatedGameState: GameState) => {
        setBoard(updatedBoard);
        setGameState(updatedGameState);
      });

      newSocket.on('playerJoined', (player: Player) => {
        setPlayersInRoom(prev => ({ ...prev, [player.id]: player }));
        Alert.alert('Jugador Conectado', `${player.name} se ha unido a la partida.`);
      });

      newSocket.on('playerLeft', (playerId: string) => {
        setPlayersInRoom(prev => {
          const newPlayers = { ...prev };
          const leftPlayerName = newPlayers[playerId]?.name || 'Un jugador';
          delete newPlayers[playerId];
          Alert.alert('Jugador Desconectado', `${leftPlayerName} ha abandonado la partida.`);
          return newPlayers;
        });
      });

      newSocket.on('roomUpdate', (updatedPlayers: { [socketId: string]: Player }) => {
        setPlayersInRoom(updatedPlayers);
      });

      newSocket.on('gameOver', (gameWon: boolean) => {
        const message = gameWon ? '¡Ganaste! 😎' : '¡Boom! Perdiste 💥';
        Alert.alert('Fin del juego', message, [
          { text: 'OK', onPress: () => {
            setInGame(false);
            newSocket.disconnect(); // Disconnect after game ends
            onBack();
          }}
        ]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [serverIp]); // Reconnect if serverIp changes

  const handleCreateGame = () => {
    if (!socket || !socket.connected) {
      Alert.alert('Error', 'No conectado al servidor. Asegúrate de que la IP sea correcta y el servidor esté corriendo.');
      return;
    }
    if (!selectedGameMode) {
      Alert.alert('Error', 'Por favor, selecciona un modo de juego.');
      return;
    }
    const config = getGameConfig(selectedGameMode, selectedGameMode === 'custom' ? customConfig : undefined);
    socket.emit('createGame', selectedGameMode, selectedGameMode === 'custom' ? customConfig : undefined, playerName);
  };

  const handleJoinGame = () => {
    if (!socket || !socket.connected) {
      Alert.alert('Error', 'No conectado al servidor. Asegúrate de que la IP sea correcta y el servidor esté corriendo.');
      return;
    }
    if (!roomId) {
      Alert.alert('Error', 'Por favor, introduce un ID de partida.');
      return;
    }
    socket.emit('joinGame', roomId, playerName);
  };

  if (inGame && board && gameState && gameConfig && socket && currentRoomId) {
    return (
      <GameScreen
        gameConfig={gameConfig}
        initialBoard={board}
        initialGameState={gameState}
        socket={socket}
        roomId={currentRoomId}
        onBack={() => {
          socket.disconnect(); // Disconnect when leaving game
          setInGame(false);
          onBack();
        }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>MULTIJUGADOR</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración del Servidor</Text>
          <View style={styles.inputRow}>
            <Text style={styles.label}>IP del Servidor:</Text>
            <TextInput
              style={styles.input}
              value={serverIp}
              onChangeText={setServerIp}
              placeholder="Ej: 192.168.1.X"
              autoCapitalize="none"
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.label}>Tu Nombre:</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Jugador"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Crear Partida</Text>
          <TouchableOpacity
            style={[styles.button, selectedGameMode === 'easy' && styles.selectedButton]}
            onPress={() => setSelectedGameMode('easy')}
          >
            <Text style={styles.buttonText}>FÁCIL (8x8, 10 bombas)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, selectedGameMode === 'medium' && styles.selectedButton]}
            onPress={() => setSelectedGameMode('medium')}
          >
            <Text style={styles.buttonText}>MEDIO (16x16, 40 bombas)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, selectedGameMode === 'hard' && styles.selectedButton]}
            onPress={() => setSelectedGameMode('hard')}
          >
            <Text style={styles.buttonText}>DIFÍCIL (16x30, 99 bombas)</Text>
          </TouchableOpacity>

          <View style={styles.customContainer}>
            <Text style={styles.sectionTitle}>PERSONALIZADO</Text>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Filas:</Text>
              <TextInput style={styles.input} keyboardType="numeric"
                value={customConfig.rows.toString()}
                onChangeText={(text) => setCustomConfig({ ...customConfig, rows: parseInt(text) || 10 })}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Columnas:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customConfig.cols.toString()}
                onChangeText={(text) => setCustomConfig({ ...customConfig, cols: parseInt(text) || 10 })}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.label}>Bombas:</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={customConfig.bombs.toString()}
                onChangeText={(text) => setCustomConfig({ ...customConfig, bombs: parseInt(text) || 20 })}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, selectedGameMode === 'custom' && styles.selectedButton]}
              onPress={() => setSelectedGameMode('custom')}
            >
              <Text style={styles.buttonText}>SELECCIONAR PERSONALIZADO</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={handleCreateGame}>
            <Text style={styles.actionButtonText}>CREAR PARTIDA</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unirse a Partida</Text>
          <View style={styles.inputRow}>
            <Text style={styles.label}>ID de Partida:</Text>
            <TextInput
              style={styles.input}
              value={roomId}
              onChangeText={setRoomId}
              placeholder="Introduce el ID de la partida"
              autoCapitalize="characters"
            />
          </View>
          <TouchableOpacity style={styles.actionButton} onPress={handleJoinGame}>
            <Text style={styles.actionButtonText}>UNIRSE A PARTIDA</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.buttonText}>VOLVER AL MENÚ PRINCIPAL</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    color: '#40E0D0',
    fontSize: 28,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    padding: 10,
  },
  backButtonText: {
    color: '#0f0',
    fontSize: 16,
    fontFamily: 'monospace',
  },
  section: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#0f0',
    paddingTop: 15,
  },
  sectionTitle: {
    color: '#0f0',
    fontSize: 18,
    fontFamily: 'monospace',
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#0f0',
    fontFamily: 'monospace',
    width: 120,
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
  button: {
    backgroundColor: '#222',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#000',
  },
  selectedButton: {
    backgroundColor: '#000050',
    borderColor: '#0f0',
  },
  buttonText: {
    color: '#0f0',
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: '#40E0D0',
    padding: 15,
    marginVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0f0',
  },
  actionButtonText: {
    color: '#000',
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  customContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#0f0',
  },
  backButton: {
    marginTop: 30,
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0f0',
  },
});

export default MultiplayerMenu;
