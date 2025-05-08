import { Text, View, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const [userInfo, setUserInfo] = useState<{
    email: string | null;
    displayName: string | null;
    role: string | null;
    centerName: string | null;
  }>({
    email: null,
    displayName: null,
    role: null,
    centerName: null
  });

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Get admin's role and center information
        const { data: adminCenter } = await supabase
          .from('admin_centers')
          .select(`
            role,
            centers (
              name
            ),
            admins!inner (
              display_name
            )
          `)
          .eq('admin_id', user.id)
          .single();
        
        setUserInfo({
          email: user.email,
          displayName: adminCenter?.admins?.display_name || null,
          role: adminCenter?.role || null,
          centerName: adminCenter?.centers?.name || null
        });
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/login');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {userInfo.displayName && (
          <Text style={styles.userInfo}>
            Welcome, {userInfo.displayName}
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Image 
          source={require('../../assets/images/favicon.png')}
          style={styles.favicon}
          resizeMode="contain"
          accessibilityLabel="Donations Hub Logo"
        />

        <Text style={styles.title}>Welcome to Donations Hub</Text>
        <Text style={styles.subtitle}>
          Track and manage donations efficiently
        </Text>

        {userInfo.centerName && (
          <View style={styles.centerInfo}>
            <Ionicons name="business" size={24} color="#4CAF50" />
            <Text style={styles.centerText}>
              Associated Center: {userInfo.centerName}
            </Text>
          </View>
        )}

        <Text style={styles.description}>
          Your central platform for monitoring and managing donations distributed to people in need.
          Use the dashboard to view detailed records and ensure transparent donation tracking.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },
  logoutButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    backgroundColor: '#25292e',
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userEmail: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 14,
    color: '#666',
  },
  userInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  buttonContainer: {
    marginVertical: 20,
    gap: 10,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  heartGraphContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  graphLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: '#fff',
    bottom: 30,
    transform: [{ 
      rotate: '20deg'
    }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginVertical: 20,
    gap: 8,
  },
  centerText: {
    fontSize: 16,
    color: '#25292e',
    fontWeight: '500',
  },
  // Update existing styles
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#25292e',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4CAF50',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },
  favicon: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
});
