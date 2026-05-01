import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { shopService } from '../services/api';

export default function RedemptionHistoryScreen() {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      const data = await shopService.getRedemptionHistory();
      console.log('Redemptions data:', data);
      if (Array.isArray(data)) {
        setRedemptions(data);
      } else if (data && typeof data === 'object') {
        setRedemptions([]);
      } else {
        setRedemptions([]);
      }
    } catch (error) {
      console.error('Error loading redemptions:', error);
      setRedemptions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRedemptions();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Zrealizowane', color: '#34C759' };
      case 'pending':
        return { label: 'W realizacji', color: '#FF9500' };
      case 'cancelled':
        return { label: 'Anulowane', color: '#FF3B30' };
      case 'refunded':
        return { label: 'Zwrócone', color: '#8E8E93' };
      default:
        return { label: status, color: '#8E8E93' };
    }
  };

  const renderRedemption = ({ item }) => {
    if (!item) return null;

    const statusInfo = getStatusInfo(item.status || 'pending');

    return (
      <View style={styles.redemptionCard}>
        <View style={styles.redemptionHeader}>
          <Text style={styles.productName}>{item.product_name || 'Nagroda'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.redemptionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Punkty:</Text>
            <Text style={styles.detailValue}>-{item.points_spent || 0} pkt</Text>
          </View>

          {item.quantity && item.quantity > 1 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Ilość:</Text>
              <Text style={styles.detailValue}>{item.quantity} szt.</Text>
            </View>
          )}

          {item.woocommerce_order_id && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nr zamówienia:</Text>
              <Text style={styles.detailValue}>#{item.woocommerce_order_id}</Text>
            </View>
          )}

          {item.created_at && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Data:</Text>
              <Text style={styles.detailValue}>{formatDate(item.created_at)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={redemptions}
        renderItem={renderRedemption}
        keyExtractor={(item, index) => (item?.id?.toString() || index.toString())}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎁</Text>
            <Text style={styles.emptyStateText}>Brak wymian</Text>
            <Text style={styles.emptyStateSubtext}>
              Tutaj pojawią się Twoje wymienione nagrody
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
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  redemptionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  redemptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  redemptionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
