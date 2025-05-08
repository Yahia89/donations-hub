import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a custom storage implementation
const customStorage = {
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('Error setting storage item:', error);
    }
  },
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('Error getting storage item:', error);
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Error removing storage item:', error);
    }
  }
};

const authConfig = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: Platform.OS === 'web',
  storage: customStorage,
  storageKey: 'supabase-auth-token',
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authConfig,
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Profile': 'public'
    }
  }
});
