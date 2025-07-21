// App/index.tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import StartScreen from './StartScreen'; // Import StartScreen as the main entry point

export default function App() {
  return (
    <View style={styles.container}>
      <StartScreen /> {/* Render StartScreen as the initial component */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
