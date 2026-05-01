# Checklist wdrożenia Go-Fans do App Store

## ✅ ZROBIONE

### Konfiguracja aplikacji
- [x] **app.json** - kompletna konfiguracja
- [x] **eas.json** - konfiguracja buildów
- [x] **Ikona** - 1024x1024 px PNG
- [x] **Splash Screen** - przygotowany
- [x] **Bundle Identifier**: com.gofans.app
- [x] **Uprawnienia iOS**: Camera, Photo Library
- [x] **Privacy Policy URL**: https://go-fans.pl/polityka-prywatnosci/

---

## 🔨 DO ZROBIENIA PRZED WYSŁANIEM

### 1. Backend API (KRYTYCZNE!)
- [ ] Wdrożyć backend na serwer produkcyjny
- [ ] Skonfigurować subdomenę **api.go-fans.pl**
- [ ] Zainstalować certyfikat SSL (Let's Encrypt)
- [ ] Skonfigurować CORS dla domeny mobilnej
- [ ] Przetestować wszystkie endpointy API

**Kroki wdrożenia backendu:**
```bash
# 1. Wybierz hosting (np. DigitalOcean, AWS, Heroku)
# 2. Skonfiguruj DNS dla api.go-fans.pl
# 3. Zainstaluj Node.js na serwerze
# 4. Sklonuj projekt Go-fans
# 5. Zainstaluj zależności: npm install
# 6. Skonfiguruj PostgreSQL
# 7. Ustaw zmienne środowiskowe (.env)
# 8. Uruchom migracje: npm run migrate
# 9. Uruchom backend: npm start (lub PM2)
# 10. Zainstaluj SSL (certbot)
```

---

### 2. Expo Account i EAS
- [ ] Zaloguj się do Expo: `npx expo login`
- [ ] Zainstaluj EAS CLI: `npm install -g eas-cli`
- [ ] Zaloguj się do EAS: `eas login`
- [ ] Skonfiguruj projekt: `eas build:configure`

---

### 3. Testowanie aplikacji
- [ ] Test rejestracji i logowania
- [ ] Test dashboard i wyświetlania punktów
- [ ] Test skanowania paragonów (aparat + galeria)
- [ ] Test historii paragonów
- [ ] Test profilu użytkownika
- [ ] Test obsługi błędów i offline mode
- [ ] Test na prawdziwym urządzeniu iOS

---

### 4. Screenshots do App Store
Apple wymaga screenshots w różnych rozmiarach:

**iPhone wymagane:**
- [ ] 6.7" (iPhone 14 Pro Max): 1290 x 2796 px - **3-10 zdjęć**
- [ ] 6.5" (iPhone 11 Pro Max): 1242 x 2688 px - **3-10 zdjęć**

**Opcjonalne:**
- [ ] iPad Pro 12.9": 2048 x 2732 px
- [ ] iPad Pro 11": 1668 x 2388 px

**Zawartość screenshots:**
1. Ekran logowania
2. Dashboard z punktami
3. Skanowanie paragonu
4. Historia paragonów
5. Profil użytkownika

---

### 5. Metadane App Store

**Przygotuj teksty:**
- [ ] **Nazwa aplikacji**: "Go-Fans" (max 30 znaków)
- [ ] **Subtitle**: "Program lojalnościowy" (max 30 znaków)
- [ ] **Opis krótki** (170 znaków):
  ```
  Zbieraj punkty za zakupy w Go-Fans i wymieniaj je na ekskluzywne nagrody. Skanuj paragony, śledź swoje punkty i ciesz się nagrodami!
  ```
- [ ] **Opis długi** (max 4000 znaków) - rozwinięcie funkcji
- [ ] **Słowa kluczowe**: "lojalnościowy,punkty,zakupy,paragony,nagrody,go-fans" (max 100 znaków)
- [ ] **Support URL**: https://go-fans.pl/pomoc lub adres email
- [ ] **Marketing URL**: https://go-fans.pl

**Kategoria:**
- [ ] Primary: **Lifestyle** lub **Shopping**
- [ ] Secondary: **Finance** (opcjonalnie)

---

### 6. App Store Connect - Konfiguracja

**W App Store Connect:**
- [ ] Utwórz nową aplikację
- [ ] Wpisz Bundle ID: **com.gofans.app**
- [ ] Dodaj metadane (nazwa, opis, keywords)
- [ ] Przesłać screenshots
- [ ] Ustawić kategorię
- [ ] Dodać Privacy Policy URL
- [ ] Ustawić rating wiekowy (prawdopodobnie 4+)
- [ ] Dodać informacje kontaktowe

---

### 7. Budowanie aplikacji

**Development build (do testów):**
```bash
eas build --profile development --platform ios
```

**Production build (do App Store):**
```bash
# iOS
eas build --profile production --platform ios

# Po zakończeniu build'a
eas submit --platform ios
```

---

### 8. Testy przed submission

**Wymagane testy:**
- [ ] Aplikacja działa offline (pokazuje błędy)
- [ ] Wszystkie formularze działają
- [ ] Nawigacja działa poprawnie
- [ ] Nie ma crashy przy uruchamianiu
- [ ] Aparat i galeria działają
- [ ] Dane są przechowywane bezpiecznie (SecureStore)

---

### 9. Compliance (zgodność)

**Apple wymaga:**
- [ ] **Privacy Policy** - ZROBIONE (https://go-fans.pl/polityka-prywatnosci/)
- [ ] **Data Usage** - opisz jakie dane zbierasz:
  - Email, imię, nazwisko
  - Zdjęcia paragonów (tylko do OCR, nie przechowywane)
  - Dane zakupów (kwoty, sklepy)
- [ ] **Export Compliance** - odpowiedz czy używasz szyfrowania
  - Tak (HTTPS, SecureStore) - ale standard, więc "No" w formularzu

---

### 10. Po zatwierdzeniu

- [ ] Monitor crash reports (Expo Dashboard)
- [ ] Odpowiadaj na recenzje użytkowników
- [ ] Przygotuj plan aktualizacji

---

## 📱 KOMENDY DO ZAPAMIĘTANIA

```bash
# Uruchom lokalnie
npm start

# Zaloguj do Expo
npx expo login

# Build development
eas build --profile development --platform ios

# Build produkcyjny
eas build --profile production --platform ios

# Wyślij do App Store
eas submit --platform ios

# Sprawdź status builda
eas build:list
```

---

## 🚨 WAŻNE UWAGI

1. **API URL**: Aplikacja automatycznie używa:
   - DEV mode: http://192.168.0.234:3000
   - PRODUCTION: https://api.go-fans.pl

2. **Wersjonowanie**:
   - Każda nowa wersja do App Store wymaga podniesienia `buildNumber` w app.json
   - Jeśli zmieniasz funkcjonalność, podnieś też `version` (np. 1.0.0 → 1.1.0)

3. **Czas review**: Apple zazwyczaj sprawdza aplikacje 24-48h

4. **Koszt**: EAS Build free tier = 30 build/miesiąc

---

## ✅ GOTOWE DO PRODUKCJI GDY:

- [x] app.json skonfigurowany
- [x] eas.json utworzony
- [x] Ikony i splash screen dodane
- [ ] Backend wdrożony na api.go-fans.pl
- [ ] Wszystkie testy przeszły
- [ ] Screenshots przygotowane
- [ ] Metadane gotowe
- [ ] App Store Connect skonfigurowany
