import { useState } from 'react';
import { 
  Text, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { DatePickerModal } from 'react-native-paper-dates';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import { Provider as PaperProvider, MD2DarkTheme } from 'react-native-paper';
import { recipientService } from '../../services/recipientService';

registerTranslation('en-GB', enGB);

export default function Dashboard() {
  const [range, setRange] = useState<{
    startDate: Date | undefined;
    endDate: Date | undefined;
  }>({ startDate: new Date(), endDate: new Date() });
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onDismiss = () => {
    setOpen(false);
  };

  const onConfirm = ({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
    setOpen(false);
    setRange({ startDate, endDate });
  };

  const handleSearch = async () => {
    if (!range.startDate || !range.endDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    if (range.startDate > range.endDate) {
      Alert.alert('Error', 'End date cannot be before start date');
      return;
    }

    setLoading(true);
    try {
      const data = await recipientService.getRecipientsByDateRange(
        range.startDate.toISOString().split('T')[0],
        range.endDate.toISOString().split('T')[0]
      );
      setRecipients(data);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={MD2DarkTheme}>
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setOpen(true)}
          >
            <Text>
              {range.startDate?.toLocaleDateString()} - {range.endDate?.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>
        <DatePickerModal
          presentationStyle='pageSheet'
          animationType='slide'
          locale="en-GB"
          mode="range"
          visible={open}
          onDismiss={onDismiss}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={onConfirm}
          theme={MD2DarkTheme}
        />
      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={recipients}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          )}
          keyExtractor={item => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recipients found in selected range</Text>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
    </PaperProvider>
  );
}

// Update styles to accommodate the new date picker
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#25292e',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
  card: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#25292e',
  },
  date: {
    color: '#666',
    marginTop: 4,
  },
  status: {
    color: '#4CAF50',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  list: {
    paddingBottom: 20,
  },
});