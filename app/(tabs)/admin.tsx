import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../utils/supabase';
import { Picker } from '@react-native-picker/picker';

interface Center {
  id: string;
  name: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  display_name: string;
  center_id: string;
  role: string;
  status: string;
  created_at: string;
  completed_at?: string;
  center_name?: string;
}

export default function AdminPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<Center[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  
  // Form state
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedRole, setSelectedRole] = useState('center_admin');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkUserRole();
    loadCenters();
    loadPendingInvitations();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to access this page');
        return;
      }

      // Check if user has app_admin role
      const { data: adminData, error } = await supabase
        .from('admin_centers')
        .select('role')
        .eq('admin_id', user.id)
        .eq('role', 'app_admin')
        .single();

      if (error || !adminData) {
        setUserRole('unauthorized');
      } else {
        setUserRole('app_admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setUserRole('unauthorized');
    } finally {
      setLoading(false);
    }
  };

  const loadCenters = async () => {
    try {
      const { data, error } = await supabase
        .from('centers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCenters(data || []);
    } catch (error) {
      console.error('Error loading centers:', error);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_invitations')
        .select(`
          *,
          centers(name)
        `)
        .in('status', ['pending', 'completed']) // Show both pending and completed
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data?.map(item => ({
        ...item,
        center_name: item.centers?.name || 'Unknown Center'
      })) || [];
      
      setPendingInvitations(formattedData);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    }
  };

  const handleInviteUser = async () => {
    if (!email || !displayName || !selectedCenter) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: {
          email: email.toLowerCase().trim(),
          display_name: displayName.trim(),
          center_id: selectedCenter,
          role: selectedRole
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
  
      Alert.alert('Success', `Invitation sent to ${email}`);
      
      // Reset form
      setEmail('');
      setDisplayName('');
      setSelectedCenter('');
      setSelectedRole('center_admin'); // Updated default value
      
      // Reload pending invitations
      loadPendingInvitations();
      
    } catch (error: any) {
      console.error('Error inviting user:', error);
      Alert.alert('Error', error.message || 'Failed to invite user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      
      Alert.alert('Success', 'Invitation resent successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('pending_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
      
      Alert.alert('Success', 'Invitation cancelled');
      loadPendingInvitations();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel invitation');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking permissions...</Text>
      </View>
    );
  }

  if (userRole === 'unauthorized') {
    return (
      <View style={styles.unauthorizedContainer}>
        <Ionicons name="lock-closed" size={64} color="#FF3B30" />
        <Text style={styles.unauthorizedTitle}>Access Denied</Text>
        <Text style={styles.unauthorizedText}>
          You need app admin privileges to access this page.
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'completed': return '#34C759';
      case 'cancelled': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const renderInvitationItem = ({ item }: { item: PendingInvitation }) => (
    <View style={styles.invitationCard}>
      <View style={styles.invitationHeader}>
        <Text style={styles.invitationEmail}>{item.email}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.invitationStatus}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      <Text style={styles.invitationDetail}>Name: {item.display_name}</Text>
      <Text style={styles.invitationDetail}>Center: {item.center_name}</Text>
      <Text style={styles.invitationDetail}>Role: {item.role}</Text>
      <Text style={styles.invitationDate}>
        Invited: {new Date(item.created_at).toLocaleDateString()}
      </Text>
      {item.completed_at && (
        <Text style={styles.completedDate}>
          Completed: {new Date(item.completed_at).toLocaleDateString()}
        </Text>
      )}
      
      {item.status === 'pending' && (
        <View style={styles.invitationActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.resendButton]}
            onPress={() => handleResendInvitation(item.id, item.email)}
          >
            <Text style={styles.actionButtonText}>Resend</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelInvitation(item.id)}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="people" size={32} color="#007AFF" />
        <Text style={styles.title}>User Management</Text>
      </View>

      {/* Invite User Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invite New User</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="user@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name *</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="John Doe"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Center *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCenter}
              onValueChange={setSelectedCenter}
              style={styles.picker}
            >
              <Picker.Item label="Select a center..." value="" />
              {centers.map((center) => (
                <Picker.Item
                  key={center.id}
                  label={center.name}
                  value={center.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Role</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedRole}
              onValueChange={setSelectedRole}
              style={styles.picker}
            >
              <Picker.Item label="Center Admin" value="center_admin" />
              <Picker.Item label="Treasurer" value="treasurer" />
              <Picker.Item label="Viewer" value="viewer" />
              <Picker.Item label="Exporter" value="exporter" />
              <Picker.Item label="App Admin" value="app_admin" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.inviteButton, submitting && styles.disabledButton]}
          onPress={handleInviteUser}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.inviteButtonText}>Send Invitation</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Pending Invitations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Invitations</Text>
        
        {pendingInvitations.length === 0 ? (
          <Text style={styles.emptyText}>No invitations found</Text>
        ) : (
          <FlatList
            data={pendingInvitations}
            renderItem={renderInvitationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthorizedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  picker: {
    height: 50,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  invitationCard: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  invitationStatus: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  invitationDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginBottom: 12,
  },
  invitationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  resendButton: {
    backgroundColor: '#34C759',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});