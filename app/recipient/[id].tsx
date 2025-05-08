import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { recipientService } from '../../services/recipientService';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';

type Recipient = {
  id: string;
  name: string;
  date: string;
  address: string;
  phone_number: string;
  driver_license: string;
  marital_status: 'single' | 'married';
  zakat_requests: number;
  notes: string;
  status: string;
  center_id: string;
  center_name?: string;
};

export default function RecipientDetails() {
  const { id } = useLocalSearchParams();
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchRecipient = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check admin status
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        const { data: adminData } = await supabase
          .from('admin_centers')
          .select('role')
          .eq('admin_id', user.id)
          .single();
          
        setIsAdmin(adminData?.role === 'app_admin');
      }

      const data = await recipientService.getRecipientById(id as string);
      if (!data) {
        throw new Error('Recipient not found');
      }
      setRecipient(data as Recipient);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', err.message);
      setTimeout(() => router.back(), 1500);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRecipient();
  }, [fetchRecipient]);

  const handleRetry = () => {
    fetchRecipient();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator 
          size="large" 
          color="#25292e" 
          accessibilityLabel="Loading recipient details"
        />
      </View>
    );
  }

  if (error || !recipient) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error || 'Recipient not found'}
        </Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading recipient"
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: recipient.name,
          headerBackTitle: 'Back',
          headerStyle: {
            backgroundColor: '#f8f8f8',
          },
          headerShadowVisible: false,
        }}
      />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text 
            style={styles.name}
            accessibilityLabel={`Recipient name: ${recipient.name}`}
          >
            {recipient.name}
          </Text>
          <View style={[
            styles.statusContainer,
            recipient.status === 'active' ? styles.statusActive : styles.statusInactive
          ]}>
            <Text style={styles.status}>{recipient.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.label}>Registration Date:</Text>
            <Text style={styles.value}>
              {new Date(recipient.date).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{recipient.address || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color="#666" />
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{recipient.phone_number || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="card-outline" size={20} color="#666" />
            <Text style={styles.label}>Driver License:</Text>
            <Text style={styles.value}>{recipient.driver_license || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color="#666" />
            <Text style={styles.label}>Marital Status:</Text>
            <Text style={styles.value}>{recipient.marital_status}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="gift-outline" size={20} color="#666" />
            <Text style={styles.label}>Zakat Requests:</Text>
            <Text style={styles.value}>{recipient.zakat_requests}</Text>
          </View>

          {(recipient.center_name && isAdmin) && (
            <View style={styles.infoRow}>
              <Ionicons name="business-outline" size={20} color="#666" />
              <Text style={styles.label}>Center:</Text>
              <Text style={styles.value}>{recipient.center_name}</Text>
            </View>
          )}
        </View>

        {recipient.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text 
              style={styles.notesText}
              accessibilityLabel={`Notes: ${recipient.notes}`}
            >
              {recipient.notes}
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#25292e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f8f8f8',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#25292e',
    marginBottom: 8,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
  },
  statusInactive: {
    backgroundColor: '#ffebee',
  },
  status: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  section: {
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  label: {
    fontSize: 16,
    color: '#666',
    flex: 1,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    color: '#25292e',
    flex: 2,
    lineHeight: 24,
  },
  notesSection: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  notesLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#25292e',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
});