import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface GameStatusProps {
  bombsLeft: number;
  moves: number;
  onBack: () => void;
}

const GameStatus: React.FC<GameStatusProps> = ({ bombsLeft, moves, onBack }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Bombas: {bombsLeft}</Text>
        <Text style={styles.statusText}>Movimientos: {moves}</Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>MENÚ</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusText: {
    color: '#0f0',
    fontFamily: 'monospace',
    marginRight: 15,
  },
  backButton: {
    backgroundColor: '#222',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#0f0',
  },
  backButtonText: {
    color: '#0f0',
    fontFamily: 'monospace',
  },
});

export default GameStatus;
