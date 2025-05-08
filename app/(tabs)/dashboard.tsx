import { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Pressable,
  Keyboard,
  RefreshControl,
  Platform,
  ScrollView,
  useWindowDimensions,
  Dimensions
} from 'react-native';
import { DatePickerModal } from 'react-native-paper-dates';
import { enGB, registerTranslation } from 'react-native-paper-dates';
import { Provider as PaperProvider, MD2DarkTheme, Menu } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { recipientService } from '../../services/recipientService';
import { LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph,
  StackedBarChart
 } from 'react-native-chart-kit';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

registerTranslation('en-GB', enGB);

interface Recipient {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'inactive';
  zakat_requests: number;
  marital_status: 'single' | 'married';
  center_name?: string;
}

interface DateRange {
  startDate: Date | undefined;
  endDate: Date | undefined;
}

type SortOption = 'name' | 'date' | 'zakat_requests' | 'status';



export default function Dashboard() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const screenWidth = Dimensions.get('window').width;
  const [open, setOpen] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    zakatRequests: 0,
  });
  const [sortOption, setSortOption] = useState<SortOption>('date');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = Math.max(windowWidth - 32, 240);

  // Add this function after your existing state declarations
const handleExport = async () => {
  try {
    // Create CSV content
    const headers = ['Name', 'Date', 'Status', 'Zakat Requests', 'Marital Status', 'Center'];
    const rows = recipients.map(r => [
      r.name,
      new Date(r.date).toLocaleDateString(),
      r.status,
      r.zakat_requests.toString(),
      r.marital_status,
      r.center_name || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Add summary at the top
    const summary = [
      `Donations Hub Report`,
      `Period: ${range.startDate?.toLocaleDateString()} - ${range.endDate?.toLocaleDateString()}`,
      `Total Recipients: ${stats.total}`,
      `Active Recipients: ${stats.active}`,
      `Total Zakat Requests: ${stats.zakatRequests}`,
      '\n'
    ].join('\n');

    const fileContent = summary + csvContent;

    if (Platform.OS === 'web') {
      // For web platform, use Blob and download
      const blob = new Blob([fileContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      
      link.href = url;
      link.download = `donations-report-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else {
      // For native platforms, use FileSystem and Sharing
      const date = new Date().toISOString().split('T')[0];
      const filePath = `${FileSystem.documentDirectory}donations-report-${date}.csv`;
      
      await FileSystem.writeAsStringAsync(filePath, fileContent);
      await Sharing.shareAsync(filePath, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Donations Report',
        UTI: 'public.comma-separated-values-text'
      });
    }
  } catch (error) {
    console.error('Export failed:', error);
    Alert.alert('Export Failed', 'Failed to generate report. Please try again.');
  }
};

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 0,
    color: (opacity: any) => `rgba(37, 41, 46, ${opacity})`,
    labelColor: (opacity: any) => `rgba(102, 102, 102, ${opacity})`,
    style: { borderRadius: 12 },
    barPercentage: 0.3,
    fillShadowGradient: '#25292e',
    fillShadowGradientOpacity: 0.2,
  };

  const onDismiss = useCallback(() => {
    setOpen(false);
  }, []);

  const onConfirm = useCallback(({ startDate, endDate }: { startDate: Date; endDate: Date }) => {
    setOpen(false);
    setRange({ startDate, endDate });
    setPage(1);
    setRecipients([]);
  }, []);

  const fetchRecipients = useCallback(
    async (newPage: number = 1, append: boolean = false, isRefresh: boolean = false) => {
      if (!range.startDate || !range.endDate) {
        Alert.alert('Validation', 'Please select both start and end dates');
        return;
      }

      if (range.startDate > range.endDate) {
        Alert.alert('Validation', 'End date cannot be before start date');
        return;
      }

      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await recipientService.getRecipientsByDateRange(
          range.startDate.toISOString().split('T')[0],
          range.endDate.toISOString().split('T')[0],
          { page: newPage, limit: 20 }
        );

        let newRecipients = append ? [...recipients, ...data] : data;
        
        // Apply sorting
        newRecipients = [...newRecipients].sort((a, b) => {
          switch (sortOption) {
            case 'name':
              return a.name.localeCompare(b.name);
            case 'date':
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            case 'zakat_requests':
              return b.zakat_requests - a.zakat_requests;
            case 'status':
              return a.status.localeCompare(b.status);
            default:
              return 0;
          }
        });

        setRecipients(newRecipients as Recipient[]);
        setHasMore(data.length === 20);

        // Calculate stats
        const activeCount = newRecipients.filter(r => r.status === 'active').length;
        const zakatTotal = newRecipients.reduce((sum, r) => sum + r.zakat_requests, 0);
        setStats({
          total: newRecipients.length,
          active: activeCount,
          zakatRequests: zakatTotal,
        });
      } catch (err: any) {
        setError(err.message);
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
        if (isRefresh) setRefreshing(false);
      }
    },
    [range, recipients, sortOption]
  );

  // Replace the existing useEffect with useFocusEffect
  useFocusEffect(
    useCallback(() => {
      // Only fetch if we don't have recipients yet
      if (recipients.length === 0) {
        fetchRecipients();
      }
    }, [range, sortOption])
  );

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => {
        const nextPage = prev + 1;
        fetchRecipients(nextPage, true);
        return nextPage;
      });
    }
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    setPage(1);
    fetchRecipients(1);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchRecipients(1, false, true);
  };

  const handleRecipientPress = (recipient: Recipient) => {
    router.push({
      pathname: '/recipient/[id]',
      params: { id: recipient.id },
    });
  };

  const handleSortSelect = (option: SortOption) => {
    setSortOption(option);
    setSortMenuVisible(false);
    setPage(1);
    fetchRecipients(1);
  };

  const renderRecipientItem = ({ item }: { item: Recipient }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => handleRecipientPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Recipient ${item.name}, Status: ${item.status}, Zakat Requests: ${item.zakat_requests}`}
      accessibilityHint="View recipient details"
    >
      <View style={styles.cardHeader}>
        <Text style={styles.name}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'active' ? styles.statusActive : styles.statusInactive,
          ]}
        >
          <Text style={styles.status}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.date}>
          Date: {new Date(item.date).toLocaleDateString()}
        </Text>
        <Text style={styles.detail}>
          Zakat Requests: {item.zakat_requests}
        </Text>
        <Text style={styles.detail}>
          Marital Status: {item.marital_status}
        </Text>
        {item.center_name && (
          <Text style={styles.detail}>Center: {item.center_name}</Text>
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.viewDetails}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </Pressable>
  );

  const chartData = {
    labels: ['Total', 'Active', 'Zakat Requests'],
    datasets: [
      {
        data: [stats.total, stats.active, stats.zakatRequests],
        colors: [
          (opacity = 1) => `rgba(37, 41, 46, ${opacity})`,
          (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        ],
      },
    ],
  };

  return (
    <PaperProvider theme={MD2DarkTheme}>
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#25292e']}
          tintColor="#25292e"
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
    >
       {/* Header & Sort Menu */}
       <View style={styles.header}>
          <Text style={styles.title}>Recipient Dashboard</Text>
          <View style={styles.headerActions}>
    <TouchableOpacity
      style={styles.exportButton}
      onPress={handleExport}
      accessibilityLabel="Export data"
    >
      <Ionicons name="download-outline" size={20} color="#25292e" />
      <Text style={styles.exportButtonText}>Export</Text>
    </TouchableOpacity>
          </View>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setSortMenuVisible(true)}
              >
                <Ionicons name="funnel-outline" size={20} color="#25292e" />
                <Text style={styles.sortButtonText}>
                  Sort by: {sortOption.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => handleSortSelect('name')}
              title="Name"
              leadingIcon={({ size, color }) => (
                <Ionicons name="map" size={size} color={color} />
              )}
            />
            <Menu.Item
              onPress={() => handleSortSelect('date')}
              title="Date"
              leadingIcon={({ size, color }) => (
                <Ionicons name="calendar-outline" size={size} color={color} />
              )}
            />
            <Menu.Item
              onPress={() => handleSortSelect('zakat_requests')}
              title="Zakat Requests"
              leadingIcon={({ size, color }) => (
                <Ionicons name="ticket-outline" size={size} color={color} />
              )}
            />
            <Menu.Item
              onPress={() => handleSortSelect('status')}
              title="Status"
              leadingIcon={({ size, color }) => (
                <Ionicons name="sparkles-outline" size={size} color={color} />
              )}
            />
          </Menu>
        </View>

        {/* Summary Section */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Ionicons name="people-outline" size={24} color="#25292e" />
            <Text style={styles.summaryValue}>{stats.total}</Text>
            <Text style={styles.summaryLabel}>Total Recipients</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="person-outline" size={24} color="#25292e" />
            <Text style={styles.summaryValue}>{stats.active}</Text>
            <Text style={styles.summaryLabel}>Active Recipients</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="gift-outline" size={24} color="#25292e" />
            <Text style={styles.summaryValue}>{stats.zakatRequests}</Text>
            <Text style={styles.summaryLabel}>Zakat Requests</Text>
          </View>
        </View>

        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Select date range"
          >
            <Ionicons name="calendar-outline" size={20} color="#666" />
            <Text style={styles.dateButtonText}>
              {range.startDate?.toLocaleDateString() || 'Start'} -{' '}
              {range.endDate?.toLocaleDateString() || 'End'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel="Search recipients"
          >
            <Ionicons name="search" size={20} color="#fff" />
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        <DatePickerModal
          presentationStyle="pageSheet"
          animationType="slide"
          locale="en-GB"
          mode="range"
          visible={open}
          onDismiss={onDismiss}
          startDate={range.startDate}
          endDate={range.endDate}
          onConfirm={({ startDate, endDate }) => {
            if (startDate && endDate) {
              onConfirm({ startDate: new Date(startDate), endDate: new Date(endDate) });
            }
          }}
          theme={{
            ...MD2DarkTheme,
            colors: {
              ...MD2DarkTheme.colors,
              primary: '#25292e',
              surface: '#fff',
              onSurface: '#25292e',
            },
            roundness: 12,
          }}
        />

        {/* Chart Section */}
        {recipients.length > 0 && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Recipient Statistics</Text>
            <BarChart
              data={chartData}
              width={chartWidth}
              height={240}
              chartConfig={chartConfig}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars
              withInnerLines={false}
              withCustomBarColorFromData
            />
          </View>
        )}

        {/* Recipients List */}
        {error && (
          <Text style={styles.errorText} accessibilityLiveRegion="polite">
            {error}
          </Text>
        )}

        {loading && !recipients.length ? (
          <ActivityIndicator
            size="large"
            color="#25292e"
            style={styles.loader}
            accessibilityLabel="Loading recipients"
          />
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={recipients}
              renderItem={renderRecipientItem}
              keyExtractor={item => item.id}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText} accessibilityLiveRegion="polite">
                    No recipients found in selected range
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={handleSearch}
                    accessibilityRole="button"
                    accessibilityLabel="Retry search"
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              }
              contentContainerStyle={styles.list}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                loading && recipients.length > 0 ? (
                  <ActivityIndicator
                    size="small"
                    color="#25292e"
                    style={styles.footerLoader}
                  />
                ) : null
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={false} // Disable FlatList scrolling
              nestedScrollEnabled={true}
            />
          </View>
        )}
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#25292e',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    gap: 8,
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
  sortButtonText: {
    fontSize: 14,
    color: '#25292e',
    textTransform: 'capitalize',
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
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
  summaryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#25292e',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    gap: 8,
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
  dateButtonText: {
    fontSize: 14,
    color: '#25292e',
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#25292e',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
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
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#25292e',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
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
    marginBottom: 8,
  },
  cardContent: {
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#25292e',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
  },
  statusInactive: {
    backgroundColor: '#ffebee',
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textTransform: 'capitalize',
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  viewDetails: {
    fontSize: 14,
    color: '#666',
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#25292e',
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    textAlign: 'center',
    color: '#d32f2f',
    marginBottom: 12,
    fontSize: 14,
  },
  loader: {
    marginTop: 20,
  },
  footerLoader: {
    marginVertical: 16,
  },
  list: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  listContainer: {
    flex: 1,
  },
  cardPressed: {
    backgroundColor: '#f8f8f8',
    transform: [{ scale: 0.98 }],
    borderColor: '#ddd',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    gap: 8,
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
  exportButtonText: {
    fontSize: 14,
    color: '#25292e',
  },
});
