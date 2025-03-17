import { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
  Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recipientService } from '../../services/recipientService';

// Update the Recipient type to match new fields
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
};

// Helper function that returns a Text component with matches highlighted
function highlightText(text: string, query: string): JSX.Element {
  if (!query) return <Text>{text}</Text>;

  // Escape special regex characters from each word
  const words = query.split(/\s+/).filter(Boolean).map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return <Text>{text}</Text>;
  
  // Build regex with OR for each word, case-insensitive
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text>
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

  const handleClear = () => {
    setSearchQuery('');
    setRecipients([]);
    setHasSearched(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Please enter a search term');
      return;
    }

    setHasSearched(true); // Mark that a search has been executed
    setLoading(true);
    try {
      const data = await recipientService.searchRecipients(searchQuery);
      setRecipients(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderRecipientItem = ({ item }: { item: Recipient }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {/* Highlight matches in the name */}
        <Text style={styles.name}>{highlightText(item.name, searchQuery)}</Text>
        <Text style={styles.status}>{item.status}</Text>
      </View>
      
      <View style={styles.cardContent}>
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
        {item.notes ? (
          <Text style={styles.label}>
            Notes: <Text style={styles.value}>{highlightText(item.notes, searchQuery)}</Text>
          </Text>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.searchHint}>
        Search by name, phone number, address, or driver license number
      </Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search recipients..."
        />
        <TouchableOpacity 
          style={[styles.searchButton, !searchQuery.trim() && styles.searchButtonDisabled]} 
          onPress={handleSearch}
          disabled={!searchQuery.trim() || loading}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={handleClear}
          >
            <Ionicons name="close-circle" size={24} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#25292e" style={styles.loader} />
      ) : (
        <FlatList
          data={recipients}
          renderItem={renderRecipientItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            hasSearched ? (
              <Text style={styles.emptyText}>No recipients found</Text>
            ) : null
          }
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
    paddingRight: 40, // Make room for clear button
    fontSize: 16,
    marginRight: 8,
  },
  clearButton: {
    position: 'absolute',
    right: 66, // Position it before the search button
    padding: 8,
  },
  searchButton: {
    width: 50,
    height: 50,
    backgroundColor: '#25292e',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#25292e',
  },
  status: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  cardContent: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    color: '#25292e',
    fontWeight: '500',
  },
  highlight: {
    backgroundColor: '#ffeb3b',
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
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
