import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create a simple in-memory storage
const createMemoryStorage = () => {
  // For web, use sessionStorage which persists only for the current tab/window
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return {
      setItem: async (key: string, value: string) => {
        window.sessionStorage.setItem(key, value);
      },
      getItem: async (key: string) => {
        return window.sessionStorage.getItem(key);
      },
      removeItem: async (key: string) => {
        window.sessionStorage.removeItem(key);
      },
    };
  }
  
  // For native, use a simple in-memory object
  // This will clear when the app is closed
  const memoryStore: Record<string, string> = {};
  
  return {
    setItem: async (key: string, value: string) => {
      memoryStore[key] = value;
    },
    getItem: async (key: string) => {
      return memoryStore[key] || null;
    },
    removeItem: async (key: string) => {
      delete memoryStore[key];
    },
  };
};

const authConfig = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: Platform.OS === 'web',
  storage: createMemoryStorage(),
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
