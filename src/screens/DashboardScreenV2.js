import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import {
  userService,
  loyaltyService,
  shopService,
  receiptService,
} from '../services/api';
import { newsService } from '../services/news';

const COLORS = {
  bg: '#FAFAFA',
  card: '#FFFFFF',
  text: '#0A0A0A',
  textSecondary: '#71717A',
  textMuted: '#A1A1AA',
  border: '#E5E5E5',
  accent: '#0F172A',
  accentSoft: '#1E293B',
  cta: '#F59E0B',
  ctaDark: '#D97706',
  promo: '#DC2626',
  success: '#16A34A',
};

const RANKING_FALLBACK = [
  { rank: 1, username: 'ripo22', points: 2000 },
  { rank: 2, username: 'giorginio', points: 1800 },
  { rank: 3, username: 'michu_jks', points: 1500 },
];

const REWARDS_FALLBACK = [
  { id: 'r1', name: 'Koszulka klubowa', points: 2500 },
  { id: 'r2', name: 'Szalik kibica', points: 1000 },
  { id: 'r3', name: 'Kubek z herbem', points: 500 },
];

function formatDistance(km) {
  // Backend zwraca distance_km jako numeric → node-postgres serializuje to do STRINGA
  // ("5.43"), a nie number. Bez koercji "5.43".toFixed() rzuca TypeError w renderze
  // → niezłapany wyjątek → biały ekran. Dlatego najpierw twardo na Number.
  const n = typeof km === 'number' ? km : parseFloat(km);
  if (n == null || Number.isNaN(n)) return '';
  if (n < 1) return `${Math.round(n * 1000)} m`;
  if (n < 10) return `${n.toFixed(1)} km`;
  return `${Math.round(n)} km`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
}

export default function DashboardScreenV2({ navigation, onLogout }) {
  const [user, setUser] = useState(null);
  const [levels, setLevels] = useState([]);
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState(REWARDS_FALLBACK);
  const [news, setNews] = useState([]);
  const [ranking] = useState(RANKING_FALLBACK);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [nearbyStores, setNearbyStores] = useState([]);
  const [nearbyLoading, setNearbyLoading] = useState(true);
  const [nearbyPermissionDenied, setNearbyPermissionDenied] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    await Promise.all([loadCore(), loadNearbyStores(), loadNews()]);
  };

  const loadCore = async () => {
    try {
      const [userData, levelsData, historyData, productsData] = await Promise.all([
        userService.getProfile(),
        loyaltyService.getLevels(),
        receiptService.getHistory().catch(() => []),
        shopService.getProducts().catch(() => null),
      ]);
      setUser(userData);
      setLevels(levelsData || []);
      setHistory(Array.isArray(historyData) ? historyData.slice(0, 3) : []);
      const products = productsData?.products || productsData;
      if (Array.isArray(products) && products.length > 0) {
        setRewards(
          products.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            points: p.points_required || p.points || 0,
          }))
        );
      }
    } catch (error) {
      console.error('Dashboard core load error:', error);
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
      console.error('Nearby stores error:', error);
      setNearbyStores([]);
    } finally {
      setNearbyLoading(false);
    }
  }, []);

  const loadNews = async () => {
    try {
      const posts = await newsService.getLatestPosts(3);
      setNews(posts);
    } catch (error) {
      console.error('News load error:', error);
      setNews([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAll();
  };

  const getCurrentLevel = () => {
    if (!user || !levels.length) return null;
    const minPoints = level => level.min_points_required || level.min_points || 0;
    return levels.find(
      level =>
        user.total_points >= minPoints(level) &&
        user.total_points < (level.max_points || Infinity)
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const currentLevel = getCurrentLevel();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingHello}>Witaj,</Text>
            <Text style={styles.greetingName}>{user?.first_name || 'Kibicu'}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} hitSlop={10}>
            <Text style={styles.logoutText}>Wyloguj</Text>
          </TouchableOpacity>
        </View>

        {/* HERO PUNKTY */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.heroCard}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>Twoje punkty</Text>
            {currentLevel && (
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>
                  {currentLevel.name?.toUpperCase() || 'BRONZE'}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.heroValue}>{user?.current_points ?? 0}</Text>
          <Text style={styles.heroUnit}>punktów</Text>
          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>
              Łącznie: {user?.total_points ?? 0}
            </Text>
            {currentLevel?.points_multiplier && (
              <Text style={styles.heroFooterText}>
                Mnożnik {currentLevel.points_multiplier}x
              </Text>
            )}
          </View>
        </TouchableOpacity>

        {/* OSTATNIE TRANSAKCJE */}
        {history.length > 0 && (
          <Section
            title="Historia"
            actionText="Wszystkie"
            onAction={() => navigation.navigate('History')}
          >
            <View style={styles.card}>
              {history.map((tx, idx) => {
                const points = tx.points_earned ?? tx.points ?? 0;
                const positive = points >= 0;
                return (
                  <View
                    key={tx.id || idx}
                    style={[
                      styles.txRow,
                      idx < history.length - 1 && styles.txRowBorder,
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txName} numberOfLines={1}>
                        {tx.store_name || tx.shop_name || tx.merchant_name || 'Sklep'}
                      </Text>
                      <Text style={styles.txDate}>
                        {formatDate(tx.created_at || tx.date)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.txPoints,
                        { color: positive ? COLORS.success : COLORS.promo },
                      ]}
                    >
                      {positive ? '+' : ''}
                      {points} pkt
                    </Text>
                  </View>
                );
              })}
            </View>
          </Section>
        )}

        {/* AKTUALNOŚCI */}
        <Section title="📰 Aktualności" subtitle="jksjaroslaw.com">
          {news.length === 0 ? (
            <View style={[styles.card, styles.emptyCard]}>
              <Text style={styles.emptyText}>Brak aktualności do wyświetlenia</Text>
            </View>
          ) : (
            news.map(post => (
              <TouchableOpacity
                key={post.id}
                style={styles.newsCard}
                onPress={() => post.link && Linking.openURL(post.link)}
                activeOpacity={0.85}
              >
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.newsDate}>{formatDate(post.date)}</Text>
              </TouchableOpacity>
            ))
          )}
        </Section>

        {/* SKLEPY W POBLIŻU */}
        <Section
          title="📍 Sklepy w pobliżu"
          actionText="Wszystkie"
          onAction={() => navigation.navigate('PartnerStores')}
        >
          <TouchableOpacity
            style={styles.mapPlaceholder}
            onPress={() => navigation.navigate('PartnerStores')}
            activeOpacity={0.85}
          >
            <Text style={styles.mapPlaceholderIcon}>🗺️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapPlaceholderTitle}>Mapa firm partnerskich</Text>
              <Text style={styles.mapPlaceholderSub}>
                Tap, aby otworzyć pełną mapę →
              </Text>
            </View>
          </TouchableOpacity>

          {nearbyLoading ? (
            <View style={styles.emptyCard}>
              <ActivityIndicator size="small" color={COLORS.accent} />
            </View>
          ) : nearbyPermissionDenied ? (
            <TouchableOpacity style={styles.emptyCard} onPress={loadNearbyStores}>
              <Text style={styles.emptyText}>
                Włącz lokalizację, aby zobaczyć sklepy w pobliżu
              </Text>
              <Text style={styles.emptyAction}>Włącz lokalizację →</Text>
            </TouchableOpacity>
          ) : nearbyStores.length === 0 ? (
            <Text style={styles.emptyText}>Brak sklepów w promieniu 50 km</Text>
          ) : (
            nearbyStores.map(store => (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                onPress={() => navigation.navigate('PartnerStores')}
                activeOpacity={0.85}
              >
                <View style={styles.storeRow}>
                  <Text style={styles.storeName} numberOfLines={1}>
                    {store.name}
                  </Text>
                  <Text style={styles.storeDistance}>
                    {formatDistance(store.distance_km)}
                  </Text>
                </View>
                <View style={styles.storeRow}>
                  <Text style={styles.storeCity} numberOfLines={1}>
                    {[store.city, store.chain_name].filter(Boolean).join(' · ')}
                  </Text>
                  {store.double_points_active && (
                    <Text style={styles.storePromo}>🔥 2x punkty</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </Section>

        {/* WYMIEŃ PUNKTY */}
        <Section
          title="🎁 Wymień punkty"
          actionText="Sklep"
          onAction={() => navigation.navigate('Shop')}
        >
          <View style={styles.card}>
            {rewards.map((reward, idx) => (
              <View
                key={reward.id || idx}
                style={[
                  styles.rewardRow,
                  idx < rewards.length - 1 && styles.txRowBorder,
                ]}
              >
                <Text style={styles.rewardName} numberOfLines={1}>
                  {reward.name}
                </Text>
                <Text style={styles.rewardPoints}>{reward.points} pkt</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* RANKING */}
        <Section title="🏆 Ranking">
          <View style={styles.card}>
            {ranking.map((entry, idx) => {
              const medal = ['🥇', '🥈', '🥉'][idx] || '';
              return (
                <View
                  key={entry.username}
                  style={[
                    styles.rankRow,
                    idx < ranking.length - 1 && styles.txRowBorder,
                  ]}
                >
                  <Text style={styles.rankNumber}>{entry.rank}.</Text>
                  <Text style={styles.rankName} numberOfLines={1}>
                    {entry.username}
                  </Text>
                  <Text style={styles.rankPoints}>{entry.points} pkt</Text>
                  {medal ? <Text style={styles.rankMedal}>{medal}</Text> : null}
                </View>
              );
            })}
          </View>
          <Text style={styles.disclaimer}>
            Dane przykładowe — czeka na endpoint
          </Text>
        </Section>

        {/* WYMIEŃ NA LOS — placeholder */}
        <Section title="🎰 Wymień punkty na los">
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonBadge}>WKRÓTCE</Text>
            <Text style={styles.comingSoonTitle}>Lipiec 2026</Text>
            <Text style={styles.comingSoonSub}>
              Już niedługo wymienisz swoje punkty na los z atrakcyjnymi nagrodami
            </Text>
          </View>
        </Section>

        {/* Spacer pod sticky CTA */}
        <View style={{ height: 96 }} />
      </ScrollView>

      {/* STICKY CTA */}
      <View style={styles.ctaWrap}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ScanReceipt')}
        >
          <Text style={styles.ctaIcon}>📷</Text>
          <Text style={styles.ctaText}>Zeskanuj Paragon</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Section({ title, subtitle, actionText, onAction, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
        {actionText && onAction && (
          <TouchableOpacity onPress={onAction} hitSlop={8}>
            <Text style={styles.sectionAction}>{actionText} →</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greetingHello: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  greetingName: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    paddingBottom: 4,
  },

  // HERO
  heroCard: {
    backgroundColor: COLORS.accent,
    marginHorizontal: 20,
    marginBottom: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    borderRadius: 20,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  levelBadge: {
    backgroundColor: COLORS.cta,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelBadgeText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 56,
    fontWeight: '800',
    marginTop: 8,
    lineHeight: 64,
  },
  heroUnit: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '500',
    marginTop: -4,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  heroFooterText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '500',
  },

  // SECTION
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionAction: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
  },

  // CARD (generic)
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 6,
  },

  // HISTORIA
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  txRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  txName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  txDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  txPoints: {
    fontSize: 14,
    fontWeight: '700',
  },

  // NEWS
  newsCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  newsTitle: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    lineHeight: 20,
  },
  newsDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // SKLEPY
  mapPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  mapPlaceholderIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  mapPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  mapPlaceholderSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  storeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  storeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  storeDistance: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accent,
  },
  storeCity: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    flex: 1,
  },
  storePromo: {
    fontSize: 11,
    color: COLORS.promo,
    fontWeight: '700',
    marginTop: 2,
  },

  // REWARDS
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rewardName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
  },

  // RANKING
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rankNumber: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '700',
    width: 28,
  },
  rankName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  rankPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.accent,
    marginRight: 6,
  },
  rankMedal: {
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
    textAlign: 'right',
  },

  // COMING SOON
  comingSoonCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  comingSoonBadge: {
    backgroundColor: COLORS.accent,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 10,
  },
  comingSoonSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },

  // STICKY CTA
  ctaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: 'rgba(250,250,250,0.92)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cta,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: COLORS.ctaDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  ctaText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
