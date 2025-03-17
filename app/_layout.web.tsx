import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { loadAsync } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

export default function RootLayout() {
  useEffect(() => {
    loadAsync(Ionicons.font);
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Stack screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#fff' },
      }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
      </Stack>
    </>
  );
}