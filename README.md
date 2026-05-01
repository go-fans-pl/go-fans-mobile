# Go-Fans Mobile App

Aplikacja mobilna programu lojalnościowego Go-Fans zbudowana w React Native z Expo.

## Funkcje

- Rejestracja i logowanie użytkowników
- Dashboard z punktami lojalnościowymi i poziomami
- Skanowanie paragonów (aparat lub galeria)
- Historia zeskanowanych paragonów
- Profil użytkownika ze statystykami

## Wymagania

- Node.js 18+
- Expo Go na telefonie (iOS/Android)
- Backend API uruchomiony lokalnie

## Instalacja

```bash
npm install
```

## Konfiguracja

1. Sprawdź adres IP swojego komputera:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Zaktualizuj adres IP w `app.json`:
   ```json
   "extra": {
     "apiUrl": "http://TWOJ_ADRES_IP:3000"
   }
   ```

3. Upewnij się, że backend API działa na porcie 3000

## Uruchomienie

```bash
npm start
```

Zeskanuj kod QR w aplikacji Expo Go na telefonie.

## Struktura projektu

```
go-fans-mobile/
├── src/
│   ├── screens/        # Ekrany aplikacji
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   ├── ScanReceiptScreen.js
│   │   ├── HistoryScreen.js
│   │   └── ProfileScreen.js
│   ├── services/       # Serwisy API
│   │   └── api.js
│   └── components/     # Komponenty (do rozbudowy)
├── App.js              # Główny komponent z nawigacją
├── app.json            # Konfiguracja Expo
├── config.js           # Konfiguracja API
└── package.json
```

## Testowanie

1. Upewnij się, że backend działa:
   ```bash
   cd ../Go-fans
   npm start
   ```

2. Uruchom aplikację mobilną:
   ```bash
   npm start
   ```

3. Zeskanuj QR kod w Expo Go

4. Przetestuj funkcje:
   - Rejestracja nowego użytkownika
   - Logowanie
   - Przeglądanie dashboardu
   - Skanowanie paragonu
   - Historia paragonów

## Troubleshooting

### "Network request failed"
- Sprawdź czy telefon i komputer są w tej samej sieci WiFi
- Sprawdź czy backend działa (curl http://localhost:3000/health)
- Zweryfikuj adres IP w app.json

### "Unauthorized"
- Wyloguj się i zaloguj ponownie
- Sprawdź czy backend przyjmuje żądania z tokenem

### Aparat nie działa
- Upewnij się, że przyznałeś uprawnienia do aparatu
- Spróbuj użyć opcji "Wybierz z galerii"

## Backend API

Backend musi być uruchomiony przed testowaniem aplikacji.
Zobacz dokumentację backendu w `../Go-fans/API.md`

## Licencja

ISC
