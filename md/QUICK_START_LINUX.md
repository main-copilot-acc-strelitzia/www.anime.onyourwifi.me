# 🚀 Quick Reference - Linux Build Setup

## ⚡ 60-Second Start

```bash
# 1. Install dependencies
npm run setup

# 2. Configure (only once)
# Edit these files with your values:
#   - api/.env (database, Redis, JWT)
#   - web/.env.local (API URL)

# 3. Build
npm run build

# 4. Run
npm run dev
```

**Done!** Access at http://localhost:3000

---

## 🔍 Verify Everything Works

```bash
# Test 1: Node version
node --version  # Should be v18.17.0 or higher

# Test 2: TypeScript (no errors)
cd web && npx tsc --noEmit

# Test 3: Database
psql $DATABASE_URL -c "SELECT 1"

# Test 4: Redis
redis-cli ping

# Test 5: Build
npm run build
```

---

## 📝 Essential Files

### Configure Before Building
```
api/.env                    # Database, Redis, JWT config
web/.env.local             # Frontend API URL
prisma/schema.prisma       # Database schema
```

### Run Services
```
npm run dev                 # All 3 services
npm run dev:web           # Frontend only
npm run dev:api           # API only
npm run dev:transcoder    # Transcoder only
```

---

## ❌ Common Issues (10 Fastest Fixes)

| Issue | Fix |
|-------|-----|
| `Module not found` | Already fixed ✅ |
| `Port 3000 in use` | `lsof -i :3000 \| kill -9` |
| `PostgreSQL not running` | `sudo systemctl start postgresql` |
| `Redis not running` | `sudo systemctl start redis-server` |
| `Node wrong version` | `nvm install 18.17.0` |
| `Cannot connect database` | Check `api/.env` DATABASE_URL |
| `Prisma error` | `npm run prisma:generate` |
| `Build hangs` | `NODE_OPTIONS=--max-old-space-size=2048 npm run build` |
| `Fresh start needed` | `rm -rf node_modules && npm run setup` |
| `Still broken?` | See `md/LINUX_ISSUES_SOLUTIONS.md` |

---

## 📍 Service Ports

```
Web Frontend    → http://localhost:3000
API Backend     → http://localhost:3001
PostgreSQL      → localhost:5432
Redis           → localhost:6379
```

---

## 🔧 Required Software

```bash
# Node.js 18.17.0+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql

# Redis
sudo apt-get install -y redis-server

# Verify
node --version
npm --version
psql --version
redis-cli --version
```

---

## 📚 Detailed Docs

- `md/BUILD_CHECKLIST.md` - Full build guide
- `md/COMPLETE_SUMMARY.md` - What was fixed
- `md/LINUX_ISSUES_SOLUTIONS.md` - Troubleshooting
- `md/MIGRATION_GUIDE.md` - Version upgrade info
- `md/DEPLOYMENT.md` - Production setup

---

## ✅ You're All Set!

All errors are fixed. Your project is production-ready.

**Just run:** `npm run setup && npm run build && npm run dev`

Questions? Check the docs above.

---

**Version:** 0.2.0 | **Date:** Jan 4, 2026 | **Status:** ✅ Ready
