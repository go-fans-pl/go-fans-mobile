import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { userService, loyaltyService } from '../services/api';

export default function DashboardScreen({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
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
});
