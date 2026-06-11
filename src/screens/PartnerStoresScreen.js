import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { shopService } from '../services/api';

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

function openInMaps(store) {
  const lat = parseFloat(store.latitude);
  const lng = parseFloat(store.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return;
  const label = encodeURIComponent(store.name || 'Sklep partnerski');
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
  Linking.openURL(url).catch(err => {
    console.error('Error opening maps:', err);
    Alert.alert('Błąd', 'Nie udało się otworzyć map.');
  });
}

export default function PartnerStoresScreen({ navigation }) {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);

  const fetchLocationAndStores = useCallback(async () => {
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setLoading(false);
        setRefreshing(false);
        return;
      }
      setPermissionDenied(false);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setCoords({ latitude, longitude });

      const data = await shopService.getNearbyStores(latitude, longitude, 100, 100);
      setStores(data.stores || []);
    } catch (err) {
      console.error('Error fetching nearby stores:', err);
      setError(err?.response?.data?.message || err.message || 'Nieznany błąd');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLocationAndStores();
  }, [fetchLocationAndStores]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLocationAndStores();
  };

  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.muted}>Pobieranie lokalizacji...</Text>
      </View>
    );
  }

  if (permissionDenied) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Brak dostępu do lokalizacji</Text>
        <Text style={styles.muted}>
          Aby pokazać sklepy w pobliżu, musimy znać Twoją lokalizację.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={fetchLocationAndStores}>
          <Text style={styles.primaryButtonText}>Spróbuj ponownie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={openSettings}>
          <Text style={styles.secondaryButtonText}>Otwórz ustawienia</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Coś poszło nie tak</Text>
        <Text style={styles.muted}>{error}</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={fetchLocationAndStores}>
          <Text style={styles.primaryButtonText}>Spróbuj ponownie</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={stores.length === 0 ? styles.emptyContent : styles.listContent}
      data={stores}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.title}>Brak sklepów w pobliżu</Text>
          <Text style={styles.muted}>
            W promieniu 100 km nie znaleziono żadnego sklepu partnerskiego z lokalizacją.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isDoublePoints = item.double_points_active === true;
        const cityLine = [item.city, item.address].filter(Boolean).join(' · ');
        return (
          <TouchableOpacity style={styles.card} onPress={() => openInMaps(item)}>
            <View style={styles.cardHeader}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.distance}>{formatDistance(item.distance_km)}</Text>
            </View>
            {item.chain_name ? (
              <Text style={styles.chain}>{item.chain_name}</Text>
            ) : null}
            {cityLine ? <Text style={styles.cityLine}>{cityLine}</Text> : null}
            <View style={styles.badgesRow}>
              {item.points_multiplier && parseFloat(item.points_multiplier) !== 1 ? (
                <View style={styles.multiplierBadge}>
                  <Text style={styles.multiplierBadgeText}>
                    {parseFloat(item.points_multiplier)}x punktów
                  </Text>
                </View>
              ) : null}
              {isDoublePoints ? (
                <View style={styles.promoBadge}>
                  <Text style={styles.promoBadgeText}>🔥 Promocja 2x punkty</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.tapHint}>Dotknij aby otworzyć w mapach →</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContent: {
    padding: 16,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  muted: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  distance: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  chain: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  cityLine: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  multiplierBadge: {
    backgroundColor: '#e0eaff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  multiplierBadgeText: {
    color: '#1e3a5f',
    fontSize: 12,
    fontWeight: '600',
  },
  promoBadge: {
    backgroundColor: '#fff4d6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  promoBadgeText: {
    color: '#d4af37',
    fontSize: 12,
    fontWeight: '700',
  },
  tapHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});
