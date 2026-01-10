# Strelitzia - Anime Streaming Platform

A modern, cross-platform anime streaming application with transcoding support. Works seamlessly on Windows, macOS, and Linux with Netflix/Crunchyroll-style dark UI.

## 🌍 Cross-Platform Support

This application runs identically on:

- ✅ **Windows 10/11** - Native support
- ✅ **macOS 11+** - Intel & Apple Silicon
- ✅ **Linux** - Ubuntu, Debian, CentOS, etc.

All scripts and configurations automatically adapt to your operating system.

---

## ✨ Features

- � **Netflix/Crunchyroll UI** - Dark theme with hero banner and carousel
- 🌐 **Cross-Platform** - Windows, macOS, Linux with universal scripts
- 🎥 **HLS Streaming** - Adaptive bitrate video streaming
- 🔄 **Background Transcoding** - Async video processing
- 👤 **Authentication** - Secure JWT-based auth with roles
- 🎨 **Responsive Design** - Mobile-first approach
- 🔒 **Security** - HTTPS, CORS, rate limiting, password hashing
- ⚡ **Performance** - Redis caching, optimized queries
- 📁 **Multi-Source Video** - Configure multiple video directories, SSDs, and network drives

---

## 🚀 Quick Start (All Platforms)

### Choose Your Installation Method

**🐧 For Debian Trixie (Native, No Docker):**
See [md/INSTALL_DEBIAN_TRIXIE.md](md/INSTALL_DEBIAN_TRIXIE.md) for complete step-by-step guide.

**For Other Platforms:**
Follow the universal setup below.

### 1. Prerequisites

- **Node.js:** 18.17.0 or higher ([Download](https://nodejs.org))
- **npm:** 9.0.0 or higher (included with Node.js)
- **Database:** PostgreSQL 14+ (required) or SQLite (dev mode only)
- **Optional:** Redis 6.0+ for caching, FFmpeg for transcoding

### 2. Setup

Universal setup that works on Windows, macOS, and Linux:

```bash
npm run setup
```

This automatically:

- ✅ Installs all dependencies
- ✅ Generates database client
- ✅ Creates `.env` files

### 3. Configure

Edit configuration files:

```bash
# API configuration
vi api/.env

# Web configuration  
vi web/.env.local
```

### 4. Run Development

**All services at once:**
```bash
npm run dev
```

**Individual services:**
```bash
npm run dev:web        # http://localhost:3000
npm run dev:api        # http://localhost:3001
npm run dev:transcoder # Background worker
```

### 5. Access

- **Web:** [http://localhost:3000](http://localhost:3000)
- **API:** [http://localhost:3001](http://localhost:3001)
- **Prisma Studio:** `npm run studio`

## 📚 Documentation

### Installation Guides

- [md/INSTALL_DEBIAN_TRIXIE.md](md/INSTALL_DEBIAN_TRIXIE.md) - **Complete Debian Trixie native setup (no Docker)**
- [install.sh](install.sh) - Cross-platform installer script
- [install.bat](install.bat) - Windows installer script

### System Setup & Configuration

| Document | Purpose |
| -------- | ------- |
| [md/DATABASE_SETUP.md](md/DATABASE_SETUP.md) | PostgreSQL database configuration |
| [md/TRANSCODING_SETUP.md](md/TRANSCODING_SETUP.md) | Video transcoding setup |
| [md/VIDEO_SOURCES_QUICK_START.md](md/VIDEO_SOURCES_QUICK_START.md) | Multi-source video configuration |
| [md/SETUP_VIDEO_SOURCES.md](md/SETUP_VIDEO_SOURCES.md) | Video sources implementation guide |

### Deployment & Migration

| Document | Purpose |
| -------- | ------- |
| [md/DEPLOYMENT.md](md/DEPLOYMENT.md) | Production deployment guide |
| [md/MIGRATION_GUIDE.md](md/MIGRATION_GUIDE.md) | v0.2.0 upgrade & dependency updates |
| [md/DEPLOYMENT_VIDEO_SOURCES.md](md/DEPLOYMENT_VIDEO_SOURCES.md) | Video sources deployment checklist |

### API & Technical Reference

| Document | Purpose |
| -------- | ------- |
| [md/API_DOCUMENTATION.md](md/API_DOCUMENTATION.md) | Complete API endpoints reference |
| [md/VIDEO_SOURCES_IMPLEMENTATION.md](md/VIDEO_SOURCES_IMPLEMENTATION.md) | Video sources technical architecture |
| [md/VIDEO_SOURCES_SUMMARY.md](md/VIDEO_SOURCES_SUMMARY.md) | Video sources system overview |

### Quick Reference

- [md/VIDEO_SOURCES_DOCS_INDEX.md](md/VIDEO_SOURCES_DOCS_INDEX.md) - Video sources documentation index
- [START_HERE.md](START_HERE.md) - Quick start guide

## 🔐 Pre-Deployment Checklist

- [ ] Update all dependencies: `npm run setup`
- [ ] Set secure JWT_SECRET in `.env`
- [ ] Configure database with strong password
- [ ] Enable HTTPS in production
- [ ] Configure CORS for your domain
- [ ] Set NODE_ENV=production
- [ ] Enable rate limiting
- [ ] Configure database backups
- [ ] Set up monitoring/alerting
- [ ] Run security audit: `npm audit`

## 📊 Project Structure

```
strelitzia/
├── web/                    # Next.js 14 frontend
│   ├── components/        # React components
│   ├── pages/            # App pages & routes
│   ├── styles/           # Tailwind CSS
│   ├── public/           # Static assets
│   ├── package.json      # Dependencies
│   └── next.config.js    # Build config
│
├── api/                   # NestJS 10 backend
│   ├── src/
│   │   ├── main.ts      # Entry point
│   │   └── modules/     # Feature modules
│   ├── prisma/          # Database schema
│   ├── package.json
│   └── tsconfig.json
│
├── transcoder/           # Video processing worker
│   ├── worker.ts
│   └── package.json
│
├── prisma/              # Database schema
│   └── schema.prisma
│
├── setup.js             # Cross-platform setup script
├── dev.js               # Development server launcher
├── package.json         # Root workspace config
└── .nvmrc              # Node version specification
```

## 🛠️ Available Commands

### Setup & Development
```bash
npm run setup              # Initial setup (all platforms)
npm run dev              # Start all services
npm run build            # Build all packages
npm run lint             # Lint code
```

### Service-Specific
```bash
npm run dev:web          # Web frontend only
npm run dev:api          # API backend only
npm run dev:transcoder   # Transcoder worker only
```

### Production
```bash
npm run start:web        # Start web server
npm run start:api        # Start API server
npm run start:transcoder # Start transcoder
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run migrate          # Run migrations
npm run migrate:deploy   # Deploy migrations (production)
npm run studio           # Open Prisma Studio GUI
```

## 📋 Environment Variables

### API (.env)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://akaza:yourboiakaza@localhost:5432/strelitzia
REDIS_URL=redis://localhost:6379
JWT_SECRET=yourboiakaza
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5368709120
ENABLE_RATE_LIMITING=true
TRANSCODER_ENABLED=true
```

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_OFFLINE_MODE=true
```

## 🚨 Troubleshooting

### Node Version Mismatch
```bash
# Install/use correct Node version
nvm install 18.17.0
nvm use 18.17.0
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
# Windows: Services > PostgreSQL
# macOS: brew services list
# Linux: sudo systemctl status postgresql

# Reset database if needed
npm run setup --force
```

### Dependencies Issues
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm run setup
```

### Build Errors
```bash
# Clear Next.js cache and rebuild
rm -rf web/.next api/dist
npm run build
```

---

## 📞 Support & Resources

- **Node.js:** https://nodejs.org (18.17.0+)
- **Next.js Docs:** https://nextjs.org/docs
- **NestJS Docs:** https://docs.nestjs.com
- **Prisma Docs:** https://www.prisma.io/docs
- **PostgreSQL:** https://www.postgresql.org/docs

---

## 📄 License

MIT License

---

**Version:** 0.2.0  
**Last Updated:** January 4, 2026  
**Status:** ✅ Production Ready - Cross-Platform Enabled

