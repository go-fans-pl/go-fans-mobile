import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { shopService, userService } from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ShopScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const openImageModal = (images, index = 0) => {
    if (images && images.length > 0) {
      setSelectedImages(images);
      setCurrentImageIndex(index);
      setImageModalVisible(true);
    }
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImages([]);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (currentImageIndex < selectedImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [shopData, userData] = await Promise.all([
        shopService.getProducts(),
        userService.getProfile(),
      ]);

      console.log('Shop data:', shopData);
      setProducts(shopData.products || []);
      setUserPoints(shopData.user_points || userData.current_points || 0);
    } catch (error) {
      console.error('Error loading shop:', error);
      Alert.alert('Błąd', 'Nie udało się załadować nagród');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleRedeemProduct = async (product) => {
    if (!product.can_afford) {
      Alert.alert(
        'Niewystarczająca liczba punktów',
        `Potrzebujesz ${product.points_required} punktów. Masz ${userPoints} punktów.`
      );
      return;
    }

    if (!product.in_stock) {
      Alert.alert('Brak na stanie', 'Ta nagroda jest obecnie niedostępna');
      return;
    }

    Alert.alert(
      'Wymień punkty',
      `Czy na pewno chcesz wymienić ${product.points_required} punktów na:\n${product.name}?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wymień',
          onPress: async () => {
            try {
              setLoading(true);
              const result = await shopService.redeemProduct(product.id);

              Alert.alert(
                'Sukces!',
                `Pomyślnie wymieniono ${product.points_required} punktów!\n\nNumer zamówienia: ${result.redemption.woocommerce_order_number}`,
                [
                  {
                    text: 'OK',
                    onPress: () => loadData()
                  }
                ]
              );
            } catch (error) {
              console.error('Error redeeming product:', error);
              Alert.alert('Błąd', error.response?.data?.message || 'Nie udało się wymienić punktów');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9500" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wymień punkty na nagrody</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsBadgeText}>{userPoints} pkt</Text>
        </View>
      </View>

      <View style={styles.productsList}>
        {products.map((product) => (
          <View key={product.id} style={styles.productCard}>
            {product.images && product.images.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openImageModal(product.images)}
              >
                <Image
                  source={{ uri: product.images[0].src }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
                {product.images.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <Text style={styles.imageCountText}>{product.images.length} zdjęć</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}

            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.description && (
                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.description.replace(/<[^>]*>/g, '')}
                </Text>
              )}

              <View style={styles.productFooter}>
                <View style={styles.pointsContainer}>
                  <Text style={styles.pointsLabel}>Koszt:</Text>
                  <Text style={[
                    styles.pointsValue,
                    !product.can_afford && styles.pointsValueDisabled
                  ]}>
                    {product.points_required} pkt
                  </Text>
                </View>

                {!product.in_stock ? (
                  <View style={styles.outOfStockBadge}>
                    <Text style={styles.outOfStockText}>Brak na stanie</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.redeemButton,
                      !product.can_afford && styles.redeemButtonDisabled
                    ]}
                    onPress={() => handleRedeemProduct(product)}
                    disabled={!product.can_afford}
                  >
                    <Text style={styles.redeemButtonText}>
                      {product.can_afford ? 'Wymień' : 'Za mało pkt'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}

        {products.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Brak dostępnych nagród</Text>
            <Text style={styles.emptyStateSubtext}>Sprawdź ponownie później</Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => navigation.navigate('RedemptionHistory')}
      >
        <Text style={styles.historyButtonText}>Historia wymian</Text>
      </TouchableOpacity>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>

          {selectedImages.length > 0 && (
            <Image
              source={{ uri: selectedImages[currentImageIndex]?.src }}
              style={styles.modalImage}
              resizeMode="contain"
            />
          )}

          {selectedImages.length > 1 && (
            <View style={styles.imageNavigation}>
              <TouchableOpacity
                style={[styles.navButton, currentImageIndex === 0 && styles.navButtonDisabled]}
                onPress={prevImage}
                disabled={currentImageIndex === 0}
              >
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>

              <Text style={styles.imageCounter}>
                {currentImageIndex + 1} / {selectedImages.length}
              </Text>

              <TouchableOpacity
                style={[styles.navButton, currentImageIndex === selectedImages.length - 1 && styles.navButtonDisabled]}
                onPress={nextImage}
                disabled={currentImageIndex === selectedImages.length - 1}
              >
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pointsBadgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f0f0',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  pointsValueDisabled: {
    color: '#999',
  },
  redeemButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  redeemButtonDisabled: {
    backgroundColor: '#ccc',
  },
  redeemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  outOfStockBadge: {
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  outOfStockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  historyButton: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  historyButtonText: {
    color: '#1e3a5f',
    fontSize: 16,
    fontWeight: '600',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalImage: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  imageNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  imageCounter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
});
