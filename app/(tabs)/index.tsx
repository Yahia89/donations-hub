import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { useState, useEffect } from 'react';

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

  const handleManageCenters = () => {
    if (userInfo.role === 'app_admin') {
      router.push('/centers');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {userInfo.displayName && (
          <Text style={styles.userInfo}>
            Welcome, {userInfo.displayName}
            {userInfo.centerName && ` (${userInfo.centerName})`}
          </Text>
        )}
        
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>Welcome to Donations Hub</Text>
      <Text style={styles.subtitle}>
        Track and manage donations efficiently
      </Text>
      
      <View style={styles.buttonContainer}>
        {userInfo.role === 'app_admin' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleManageCenters}
          >
            <Text style={styles.actionButtonText}>Manage Centers</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.description}>
        Your central platform for monitoring and managing donations distributed to people in need.
        Use the dashboard to view detailed records and ensure transparent donation tracking.
      </Text>
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
});
