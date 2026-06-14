import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

import ErrorBoundary from './src/components/ErrorBoundary';

// Musi być identyczny jak w src/services/api.js — token zapisany pod tym
// keychainService da się odczytać tylko podając ten sam service (iOS).
const KEYCHAIN_OPTIONS = { keychainService: 'com.gofans.app' };

// Importy ekranów
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreenV2';
import ScanReceiptScreen from './src/screens/ScanReceiptScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ShopScreen from './src/screens/ShopScreen';
import RedemptionHistoryScreen from './src/screens/RedemptionHistoryScreen';
import PartnerStoresScreen from './src/screens/PartnerStoresScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('access_token', KEYCHAIN_OPTIONS);
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('access_token', KEYCHAIN_OPTIONS);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return null; // Możesz dodać splash screen
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator>
        {!isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              options={{ title: 'Logowanie' }}
            >
              {props => <LoginScreen {...props} onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Rejestracja' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              options={{ title: 'Go-Fans' }}
            >
              {props => <DashboardScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="ScanReceipt"
              component={ScanReceiptScreen}
              options={{ title: 'Skanuj Paragon' }}
            />
            <Stack.Screen
              name="History"
              component={HistoryScreen}
              options={{ title: 'Historia' }}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: 'Profil' }}
            />
            <Stack.Screen
              name="Shop"
              component={ShopScreen}
              options={{ title: 'Wymień punkty' }}
            />
            <Stack.Screen
              name="RedemptionHistory"
              component={RedemptionHistoryScreen}
              options={{ title: 'Historia wymian' }}
            />
            <Stack.Screen
              name="PartnerStores"
              component={PartnerStoresScreen}
              options={{ title: 'Sklepy w pobliżu' }}
            />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
