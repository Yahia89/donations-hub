import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../utils/supabase';
import { Link, router } from 'expo-router';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from "expo-auth-session/build/QueryParams";
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();
// Update the redirectTo logic
const redirectTo = makeRedirectUri();

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const createSessionFromUrl = async (url: string) => {
    try {
      const { params, errorCode } = QueryParams.getQueryParams(url);
      if (errorCode) throw new Error(errorCode);
      
      const { access_token, refresh_token } = params;
      if (!access_token) return;

      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) throw error;
      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Handle deep linking
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)');
      }
    });

    // Handle incoming links
    const handleDeepLink = (event: { url: string }) => {
      createSessionFromUrl(event.url);
    };

    const urlListener = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        createSessionFromUrl(url);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      urlListener.remove();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);

    try {
      const { data: adminData } = await supabase
        .from('admins')
        .select('email')
        .eq('email', email)
        .single();

      if (!adminData) {
        Alert.alert('Error', 'Access denied. Only administrators can login.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: false, // Prevent new user creation
        }
      });

      if (error) throw error;
      Alert.alert('Success', 'If this email is registered, you will receive a login link.');
    } catch (error: any) {
      Alert.alert('Error', error.message);
      console.error('Error:', error);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Welcome to Donations Hub</Text>
      <Text style={styles.subtitle}>Enter your email to receive a magic link for secure login</Text>

      <View style={styles.formContainer}>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          If you are registered, you will receive a login link. Click on it to log in.
        </Text>

        <Text style={styles.contactText}>
          Please contact{' '}
          <Link href="mailto:info@techdevprime.com" style={styles.link}>
            admin
          </Link>
          {' '}for comments, concerns & any suggestions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#25292e',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#25292e',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 14,
  },
  contactText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#666',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
});