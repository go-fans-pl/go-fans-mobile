import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { receiptService } from '../services/api';

export default function HistoryScreen() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await receiptService.getHistory();
      setReceipts(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReceipt = ({ item }) => (
    <View style={styles.receiptCard}>
      <View style={styles.receiptHeader}>
        <Text style={styles.receiptDate}>
          {formatDate(item.scanned_at || item.created_at)}
        </Text>
        <View style={[
          styles.statusBadge,
          item.status === 'approved' && styles.statusVerified,
          item.status === 'pending' && styles.statusPending,
          (item.status?.startsWith('rejected') || item.status === 'rejected') && styles.statusRejected,
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'verified' && 'Zweryfikowany'}
            {item.status === 'pending' && 'Oczekuje'}
            {item.status === 'rejected' && 'Odrzucony'}
          </Text>
        </View>
      </View>

      <View style={styles.receiptDetails}>
        <Text style={styles.receiptAmount}>
          Kwota: {item.total_amount ? `${item.total_amount} zł` : '-'}
        </Text>
        <Text style={styles.receiptPoints}>
          Punkty: {item.points_earned || 0}
        </Text>
      </View>

      {item.store_name && (
        <Text style={styles.receiptStore}>Sklep: {item.store_name}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={receipts}
        renderItem={renderReceipt}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Brak paragonów</Text>
            <Text style={styles.emptySubtext}>
              Zeskanuj swój pierwszy paragon aby zdobyć punkty
            </Text>
          </View>
        }
      />
    </View>
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
  },
  list: {
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptDate: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusVerified: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusRejected: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptAmount: {
    fontSize: 16,
    color: '#333',
  },
  receiptPoints: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  receiptStore: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
