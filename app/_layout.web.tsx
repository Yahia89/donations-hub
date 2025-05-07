import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { loadAsync } from 'expo-font';

export default function RootLayout() {
  useEffect(() => {
    loadAsync({
      'Ionicons': require('../assets/fonts/Ionicons.ttf'),
      'MaterialIcons': require('../assets/fonts/MaterialIcons.ttf'),
      'MaterialCommunityIcons': require('../assets/fonts/MaterialCommunityIcons.ttf'),
      'Material Icons': require('../assets/fonts/MaterialIcons.ttf'),
      'Material Design Icons': require('../assets/fonts/MaterialCommunityIcons.ttf')
    }).catch(err => console.warn('Font loading error:', err));
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