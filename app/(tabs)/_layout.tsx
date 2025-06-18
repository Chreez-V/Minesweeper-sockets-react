import React from 'react';

import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import {Colors} from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />
      <Tabs.Screen
        name="GameScreen"
        options={{
          title: 'Juego',
        }}
      />
    </Tabs>
  );
}
