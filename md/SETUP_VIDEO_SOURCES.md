# Complete Setup Instructions - Video Sources System

## Overview

The video sources configuration system is **fully implemented and ready to use**. This document provides step-by-step instructions to complete the final setup.

---

## Prerequisites

Before proceeding, ensure you have:
- PostgreSQL database running and accessible
- Node.js and npm installed
- Access to the project directory
- Main admin account created in the system

---

## Step 1: Configure Database Connection (If Not Already Done)

### Check if .env file exists
```bash
cd api
ls -la | grep .env
```

If no `.env` file exists, create one from the example:

### Linux/Mac
```bash
cd api
cp .env.example .env
nano .env  # Edit the file
```

### Windows (PowerShell)
```powershell
cd api
Copy-Item .env.example -Destination .env
# Edit .env with your editor
```

### Configure DATABASE_URL
Edit `api/.env` and update the database connection:

```dotenv
# Example for local PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/animestream"

# Example for remote PostgreSQL
DATABASE_URL="postgresql://user:password@db.example.com:5432/animestream"

# Example for Docker PostgreSQL
DATABASE_URL="postgresql://postgres:password@postgres:5432/animestream"
```

**Common Database Configurations:**

#### Local PostgreSQL (Debian/Linux)
```
postgresql://postgres:YOUR_PASSWORD@localhost:5432/animestream
```

#### PostgreSQL on Different Port
```
postgresql://user:password@localhost:5433/animestream
```

#### Docker Compose Setup
```
postgresql://postgres:password@db:5432/animestream
```

#### Remote Database
```
postgresql://user:password@db.example.com:5432/animestream
```

---

## Step 2: Install Dependencies (If Not Already Done)

```bash
# From project root
npm install

# Or if using npm workspaces
cd api
npm install
```

---

## Step 3: Generate Prisma Client

```bash
cd api
npm run prisma:generate
```

Expected output:
```
✔ Generated Prisma Client
```

---

## Step 4: Run Database Migration

This creates the `VideoSource` table in your database.

```bash
cd api
npm run migrate -- --name add_video_sources
```

**What this does:**
1. Checks for any previous migrations
2. Creates migration file: `prisma/migrations/add_video_sources_*`
3. Applies migration to your database
4. Updates Prisma schema hash

### If You Get "Already Migrated" Error

If the migration already exists, you can reset and re-run:

```bash
# WARNING: This deletes all data!
cd api
npx prisma migrate reset --force
```

Only use `reset` in development. For production, use:

```bash
npx prisma migrate deploy
```

---

## Step 5: Verify Database Migration

### Check migration was applied
```bash
# List all migrations
npx prisma migrate status
```

Expected output:
```
Status
3 migrations found in prisma/migrations

Database is up to date.
```

### Verify VideoSource table exists
```bash
# Option 1: Using Prisma Studio
npm run prisma:studio

# Option 2: Using psql (if PostgreSQL is local)
psql -U postgres -d animestream -c "SELECT * FROM public."VideoSource";"
```

---

## Step 6: Update Your Frontend Integration

### Import VideoSourcesAdmin Component
In your admin page/dashboard:

```typescript
// pages/admin/index.tsx or pages/admin.tsx
import VideoSourcesAdmin from '@/components/admin/VideoSourcesAdmin';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Existing admin components */}
      
      {/* Add this section */}
      <section>
        <h2>Video Sources Configuration</h2>
        <VideoSourcesAdmin />
      </section>
    </div>
  );
}
```

### Add Route Protection (Optional)
In your main layout or app component:

```typescript
// app.tsx, layout.tsx, or middleware
import { useEffect } from 'react';
import { useRouter } from 'next/router';

async function checkVideoSourcesConfiguration() {
  try {
    const response = await fetch('/api/admin/video-sources/status/check');
    const data = await response.json();
    
    if (!data.configured) {
      // Redirect to setup if no sources configured
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// In your component:
useEffect(() => {
  const checkSetup = async () => {
    const isConfigured = await checkVideoSourcesConfiguration();
    if (!isConfigured && location.pathname !== '/setup') {
      router.push('/setup');
    }
  };
  
  checkSetup();
}, []);
```

---

## Step 7: Start Your Services

### Option 1: Development Mode

```bash
# Terminal 1: Start API
cd api
npm run start:dev

# Terminal 2: Start Web Frontend
cd web
npm run dev

# Terminal 3: Start Transcoder (if applicable)
cd transcoder
npm run dev
```

### Option 2: Production Mode

```bash
# Build
npm run build

# Start
npm start
```

### Option 3: Using Docker

```bash
docker-compose up -d
```

---

## Step 8: Verify Installation

### Check API is Running
```bash
curl http://localhost:3001/api/admin/video-sources/status/check
```

Expected response (if no sources configured yet):
```json
{
  "success": true,
  "configured": false,
  "sourceCount": 0,
  "activeSourceCount": 0,
  "message": "No video sources configured. Please add a video source directory."
}
```

### Check Frontend is Running
```
Open browser: http://localhost:3000/setup
```

You should see the setup guide page.

---

## Step 9: Configure Your First Video Source

### Via Web UI (Recommended)

1. **Go to Setup Page**
   - Open: `http://localhost:3000/setup`
   - Click "Go to Admin Panel" button

2. **Login as Main Admin**
   - Use your main admin credentials

3. **Add Video Source**
   - Enter Source Name: "Main Videos"
   - Enter Directory Path: `/home/videos` (or your actual path)
   - Select Type: "Local Drive"
   - Set Priority: 0
   - Click "Test Directory"
   - Click "Add Source"

### Via API (curl)

```bash
# Test directory first
curl -X POST http://localhost:3001/api/admin/video-sources/test-directory \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "path": "/home/videos"
  }'

# Add source
curl -X POST http://localhost:3001/api/admin/video-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Main Videos",
    "path": "/home/videos",
    "type": "local",
    "priority": 0
  }'
```

---

## Step 10: Verify Configuration

### Check Status
```bash
curl http://localhost:3001/api/admin/video-sources/status/check
```

Expected response (if configured):
```json
{
  "success": true,
  "configured": true,
  "sourceCount": 1,
  "activeSourceCount": 1,
  "message": "1 video source(s) configured"
}
```

### View All Sources
```bash
curl http://localhost:3001/api/admin/video-sources
```

---

## Step 11: Test Video Discovery

### Verify videos are discovered
```typescript
// In your video service
const videos = await this.videoSourcesService.getVideosFromAllSources();
console.log(`Found ${videos.length} videos`);
```

Expected output:
```
Found 42 videos  // Or however many videos are in your directory
```

---

## Troubleshooting

### Migration Failed: "DATABASE_URL not found"
**Solution**: 
```bash
# Verify .env file exists and has DATABASE_URL
cat api/.env | grep DATABASE_URL

# If not set, add it:
echo 'DATABASE_URL="postgresql://postgres:password@localhost:5432/animestream"' >> api/.env
```

### Migration Failed: "Connection refused"
**Solution**: 
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# If not running (Debian):
sudo systemctl start postgresql

# If not running (Mac):
brew services start postgresql@15
```

### "VideoSource table not found"
**Solution**:
```bash
# Re-run migration
cd api
npx prisma migrate deploy

# Or reset (development only):
npx prisma migrate reset --force
```

### "Can't connect to database"
**Solution**:
1. Verify DATABASE_URL is correct
2. Check database username/password
3. Verify database server is running
4. Check firewall allows connection

### API Responding 401 to Admin Endpoints
**Solution**:
- Ensure you're using a valid JWT token
- Check user has "main_admin" role
- Verify JWT_SECRET matches in .env

### Videos not showing up
**Solution**:
1. Check source is enabled: `curl http://localhost:3001/api/admin/video-sources`
2. Test directory accessibility: Admin UI → "Test Directory"
3. Verify files are in supported formats (MP4, MKV, AVI, etc.)
4. Check file permissions on the directory

---

## Next Steps

### After Everything is Working

1. **Add More Sources** (Optional)
   - Add external SSDs
   - Add network drives
   - Set up multiple locations

2. **Configure Priority**
   - Adjust source order
   - Higher priority sources are scanned first
   - Useful if files exist in multiple locations

3. **Monitor Performance**
   - Check how long it takes to scan sources
   - Disable unused sources
   - Optimize directory structure

4. **Deploy to Production**
   - Update DATABASE_URL for production database
   - Run migrations: `npx prisma migrate deploy`
   - Deploy code changes
   - Monitor logs for errors

---

## Important Notes

### Database Backup
Before running migrations in production, **always backup your database**:

```bash
# PostgreSQL backup
pg_dump "postgresql://user:password@host:5432/animestream" > backup.sql

# Restore if needed
psql "postgresql://user:password@host:5432/animestream" < backup.sql
```

### Security Considerations
- Only main admin can manage video sources
- API endpoints are protected by MainAdminGuard
- Paths are validated before adding
- Deleted sources cascade to related records

### Performance Tips
- Use local SSDs for main content
- Limit to 5-10 sources for best performance
- Monitor disk I/O during video discovery
- Consider caching video lists

### Monitoring
Check logs for errors:
```bash
# API logs
docker logs strelitzia-api

# Web logs  
docker logs strelitzia-web

# System logs
journalctl -u strelitzia-api -f
```

---

## System Architecture

```
Setup Flow:
User visits website
  ↓
Check /api/admin/video-sources/status/check
  ↓
If not configured: Show /setup page
If configured: Show home with videos
  ↓
Admin can visit /admin to manage sources

Video Discovery Flow:
App needs videos
  ↓
Call VideoSourcesService.getVideosFromAllSources()
  ↓
For each active source (in priority order):
  ↓
Scan directory for video files
  ↓
Aggregate all videos
  ↓
Return to frontend
  ↓
Display in browser
```

---

## Files Created/Modified

### Backend
- `api/src/modules/admin/video-sources.service.ts` - Core service (220+ lines)
- `api/src/modules/admin/video-sources.controller.ts` - API endpoints (170+ lines)  
- `api/src/modules/admin/video-sources.module.ts` - NestJS module (30 lines)
- `api/src/modules/admin/admin.module.ts` - Updated with import

### Frontend
- `web/pages/setup.tsx` - Setup page (350+ lines)
- `web/components/admin/VideoSourcesAdmin.tsx` - Admin UI (400+ lines)
- `web/styles/video-setup.module.css` - Setup styling (500+ lines)
- `web/styles/admin/video-sources.module.css` - Admin styling (500+ lines)

### Database
- `prisma/schema.prisma` - Updated with VideoSource model
- `prisma/migrations/add_video_sources_*` - Migration file (auto-generated)

### Documentation
- `md/VIDEO_SOURCES_IMPLEMENTATION.md` - Full implementation guide
- `md/VIDEO_SOURCES_QUICK_START.md` - User quick start guide

---

## Support Commands

```bash
# Check migration status
cd api && npx prisma migrate status

# View database in UI
cd api && npm run prisma:studio

# Reset database (development only)
cd api && npx prisma migrate reset --force

# Generate Prisma client
cd api && npm run prisma:generate

# Test API endpoint
curl http://localhost:3001/api/admin/video-sources/status/check
```

---

**Status**: Ready for migration  
**Next Action**: Run `npm run migrate -- --name add_video_sources`  
**Questions**: See VIDEO_SOURCES_QUICK_START.md or VIDEO_SOURCES_IMPLEMENTATION.md
