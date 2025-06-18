import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { GameMode } from '../../constants/gameType';
import GameScreen from './GameScreen';
import { getGameConfig } from '../../constants/gameLogic';

const MainMenu = () => {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [customConfig, setCustomConfig] = useState({
    rows: 10,
    cols: 10,
    bombs: 20,
  });

  if (gameMode) {
    return (
      <GameScreen 
        gameConfig={getGameConfig(gameMode, customConfig)} 
        onBack={() => setGameMode(null)} 
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BUSCAMINAS RETRO</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setGameMode('easy')}
      >
        <Text style={styles.buttonText}>FÁCIL (8x8, 10 bombas)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setGameMode('medium')}
      >
        <Text style={styles.buttonText}>MEDIO (16x16, 40 bombas)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setGameMode('hard')}
      >
        <Text style={styles.buttonText}>DIFÍCIL (16x30, 99 bombas)</Text>
      </TouchableOpacity>
      
      <View style={styles.customContainer}>
        <Text style={styles.sectionTitle}>PERSONALIZADO</Text>
        
        <View style={styles.inputRow}>
          <Text style={styles.label}>Filas:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={customConfig.rows.toString()}
            onChangeText={(text) => setCustomConfig({...customConfig, rows: parseInt(text) || 10})}
          />
        </View>
        
        <View style={styles.inputRow}>
          <Text style={styles.label}>Columnas:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={customConfig.cols.toString()}
            onChangeText={(text) => setCustomConfig({...customConfig, cols: parseInt(text) || 10})}
          />
        </View>
        
        <View style={styles.inputRow}>
          <Text style={styles.label}>Bombas:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={customConfig.bombs.toString()}
            onChangeText={(text) => setCustomConfig({...customConfig, bombs: parseInt(text) || 20})}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setGameMode('custom')}
        >
          <Text style={styles.buttonText}>JUGAR PERSONALIZADO</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: '#0f0',
    fontSize: 24,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#222',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#0f0',
  },
  buttonText: {
    color: '#0f0',
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  customContainer: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#0f0',
    paddingTop: 20,
  },
  sectionTitle: {
    color: '#0f0',
    fontSize: 18,
    fontFamily: 'monospace',
    marginBottom: 15,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    color: '#0f0',
    fontFamily: 'monospace',
    width: 100,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#0f0',
    color: '#0f0',
    fontFamily: 'monospace',
    padding: 8,
  },
});

export default MainMenu;
