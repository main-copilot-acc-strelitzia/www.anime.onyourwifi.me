# Linux Build - Potential Issues & Solutions

## ✅ Already Fixed

- [x] Module import resolution (`@/` path aliases)
- [x] TypeScript deprecation warnings
- [x] Prisma schema configuration
- [x] Environment variable templates
- [x] All 40+ relative imports standardized

---

## ⚠️ Potential Issues You Might Encounter

### Issue 1: Database Connection on Linux

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** PostgreSQL not running or not listening on localhost

**Fix:**
```bash
# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql

# Check if running
sudo -u postgres psql -c "SELECT 1"

# Create database
sudo -u postgres createdb strelitzia
sudo -u postgres createuser -P strelitzia_user
```

**Verify:**
```bash
psql -U strelitzia_user -h localhost -d strelitzia -c "SELECT 1"
```

---

### Issue 2: Redis Connection on Linux

**Symptom:**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Cause:** Redis not running

**Fix:**
```bash
# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server
sudo systemctl status redis-server

# Check if running
redis-cli ping  # Should return PONG
```

---

### Issue 3: Port Already in Use

**Symptom:**
```
Error: listen EADDRINUSE :::3000
Error: listen EADDRINUSE :::3001
```

**Cause:** Ports occupied by other processes

**Fix:**
```bash
# Find process using port 3000
lsof -i :3000
kill -9 <PID>

# Find process using port 3001
lsof -i :3001
kill -9 <PID>

# Or change ports in .env
# api/.env: PORT=3002
# web/package.json: "dev": "next dev -p 3002"
```

---

### Issue 4: Node Version Mismatch

**Symptom:**
```
Node version is 16.x.x but 18.17.0+ is required
```

**Fix:**
```bash
# Check current version
node --version

# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node 18.17.0
nvm install 18.17.0
nvm use 18.17.0
nvm alias default 18.17.0

# Verify
node --version  # Should be v18.17.0+
```

---

### Issue 5: Missing Dependencies

**Symptom:**
```
Cannot find module 'next'
Cannot find module '@nestjs/core'
```

**Fix:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm run setup

# Or selective reinstall
cd web && npm install
cd ../api && npm install
cd ../transcoder && npm install
```

---

### Issue 6: Permission Denied Errors

**Symptom:**
```
Error: EACCES: permission denied, open '/opt/strelitzia/storage/uploads'
```

**Cause:** Incorrect directory permissions

**Fix:**
```bash
# Create storage directories
mkdir -p /opt/strelitzia/storage/{uploads,videos,thumbnails}

# Set permissions
sudo chown -R $USER:$USER /opt/strelitzia/storage
chmod -R 755 /opt/strelitzia/storage

# Or set in .env
export STORAGE_PATH="$HOME/strelitzia-storage"
mkdir -p $STORAGE_PATH
```

---

### Issue 7: Build Hangs or Timeout

**Symptom:**
```
npm run build takes > 5 minutes
npm run dev hangs at startup
```

**Cause:** System resources, slow disk, or large node_modules

**Fix:**
```bash
# Check system resources
free -h        # RAM
df -h          # Disk space
top -b -n1     # CPU usage

# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build

# Clear caches
npm cache clean --force
rm -rf web/.next api/dist .turbo

# Rebuild
npm run build
```

---

### Issue 8: Prisma Migration Errors

**Symptom:**
```
Error: P1000 (Authentication failed)
Error: P1001 (Can't reach database)
```

**Cause:** Wrong credentials or database not ready

**Fix:**
```bash
# Check .env values
cat api/.env | grep DATABASE

# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Reset migrations if needed
npm run prisma:generate
npm run migrate:deploy

# Or reset from scratch
npm run prisma:migrate reset
```

---

### Issue 9: CORS Errors in Browser

**Symptom:**
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource
```

**Cause:** CORS_ORIGIN not matching frontend domain

**Fix:**
```bash
# In api/.env
CORS_ORIGIN="http://localhost:3000"
# Or for production
CORS_ORIGIN="https://yourdomain.com"

# Restart API after change
npm run dev:api
```

---

### Issue 10: Memory Issues in Docker/Container

**Symptom:**
```
JavaScript heap out of memory
Kill signal from container
```

**Cause:** Insufficient memory allocation

**Fix:**
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Or in systemd service
Environment="NODE_OPTIONS=--max-old-space-size=2048"

# Check memory usage
ps aux | grep node
```

---

## 🔍 Diagnostic Commands

### Check Environment
```bash
# Node and npm versions
node --version
npm --version

# Check PATH
which node
which npm

# Environment variables
env | grep NODE
env | grep DATABASE
env | grep REDIS
```

### Check Services
```bash
# PostgreSQL
sudo systemctl status postgresql
psql --version
psql -U postgres -h localhost -c "SELECT 1"

# Redis
sudo systemctl status redis-server
redis-cli --version
redis-cli ping

# Ports
netstat -tlnp | grep -E ':(3000|3001|5432|6379)'
lsof -i :3000
```

### Check Logs
```bash
# System logs
journalctl -u postgresql -n 50
journalctl -u redis-server -n 50

# Application logs
tail -f web/logs/*.log
tail -f api/logs/*.log
npm run dev 2>&1 | tee build.log
```

---

## 📋 Pre-Build Verification Script

```bash
#!/bin/bash
echo "=== Strelitzia Linux Pre-Build Check ==="

echo "1. Checking Node.js..."
node --version || echo "❌ Node.js not found"

echo "2. Checking npm..."
npm --version || echo "❌ npm not found"

echo "3. Checking PostgreSQL..."
psql --version || echo "❌ PostgreSQL not found"
sudo systemctl status postgresql 2>/dev/null || echo "⚠️  PostgreSQL service check"

echo "4. Checking Redis..."
redis-cli --version || echo "❌ Redis not found"
redis-cli ping 2>/dev/null || echo "⚠️  Redis service check"

echo "5. Checking ports..."
lsof -i :3000 && echo "⚠️  Port 3000 in use" || echo "✅ Port 3000 available"
lsof -i :3001 && echo "⚠️  Port 3001 in use" || echo "✅ Port 3001 available"

echo "6. Checking .env files..."
test -f api/.env && echo "✅ api/.env exists" || echo "❌ api/.env missing"
test -f web/.env.local && echo "✅ web/.env.local exists" || echo "❌ web/.env.local missing"

echo "7. Testing database connection..."
psql $DATABASE_URL -c "SELECT 1" 2>/dev/null && echo "✅ Database accessible" || echo "⚠️  Database check"

echo "=== Pre-Build Check Complete ==="
```

---

## 🚀 Quick Start for Linux

```bash
# 1. Clone and setup
git clone <repo>
cd anime
npm run setup

# 2. Configure
cp api/.env.example api/.env
cp web/.env.local.example web/.env.local
# Edit with your values

# 3. Install services (if needed)
sudo apt-get install -y postgresql redis-server nginx

# 4. Start services
sudo systemctl start postgresql redis-server

# 5. Build
npm run build

# 6. Run
npm run dev

# Access
# Web: http://localhost:3000
# API: http://localhost:3001
```

---

## 📊 Performance Optimization for Linux

### Increase File Watchers (for Next.js)
```bash
# Temporary
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Permanent in /etc/sysctl.conf
fs.inotify.max_user_watches=524288
```

### Enable Swap (if low RAM)
```bash
# Check current swap
free -h

# Create 2GB swapfile
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Use Production Build
```bash
# Development (slower, watches files)
npm run dev

# Production (faster, no watches)
npm run build
npm run start:web
npm run start:api
npm run start:transcoder
```

---

## 🔗 Helpful Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs)
- [Node.js Docs](https://nodejs.org/docs)
- [Ubuntu PostgreSQL](https://ubuntu.com/server/docs/databases-postgresql)

---

## 📞 Getting Help

If you encounter issues:

1. **Check logs:**
   ```bash
   npm run dev 2>&1 | tee debug.log
   ```

2. **Check environment:**
   ```bash
   env | grep -E 'NODE|DATABASE|REDIS|CORS'
   ```

3. **Check services:**
   ```bash
   sudo systemctl status postgresql redis-server
   ```

4. **Try fresh install:**
   ```bash
   rm -rf node_modules package-lock.json
   npm run setup
   ```

5. **Check TypeScript errors:**
   ```bash
   cd web && npx tsc --noEmit
   cd ../api && npx tsc --noEmit
   ```

---

**Version:** 0.2.0  
**Last Updated:** January 4, 2026  
**Platform:** Linux Ready ✅
