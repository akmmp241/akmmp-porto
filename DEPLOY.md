# Deploy Guide - Home Server (Docker Only)

## Prerequisites di Server

```bash
# 1. Pastikan postgres udah jalan
docker ps | grep postgres

# 2. Buat network shared (kalo belum ada)
docker network create shared

# 3. Pastikan postgres join network shared
docker network connect shared <postgres-container-name>
```

## Setup Pertama Kali di Server

### 1. Buat folder project

```bash
mkdir -p ~/akmmp-porto
cd ~/akmmp-porto
```

### 2. Download file yang diperlukan

```bash
# Download docker-compose.prod.yml dari repo
wget https://raw.githubusercontent.com/<user>/<repo>/main/docker-compose.prod.yml

# Atau copy manual via scp:
# scp docker-compose.prod.yml user@server:~/akmmp-porto/
```

### 3. Buat .env.production

```bash
cat > .env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=postgres://user:pass@postgres-container-name:5432/portfolio
ORIGIN=https://yourdomain.com
PUBLIC_SITE_URL=https://yourdomain.com
GITHUB_TOKEN=ghp_xxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=your-email@gmail.com
EOF
```

**Catatan DATABASE_URL:**

- Hostname = nama container postgres yang udah jalan (cek `docker ps`)
- Port = `5432` (internal port postgres, bukan port expose)
- Pastikan postgres udah join network `shared`

### 4. Pull image pertama kali

```bash
docker pull akmalmp241/akmmp-porto:latest
```

### 5. Init database

Jalankan migration sekali via container:

```bash
# Run migration
docker run --rm \
  --network shared \
  --env-file .env.production \
  akmalmp241/akmmp-porto:latest \
  /app/migrate.sh
```

### 6. Start app

```bash
docker compose -f docker-compose.prod.yml up -d
```

## Deploy Workflow - Build Local, Push Registry

### Di Local Machine

```bash
# 1. Build image
docker compose -f docker-compose.prod.yml build

# 2. Push ke registry
docker push akmalmp241/akmmp-porto:latest
```

### Di Server

```bash
cd ~/akmmp-porto

# 1. Pull image terbaru
docker pull akmalmp241/akmmp-porto:latest

# 2. Stop & remove container lama
docker compose -f docker-compose.prod.yml down

# 3. Start container baru
docker compose -f docker-compose.prod.yml up -d

# 4. Check logs
docker logs -f akmmp-web
```

## Update Database Schema

Kalo ada perubahan schema (setelah pull image baru):

```bash
# Run migration sekali
docker run --rm \
  --network shared \
  --env-file .env.production \
  akmalmp241/akmmp-porto:latest \
  /app/migrate.sh

# Restart app
docker compose -f docker-compose.prod.yml restart
```

## Troubleshooting

### App gak bisa connect ke postgres

```bash
# Cek network
docker network inspect shared

# Pastikan postgres & app ada di list "Containers"
# Kalo postgres belum join:
docker network connect shared <postgres-container-name>

# Test connection dari app container
docker run --rm --network shared postgres:16-alpine \
  psql postgres://user:pass@postgres-container:5432/portfolio -c "SELECT 1;"
```

### Check healthcheck

```bash
docker inspect akmmp-web | grep -A 10 Health
```

### Manual migration troubleshooting

```bash
# Exec ke container yang lagi jalan
docker exec -it akmmp-web sh

# Di dalam container:
/app/migrate.sh
```

### Reset database

```bash
# HATI-HATI: ini hapus semua data
docker exec -it <postgres-container> psql -U postgres -c "DROP DATABASE portfolio;"
docker exec -it <postgres-container> psql -U postgres -c "CREATE DATABASE portfolio;"

# Re-run migration
docker run --rm --network shared --env-file .env.production \
  akmalmp241/akmmp-porto:latest /app/migrate.sh
```

## Quick Commands

```bash
# Logs
docker logs -f akmmp-web

# Shell ke container
docker exec -it akmmp-web sh

# Restart
docker compose -f docker-compose.prod.yml restart

# Stop & remove
docker compose -f docker-compose.prod.yml down

# Clean up old images
docker image prune -a
```

## File Structure di Server

```
~/akmmp-porto/
├── docker-compose.prod.yml
└── .env.production  (NEVER commit to git)
```

Image contain semua yang diperlukan (code, deps, migration script).
