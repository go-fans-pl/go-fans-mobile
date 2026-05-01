import Constants from 'expo-constants';

// Sprawdza czy jesteś w trybie deweloperskim czy produkcyjnym
const isDevelopment = __DEV__;

// TYMCZASOWO: Używamy produkcyjnego API do testów
// W trybie dev używa lokalnego API, w produkcji używa api.go-fans.pl
const API_BASE_URL = 'https://api.go-fans.pl'; // Tymczasowo zawsze produkcyjne API
// const API_BASE_URL = isDevelopment
//   ? (Constants.expoConfig?.extra?.devApiUrl || 'http://192.168.0.234:3000')
//   : (Constants.expoConfig?.extra?.apiUrl || 'https://api.go-fans.pl');

export default {
  API_BASE_URL,
  API_TIMEOUT: 10000,
  PRIVACY_POLICY_URL: Constants.expoConfig?.extra?.privacyPolicyUrl || 'https://go-fans.pl/polityka-prywatnosci/',
  WEBSITE_URL: Constants.expoConfig?.extra?.websiteUrl || 'https://go-fans.pl',
};
