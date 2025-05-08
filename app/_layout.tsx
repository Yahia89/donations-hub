import { Stack, router } from 'expo-router';
import { StatusBar } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/login');
      } else if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

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
