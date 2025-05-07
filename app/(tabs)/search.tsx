import { useState, useEffect, useCallback } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recipientService } from '../../services/recipientService';
import { supabase } from '../../utils/supabase';
import { router, useFocusEffect } from 'expo-router';
import debounce from 'lodash.debounce';

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

function highlightText(text: string, query: string): JSX.Element {
  if (!query) return <Text accessibilityLabel={text}>{text}</Text>;

  const words = query.split(/\s+/).filter(Boolean).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <Text accessibilityLabel={text}>{text}</Text>;
  
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text accessibilityLabel={text}>
      {parts.map((part, index) =>
        part.match(regex) ? (
          <Text key={index} style={styles.highlight}>
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [userCenter, setUserCenter] = useState<{ id: string; isAdmin: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUserCenter = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          // Redirect to login if not authenticated
          router.replace('/login');
          return;
        }

        if (user?.id) {
          const { data: adminData, error } = await supabase
            .from('admin_centers')
            .select(`
              center_id,
              role,
              centers (
                name
              )
            `)
            .eq('admin_id', user.id)
            .single();

          if (error) throw error;
          if (adminData) {
            setUserCenter({
              id: adminData.center_id,
              isAdmin: adminData.role === 'app_admin'
            });
          }
        }
      } catch (err: any) {
        if (err.message?.includes('Not authenticated')) {
          router.replace('/login');
        } else {
          setError('Failed to load user center information');
          Alert.alert('Error', 'Failed to load user information. Please try again.');
        }
      }
    };
    getUserCenter();
  }, []);

  // Modify the debounced search to handle auth errors
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) return;

      setHasSearched(true);
      setLoading(true);
      setError(null);
      try {
        const data = await recipientService.searchRecipients(query);
        setRecipients(data as Recipient[]);
      } catch (error: any) {
        if (error.message?.includes('Not authenticated')) {
          router.replace('/login');
        } else {
          setError(error.message);
          Alert.alert('Search Error', error.message);
        }
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Validation', 'Please enter a search term');
      return;
    }
    Keyboard.dismiss();
    debouncedSearch(searchQuery);
  };

  const handleClear = () => {
    setSearchQuery('');
    setRecipients([]);
    setHasSearched(false);
    setError(null);
    Keyboard.dismiss();
  };

  const handleRecipientPress = (recipient: Recipient) => {
    router.push({
      pathname: '/recipient/[id]',
      params: { id: recipient.id }
    });
  };

  const renderRecipientItem = ({ item }: { item: Recipient }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed
      ]}
      onPress={() => handleRecipientPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{highlightText(item.name, searchQuery)}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
      
      <View style={styles.cardContent}>
        {userCenter?.isAdmin && (
          <Text style={styles.label}>
            Center: <Text style={styles.value}>{item.center_name || 'N/A'}</Text>
          </Text>
        )}
        <Text style={styles.label}>
          Date: <Text style={styles.value}>{new Date(item.date).toLocaleDateString()}</Text>
        </Text>
        <Text style={styles.label}>
          Address: <Text style={styles.value}>{highlightText(item.address || 'N/A', searchQuery)}</Text>
        </Text>
        <Text style={styles.label}>
          Phone: <Text style={styles.value}>{highlightText(item.phone_number || 'N/A', searchQuery)}</Text>
        </Text>
        <Text style={styles.label}>
          Driver License: <Text style={styles.value}>{highlightText(item.driver_license || 'N/A', searchQuery)}</Text>
        </Text>
        <Text style={styles.label}>
          Marital Status: <Text style={styles.value}>{item.marital_status}</Text>
        </Text>
        <Text style={styles.label}>
          Zakat Requests: <Text style={styles.value}>{item.zakat_requests}</Text>
        </Text>
        {item.notes && (
          <Text style={styles.label}>
            Notes: <Text style={styles.value}>{highlightText(item.notes, searchQuery)}</Text>
          </Text>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.viewMore}>View Details</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.searchHint} accessibilityLabel="Search instructions">
        Search by name, phone number, address, or driver license number
      </Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recipients..."
          accessibilityLabel="Search recipients input"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity 
          style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={!searchQuery.trim() || loading}
          accessibilityRole="button"
          accessibilityLabel="Search button"
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText} accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}

      {loading ? (
        <ActivityIndicator 
          size="large" 
          color="#25292e" 
          style={styles.loader}
          accessibilityLabel="Loading search results"
        />
      ) : (
        <FlatList
          data={recipients}
          renderItem={renderRecipientItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            hasSearched ? (
              <Text style={styles.emptyText} accessibilityLiveRegion="polite">
                No recipients found
              </Text>
            ) : null
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingRight: 40,
    fontSize: 16,
    marginRight: 8,
    backgroundColor: '#f8f8f8',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  clearButton: {
    position: 'absolute',
    right: 66,
    padding: 8,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: '#25292e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  searchButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  loader: {
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#25292e',
  },
  status: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardContent: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  value: {
    color: '#25292e',
    fontWeight: '500',
  },
  highlight: {
    backgroundColor: '#ffeb3b',
    paddingHorizontal: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  searchHint: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  cardPressed: {
    backgroundColor: '#f5f5f5',
    transform: [{ scale: 0.98 }],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  viewMore: {
    color: '#666',
    fontSize: 14,
    marginRight: 4,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 14,
  },
});