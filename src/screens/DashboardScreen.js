import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { userService, loyaltyService, shopService } from '../services/api';

function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export default function DashboardScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [nearbyStores, setNearbyStores] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyPermissionDenied, setNearbyPermissionDenied] = useState(false);

  useEffect(() => {
    loadData();
    loadNearbyStores();
  }, []);

  const loadData = async () => {
    try {
      const [userData, levelsData] = await Promise.all([
        userService.getProfile(),
        loyaltyService.getLevels(),
      ]);
      console.log('Dashboard - userData:', userData);
      console.log('Dashboard - levelsData:', levelsData);
      console.log('Dashboard - userData.current_points:', userData?.current_points);
      console.log('Dashboard - userData.total_points:', userData?.total_points);
      setUser(userData);
      setLevels(levelsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadNearbyStores = useCallback(async () => {
    setNearbyLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setNearbyPermissionDenied(true);
        setNearbyStores([]);
        return;
      }
      setNearbyPermissionDenied(false);

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const data = await shopService.getNearbyStores(
        position.coords.latitude,
        position.coords.longitude,
        50,
        3
      );
      setNearbyStores(data.stores || []);
    } catch (error) {
      console.error('Error loading nearby stores:', error);
      setNearbyStores([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
    loadNearbyStores();
  };


  const getCurrentLevel = () => {
    if (!user || !levels.length) return null;
    const minPoints = level => level.min_points_required || level.min_points || 0;
    return levels.find(level =>
      user.total_points >= minPoints(level) &&
      user.total_points < (level.max_points || Infinity)
    );
  };

  const getNextLevel = () => {
    if (!user || !levels.length) return null;
    const currentLevel = getCurrentLevel();
    if (!currentLevel) return levels[0];
    const minPoints = level => level.min_points_required || level.min_points || 0;
    const currentMinPoints = minPoints(currentLevel);
    return levels.find(level => minPoints(level) > currentMinPoints);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Witaj, {user?.first_name}!
        </Text>
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutText}>Wyloguj</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pointsCard}>
        <Text style={styles.pointsLabel}>Twoje punkty</Text>
        <Text style={styles.pointsValue}>{user?.current_points || 0}</Text>
        <Text style={styles.totalPointsLabel}>
          Łącznie zdobytych: {user?.total_points || 0}
        </Text>
      </View>

      {currentLevel && (
        <View style={styles.levelCard}>
          <Text style={styles.levelTitle}>Obecny poziom</Text>
          <Text style={styles.levelName}>{currentLevel.name}</Text>
          <Text style={styles.levelDiscount}>
            Mnożnik: {currentLevel.points_multiplier}x
          </Text>
        </View>
      )}

      {nextLevel && (
        <View style={styles.nextLevelCard}>
          <Text style={styles.nextLevelTitle}>Następny poziom</Text>
          <Text style={styles.nextLevelName}>{nextLevel.name}</Text>
          <Text style={styles.nextLevelPoints}>
            Potrzebujesz {(nextLevel.min_points_required || nextLevel.min_points || 0) - (user?.total_points || 0)} punktów
          </Text>
        </View>
      )}

      <View style={styles.nearbySection}>
        <View style={styles.nearbyHeader}>
          <Text style={styles.nearbyTitle}>📍 Sklepy w pobliżu</Text>
          {!nearbyPermissionDenied && nearbyStores.length > 0 && (
            <TouchableOpacity onPress={() => navigation.navigate('PartnerStores')}>
              <Text style={styles.nearbySeeAll}>Zobacz wszystkie →</Text>
            </TouchableOpacity>
          )}
        </View>

        {nearbyLoading ? (
          <View style={styles.nearbyEmpty}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        ) : nearbyPermissionDenied ? (
          <TouchableOpacity style={styles.nearbyEmpty} onPress={loadNearbyStores}>
            <Text style={styles.nearbyEmptyText}>
              Włącz lokalizację, aby zobaczyć sklepy w Twojej okolicy
            </Text>
            <Text style={styles.nearbyEmptyAction}>Włącz lokalizację →</Text>
          </TouchableOpacity>
        ) : nearbyStores.length === 0 ? (
          <TouchableOpacity
            style={styles.nearbyEmpty}
            onPress={() => navigation.navigate('PartnerStores')}
          >
            <Text style={styles.nearbyEmptyText}>Brak sklepów w promieniu 50 km</Text>
            <Text style={styles.nearbyEmptyAction}>Zobacz wszystkie sklepy →</Text>
          </TouchableOpacity>
        ) : (
          nearbyStores.map(store => {
            const isDoublePoints = store.double_points_active === true;
            return (
              <TouchableOpacity
                key={store.id}
                style={styles.nearbyCard}
                onPress={() => navigation.navigate('PartnerStores')}
              >
                <View style={styles.nearbyCardRow}>
                  <Text style={styles.nearbyCardName} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <Text style={styles.nearbyCardDistance}>
                    {formatDistance(store.distance_km)}
                  </Text>
                </View>
                <Text style={styles.nearbyCardCity} numberOfLines={1}>
                  {[store.city, store.chain_name].filter(Boolean).join(' · ')}
                </Text>
                {isDoublePoints && (
                  <Text style={styles.nearbyCardPromo}>🔥 Promocja 2x punkty</Text>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shopButton]}
          onPress={() => navigation.navigate('Shop')}
        >
          <Text style={styles.actionButtonText}>🎁 Wymień punkty w sklepie</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScanReceipt')}
        >
          <Text style={styles.actionButtonText}>Zeskanuj paragon</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.secondaryButtonText}>Historia</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.secondaryButtonText}>Profil</Text>
        </TouchableOpacity>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  pointsCard: {
    backgroundColor: '#007AFF',
    margin: 20,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  pointsValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  totalPointsLabel: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    opacity: 0.9,
  },
  levelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 20,
    borderRadius: 12,
  },
  levelTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  levelName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  levelDiscount: {
    fontSize: 16,
    color: '#28a745',
  },
  nextLevelCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  nextLevelTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  nextLevelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  nextLevelPoints: {
    fontSize: 14,
    color: '#666',
  },
  actions: {
    padding: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  shopButton: {
    backgroundColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nearbySection: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  nearbyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nearbyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  nearbySeeAll: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  nearbyEmpty: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nearbyEmptyText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 6,
  },
  nearbyEmptyAction: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '600',
  },
  nearbyCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  nearbyCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nearbyCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  nearbyCardDistance: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  nearbyCardCity: {
    fontSize: 12,
    color: '#888',
  },
  nearbyCardPromo: {
    fontSize: 12,
    color: '#d4af37',
    fontWeight: '700',
    marginTop: 4,
  },
});
