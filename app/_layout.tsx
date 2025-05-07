import { Stack, router } from 'expo-router';
import { StatusBar } from 'react-native';
import { useEffect } from 'react';
import { supabase } from '../utils/supabase';

export default function RootLayout() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => subscription.unsubscribe();
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
        <Stack.Screen 
          name="recipient/[id]" 
          options={{ 
            headerShown: true,
            headerTitle: "Recipient Details",
            headerBackTitle: "Back"
          }} 
        />
      </Stack>
    </>
  );
}
