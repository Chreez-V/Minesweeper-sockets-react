import React from 'react';
import { StyleSheet, View } from 'react-native';
import MainMenu from './MainMenu';

export default function App() {
  return (
    <View style={styles.container}>
      <MainMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
