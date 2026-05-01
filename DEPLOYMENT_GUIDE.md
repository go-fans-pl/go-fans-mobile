# Przewodnik wdrożenia Go-Fans Backend na VPS Mikrus

## Informacje o serwerze
- **VPS:** Mikrus anna137
- **RAM:** 1280MB
- **Dysk:** 15GB
- **Baza danych:** gofans
- **User DB:** gofans_user
- **System:** Debian/Ubuntu (prawdopodobnie)

---

## KROK 1: Znajdź IP serwera

### W panelu Mikrus (mikr.us/panel):
1. Przejdź do **"Parametry i logi"**
2. Znajdź **"Adres IPv4"**
3. Zapisz go: `___________________`

---

## KROK 2: Konfiguracja DNS

### W panelu Hostido:

1. Zaloguj się do https://hostido.pl
2. Przejdź do **"Domeny"** → **"go-fans.pl"**
3. Kliknij **"Zarządzaj DNS"** lub **"Strefy DNS"**
4. Dodaj nowy rekord **A**:

```
Typ:         A
Nazwa/Host:  api
Wskazuje na: [TWOJE IP Z KROKU 1]
TTL:         3600
```

5. Zapisz zmiany
6. Poczekaj 5-10 minut na propagację DNS

### Sprawdzenie czy działa:

W PowerShell:
```powershell
nslookup api.go-fans.pl
```

Powinno pokazać IP twojego VPS.

---

## KROK 3: Przygotowanie klucza SSH

### Na Windows (PowerShell):

```powershell
# Utwórz folder .ssh jeśli nie istnieje
mkdir ~\.ssh -ErrorAction SilentlyContinue

# Otwórz notatnik
notepad ~\.ssh\go-fans-key
```

### W notatniku:
1. Wklej **KLUCZ PRYWATNY** (dostałeś go od Mikrus przy tworzeniu VPS)
2. Zapisz plik
3. Zamknij notatnik

**UWAGA:** Klucz prywatny to ten który zaczyna się od:
```
-----BEGIN OPENSSH PRIVATE KEY-----
```

---

## KROK 4: Połączenie z VPS przez SSH

### W PowerShell:

```powershell
# Zastąp [IP] adresem z KROKU 1
ssh -i ~\.ssh\go-fans-key root@[IP]
```

**Przykład:**
```powershell
ssh -i ~\.ssh\go-fans-key root@123.45.67.89
```

### Przy pierwszym połączeniu:
Zobaczysz pytanie:
```
Are you sure you want to continue connecting (yes/no)?
```
Wpisz: **yes** i naciśnij Enter

### Jeśli wszystko OK, zobaczysz:
```
Welcome to Debian GNU/Linux 11 (bullseye)
Last login: ...
root@anna137:~#
```

---

## KROK 5: Sprawdzenie systemu i aktualizacja

### Na VPS (po połączeniu przez SSH):

```bash
# Sprawdź system
cat /etc/os-release

# Aktualizuj system
apt update && apt upgrade -y

# Sprawdź czy Node.js jest zainstalowany
node -v
npm -v

# Sprawdź PostgreSQL
psql --version
```

---

## KROK 6: Instalacja Node.js

### Jeśli Node.js NIE jest zainstalowany:

```bash
# Dodaj repozytorium NodeSource (Node.js 20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -

# Zainstaluj Node.js
apt install -y nodejs

# Sprawdź wersję
node -v
npm -v
```

---

## KROK 7: Instalacja PostgreSQL

### Sprawdź czy PostgreSQL jest zainstalowany:

```bash
psql --version
```

### Jeśli NIE ma PostgreSQL:

```bash
# Zainstaluj PostgreSQL
apt install -y postgresql postgresql-contrib

# Uruchom PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Sprawdź status
systemctl status postgresql
```

---

## KROK 8: Konfiguracja PostgreSQL

### Utwórz bazę danych i użytkownika:

```bash
# Przełącz się na użytkownika postgres
sudo -u postgres psql

# W PostgreSQL (konsola psql):
CREATE DATABASE gofans;
CREATE USER gofans_user WITH PASSWORD 'Michal!@#123';
GRANT ALL PRIVILEGES ON DATABASE gofans TO gofans_user;

# PostgreSQL 15+ wymaga dodatkowych uprawnień:
\c gofans
GRANT ALL ON SCHEMA public TO gofans_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gofans_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gofans_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gofans_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gofans_user;

# Wyjdź z psql
\q
```

### Test połączenia:

```bash
psql -U gofans_user -d gofans -h localhost -W
# Wpisz hasło: Michal!@#123
# Jeśli się połączy, wpisz: \q aby wyjść
```

---

## KROK 9: Przesłanie kodu backendu na VPS

### OPCJA A: Przez Git (jeśli masz repozytorium)

```bash
# Zainstaluj Git
apt install -y git

# Sklonuj repozytorium
cd /var/www
git clone [URL_REPOZYTORIUM] go-fans-backend
cd go-fans-backend
```

### OPCJA B: Przez SCP (z lokalnego komputera)

**Na TWOIM komputerze (PowerShell):**

```powershell
# Z folderu D:\CLAUDE\Go-fans
cd D:\CLAUDE\Go-fans

# Prześlij na VPS (zastąp [IP] swoim IP)
scp -i ~\.ssh\go-fans-key -r . root@[IP]:/var/www/go-fans-backend
```

---

## KROK 10: Instalacja zależności

### Na VPS:

```bash
cd /var/www/go-fans-backend

# Zainstaluj zależności
npm install

# Opcjonalnie: zainstaluj PM2 globalnie
npm install -g pm2
```

---

## KROK 11: Konfiguracja zmiennych środowiskowych

### Utwórz plik .env:

```bash
cd /var/www/go-fans-backend
nano .env
```

### Wklej zawartość (dostosuj wartości):

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gofans
DB_USER=gofans_user
DB_PASSWORD=Michal!@#123

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=twoj-super-tajny-klucz-min-32-znaki-losowe-xyz123
JWT_EXPIRES_IN=7d

# Google Cloud Vision (jeśli używasz)
GOOGLE_APPLICATION_CREDENTIALS=/var/www/go-fans-backend/google-cloud-key.json

# WooCommerce (jeśli używasz)
WC_URL=https://go-fans.pl
WC_CONSUMER_KEY=twoj_klucz
WC_CONSUMER_SECRET=twoj_secret

# Twilio SMS (jeśli używasz)
TWILIO_ACCOUNT_SID=twoj_sid
TWILIO_AUTH_TOKEN=twoj_token
TWILIO_PHONE_NUMBER=+48123456789

# CORS
ALLOWED_ORIGINS=https://go-fans.pl,https://api.go-fans.pl
```

**Zapisz plik:** Ctrl+O, Enter, Ctrl+X

---

## KROK 12: Uruchomienie migracji bazy danych

### Utwórz tabele:

```bash
cd /var/www/go-fans-backend

# Uruchom migracje
npm run migrate

# Opcjonalnie: załaduj dane testowe
npm run seed:admin
npm run seed:stores
npm run seed:levels
```

---

## KROK 13: Test backendu

### Uruchom backend testowo:

```bash
cd /var/www/go-fans-backend
node app.js
```

Powinieneś zobaczyć:
```
Server running on port 3000
Database connected
```

### Test z innego terminala (nowe okno PowerShell):

```powershell
# Zastąp [IP] swoim IP
curl http://[IP]:3000/health
```

Powinno zwrócić:
```json
{"status":"ok"}
```

**Zatrzymaj serwer:** Ctrl+C w oknie SSH

---

## KROK 14: Instalacja i konfiguracja Nginx

### Zainstaluj Nginx:

```bash
apt install -y nginx

# Utwórz konfigurację dla api.go-fans.pl
nano /etc/nginx/sites-available/go-fans-api
```

### Wklej konfigurację:

```nginx
server {
    listen 80;
    server_name api.go-fans.pl;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Zapisz:** Ctrl+O, Enter, Ctrl+X

### Aktywuj konfigurację:

```bash
# Utwórz symlink
ln -s /etc/nginx/sites-available/go-fans-api /etc/nginx/sites-enabled/

# Test konfiguracji
nginx -t

# Jeśli OK, uruchom Nginx
systemctl restart nginx
systemctl enable nginx
```

---

## KROK 15: Instalacja certyfikatu SSL (Let's Encrypt)

### Zainstaluj Certbot:

```bash
apt install -y certbot python3-certbot-nginx

# Uzyskaj certyfikat SSL
certbot --nginx -d api.go-fans.pl
```

### Podczas instalacji:
1. Podaj email: **twoj-email@example.com**
2. Zgódź się na Terms of Service: **Y**
3. Newsletter (opcjonalnie): **N**
4. Redirect HTTP → HTTPS: **2** (Yes)

### Automatyczne odnowienie:

```bash
# Test automatycznego odnowienia
certbot renew --dry-run
```

---

## KROK 16: Konfiguracja PM2 (auto-start backendu)

### Uruchom backend przez PM2:

```bash
cd /var/www/go-fans-backend

# Uruchom aplikację
pm2 start app.js --name go-fans-api

# Zapisz konfigurację PM2
pm2 save

# Ustaw auto-start przy restarcie serwera
pm2 startup

# Wykonaj komendę którą PM2 wyświetli (przykład):
# systemctl enable pm2-root

# Sprawdź status
pm2 status
pm2 logs go-fans-api
```

---

## KROK 17: Test końcowy

### Sprawdź czy API działa przez HTTPS:

**Na swoim komputerze (PowerShell):**

```powershell
# Test health endpoint
curl https://api.go-fans.pl/health

# Powinno zwrócić:
# {"status":"ok"}
```

### Test z aplikacji mobilnej:

1. Otwórz aplikację mobilną w Expo
2. Sprawdź czy działa logowanie/rejestracja
3. Sprawdź dashboard i funkcje

---

## KROK 18: Zabezpieczenie VPS (opcjonalne ale polecane)

### Firewall (UFW):

```bash
# Zainstaluj UFW
apt install -y ufw

# Zezwól na SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Włącz firewall
ufw enable

# Sprawdź status
ufw status
```

### Fail2Ban (ochrona przed atakami):

```bash
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

---

## KROK 19: Monitoring i logi

### Logi backendu:

```bash
# PM2 logs
pm2 logs go-fans-api

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*.log
```

---

## KROK 20: Aktualizacja kodu (w przyszłości)

### Gdy chcesz zaktualizować backend:

```bash
# Połącz się z VPS
ssh -i ~\.ssh\go-fans-key root@[IP]

# Przejdź do folderu
cd /var/www/go-fans-backend

# Pobierz zmiany (jeśli Git)
git pull

# Lub prześlij przez SCP z komputera

# Zainstaluj nowe zależności
npm install

# Uruchom migracje (jeśli są)
npm run migrate

# Zrestartuj aplikację
pm2 restart go-fans-api

# Sprawdź logi
pm2 logs go-fans-api
```

---

## KOMENDY DO ZAPAMIĘTANIA

```bash
# Połączenie z VPS
ssh -i ~\.ssh\go-fans-key root@[IP]

# Status backendu
pm2 status
pm2 logs go-fans-api

# Restart backendu
pm2 restart go-fans-api

# Restart Nginx
systemctl restart nginx

# Logi Nginx
tail -f /var/log/nginx/error.log

# Status PostgreSQL
systemctl status postgresql
```

---

## TROUBLESHOOTING

### Backend nie startuje:
```bash
pm2 logs go-fans-api --lines 50
```

### Błąd połączenia z bazą:
```bash
psql -U gofans_user -d gofans -h localhost
# Sprawdź .env, hasło, uprawnienia
```

### SSL nie działa:
```bash
certbot renew --force-renewal
systemctl restart nginx
```

### Port 3000 zajęty:
```bash
netstat -tulpn | grep 3000
# Zabij proces lub zmień port w .env
```

---

## CHECKLIST WDROŻENIA

- [ ] IP serwera znalezione
- [ ] DNS skonfigurowane (api.go-fans.pl)
- [ ] SSH działa
- [ ] Node.js zainstalowany
- [ ] PostgreSQL zainstalowany i skonfigurowany
- [ ] Baza danych utworzona
- [ ] Kod backendu przesłany
- [ ] .env skonfigurowany
- [ ] Migracje wykonane
- [ ] Backend działa lokalnie
- [ ] Nginx zainstalowany i skonfigurowany
- [ ] SSL certyfikat zainstalowany
- [ ] PM2 skonfigurowany (auto-start)
- [ ] Test https://api.go-fans.pl/health
- [ ] Test z aplikacji mobilnej
- [ ] Firewall skonfigurowany
- [ ] Monitoring działa

---

## GOTOWE! 🎉

Twój backend Go-Fans działa teraz na:
**https://api.go-fans.pl**

Aplikacja mobilna automatycznie przełączy się na produkcyjny URL gdy zbudujesz wersję produkcyjną przez EAS Build.
