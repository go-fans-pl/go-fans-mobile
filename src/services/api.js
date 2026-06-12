import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import config from '../../config';

// iOS 26 wymaga jawnego keychainService — bez niego expo-secure-store potrafi
// rzucić NSException przy inicjalizacji (RN#54859)
const KEYCHAIN_OPTIONS = { keychainService: 'com.gofans.app' };

const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: config.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - dodaje token do każdego żądania
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('access_token', KEYCHAIN_OPTIONS);
    console.log('Token from storage:', token ? 'EXISTS' : 'MISSING');
    console.log('Request URL:', config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    } else {
      console.log('NO TOKEN - request will fail');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - obsługa błędów
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token wygasł - wyloguj użytkownika
      await SecureStore.deleteItemAsync('access_token', KEYCHAIN_OPTIONS);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  registerEmail: async (email, password, firstName, lastName) => {
    const response = await api.post('/auth/register/email', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  },

  loginEmail: async (email, password) => {
    const response = await api.post('/auth/login/email', {
      email,
      password,
    });
    console.log('Login response:', response.data);
    if (response.data.token) {
      console.log('Saving token to SecureStore');
      await SecureStore.setItemAsync('access_token', response.data.token, KEYCHAIN_OPTIONS);
      console.log('Token saved successfully');
    } else {
      console.log('NO TOKEN in response!');
    }
    return response.data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('access_token', KEYCHAIN_OPTIONS);
  },
};

export const userService = {
  getProfile: async () => {
    const response = await api.get('/users/me');
    console.log('getProfile response:', response.data);
    return response.data.user || response.data; // Zwróć obiekt user, nie cały response
  },

  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },
};

export const receiptService = {
  scanReceipt: async (imageUri) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'receipt.jpg',
    });

    const response = await api.post('/receipts/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/receipts/history');
    console.log('getHistory response:', response.data);
    return response.data.data?.receipts || response.data.receipts || response.data;
  },
};

export const loyaltyService = {
  getLevels: async () => {
    const response = await api.get('/loyalty/levels');
    console.log('getLevels response:', response.data);
    return response.data.data?.levels || response.data.levels || response.data;
  },

  redeemPoints: async (productId, quantity = 1) => {
    const response = await api.post('/loyalty/redeem', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },
};

export const shopService = {
  // Get auto-login URL for WooCommerce shop
  getShopLoginUrl: async (redirectTo = null) => {
    const params = redirectTo ? { redirect_to: redirectTo } : {};
    const response = await api.get('/shop-auth/login-url', { params });
    console.log('getShopLoginUrl response:', response.data);
    return response.data.data || response.data;
  },

  getProducts: async () => {
    const response = await api.get('/shop/products');
    console.log('getProducts response:', response.data);
    return response.data.data || response.data;
  },

  getProductById: async (productId) => {
    const response = await api.get(`/shop/products/${productId}`);
    console.log('getProductById response:', response.data);
    return response.data;
  },

  redeemProduct: async (productId, quantity = 1) => {
    const response = await api.post('/shop/redeem', {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  getRedemptionHistory: async () => {
    const response = await api.get('/shop/redemptions');
    console.log('getRedemptionHistory response:', response.data);
    return response.data.data?.redemptions || response.data.redemptions || response.data;
  },

  // Sklepy partnerskie w pobliżu (sortowane po dystansie)
  getNearbyStores: async (lat, lng, radiusKm = 50, limit = 20) => {
    const response = await api.get('/shop/stores/nearby', {
      params: { lat, lng, radius_km: radiusKm, limit },
    });
    return response.data.data || response.data;
  },
};

export default api;
