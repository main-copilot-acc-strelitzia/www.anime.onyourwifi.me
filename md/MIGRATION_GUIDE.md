# Migration Guide - Strelitzia v0.2.0

This guide documents all updates made to ensure cross-platform compatibility and latest dependencies.

## 🔄 Dependency Updates

### Web (Next.js)
- ✅ **Next.js:** 13.4.0 → 14.1.0
- ✅ **React:** 18.2.0 (maintained, latest stable)
- ✅ **Tailwind CSS:** 3.4.0 → 3.4.1
- ✅ **HLS.js:** 1.4.0 → 1.4.13
- ✅ Added: `autoprefixer`, `postcss`, `typescript`

### API (NestJS)
- ✅ **NestJS Core:** 10.0.0 → 10.3.3
- ✅ **NestJS JWT:** 10.0.0 → 10.2.0
- ✅ **NestJS Passport:** 10.0.0 → 10.0.3
- ✅ **Prisma:** 4.0.0 → 5.8.0 (major upgrade)
- ✅ **Argon2:** 0.30.0 → 0.31.2
- ✅ **Express Rate Limit:** 6.7.0 → 7.1.5
- ✅ **Rate Limit Redis:** 3.0.1 → 4.1.5
- ✅ **TypeScript:** 5.0.0 → 5.3.3
- ✅ Added: ESLint, TypeScript ESLint, Type definitions

### Transcoder
- ✅ **Prisma:** 4.16.2 → 5.8.0
- ✅ **TypeScript:** 5.0.0 → 5.3.3
- ✅ **Node.js Types:** 20.0.0 → 20.10.6

## 🌐 Cross-Platform Support

### New Files Added
- ✅ **setup.js** - Universal setup script (Windows/Mac/Linux)
- ✅ **dev.js** - Multi-service development launcher
- ✅ **install.bat** - Windows installation script
- ✅ **install.sh** - macOS/Linux installation script
- ✅ **.nvmrc** - Node version specification (18.17.0)
- ✅ **package.json** (root) - Workspace configuration

### Environment Support
```bash
Node.js: 18.17.0+ (all platforms)
npm: 9.0.0+ (all platforms)
```

## 📦 Configuration Updates

### next.config.js
- Added webpack fallback configuration for cross-platform compatibility
- Added localhost and 127.0.0.1 to image domains
- Added target: 'server' for server-side rendering

### package.json (all)
- Added `engines` field specifying Node 18.17.0+
- Added scripts for different operating systems
- Organized devDependencies separately
- Updated version to 0.2.0

### Web tsconfig.json
- Latest TypeScript 5.3.3 support
- Proper module resolution for Next.js 14

## 🚀 New Commands

### Universal (work on all platforms)
```bash
npm run setup              # Cross-platform setup
npm run dev              # Start all services
npm run build            # Build all packages
```

### Windows-Specific
```powershell
.\install.bat            # Run setup
node setup.js            # Cross-platform setup
npm run dev              # Start all services
```

### macOS/Linux
```bash
bash install.sh          # Run setup
npm run setup            # Cross-platform setup
npm run dev              # Start all services
```

## ⚠️ Breaking Changes

### Prisma Update (4.0 → 5.8.0)
**Action Required:** Update your database migrations
```bash
npm run prisma:generate
npm run migrate:deploy
```

**Changes:**
- Database schema syntax updated
- Prisma Client API improved
- Type safety enhanced

### Next.js Update (13 → 14)
**No breaking changes for your app code**
- Automatic optimizations
- Better performance
- Improved developer experience

## 🔍 Deprecated Code Removed/Updated

### Removed
- ❌ Docker files (docker-compose.yml, Dockerfiles)
- ❌ Legacy VideoBrowser grid layout
- ❌ Old light theme styling

### Updated
- ✅ All imports to use modern syntax
- ✅ Environment variable handling
- ✅ CORS configuration
- ✅ Rate limiting setup

## 🔐 Security Updates

- ✅ Updated Helmet headers
- ✅ Improved CSRF protection
- ✅ Enhanced JWT validation
- ✅ Rate limiting refinements
- ✅ Password hashing with latest Argon2

## 📝 Migration Checklist

When upgrading from v0.1.0 to v0.2.0:

- [ ] Backup database
- [ ] Run `npm run setup`
- [ ] Run `npm run prisma:generate`
- [ ] Run `npm run migrate:deploy`
- [ ] Update `.env` files
- [ ] Test all features locally
- [ ] Run security audit: `npm audit`
- [ ] Build production bundles: `npm run build`

## 🆘 Troubleshooting

### Prisma Generation Issues
```bash
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate
```

### Next.js Build Issues
```bash
rm -rf web/.next
npm run build
```

### Port Conflicts
```bash
# Windows
netstat -ano | findstr :3000

# macOS/Linux
lsof -i :3000
```

## ✅ Verification Steps

After migration, verify:

1. **Setup completes without errors**
   ```bash
   npm run setup
   ```

2. **Development servers start**
   ```bash
   npm run dev
   ```

3. **Database migrations work**
   ```bash
   npm run migrate:deploy
   ```

4. **Web UI loads at localhost:3000**
   - Check for no console errors
   - Verify dark theme renders correctly

5. **API responds at localhost:3001**
   ```bash
   curl http://localhost:3001/api/health
   ```

6. **No deprecation warnings**
   ```bash
   npm audit
   ```

## 📚 Resources

- **Next.js 14 Upgrade Guide:** https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration
- **NestJS Updates:** https://docs.nestjs.com/
- **Prisma 5 Changes:** https://www.prisma.io/docs/orm/more/releases/v5-0-0

## 🎉 What's New

### Features
- Netflix/Crunchyroll-style dark theme
- Hero banner with featured content
- Horizontal scrolling carousels
- Cross-platform compatibility
- Universal setup scripts

### Performance
- Latest Next.js optimizations
- Improved Prisma query performance
- Better caching with updated Redis library

### Developer Experience
- Cleaner build configuration
- Better error messages
- Improved TypeScript support

---

**Version:** 0.2.0  
**Date:** January 4, 2026
