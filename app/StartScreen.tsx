import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MainMenu from './MainMenu';
import MultiplayerMenu from './MultiplayerMenu';

interface StartScreenProps {
  onBack?: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onBack = () => {} }) => {
  const [gameMode, setGameMode] = useState<'single' | 'multi' | null>(null);

  if (gameMode === 'single') {
    return (
      <MainMenu
        onBack={() => {
          setGameMode(null);
          onBack();
        }}
      />
    );
  }

  if (gameMode === 'multi') {
    return (
      <MultiplayerMenu
        onBack={() => {
          setGameMode(null);
          onBack();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BUSCAMINAS RETRO</Text>

      <TouchableOpacity
        style={styles.modeButton}
        onPress={() => setGameMode('single')}
      >
        <Text style={styles.buttonText}>1 JUGADOR</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.modeButton}
        onPress={() => setGameMode('multi')}
      >
        <Text style={styles.buttonText}>MULTIJUGADOR</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#40E0D0', // Turquesa
    fontSize: 32,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#40E0D0',
    fontSize: 16,
    fontFamily: 'monospace',
    marginBottom: 40,
  },
  modeButton: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    marginVertical: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#40E0D0',
    width: '80%',
  },
  buttonText: {
    color: '#40E0D0',
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default StartScreen;
