# Video Sources System - Deployment Checklist

## ✅ Pre-Deployment Verification

### Code Review
- [x] Backend service code reviewed
- [x] REST API endpoints reviewed  
- [x] Frontend component code reviewed
- [x] Setup page code reviewed
- [x] CSS styling reviewed
- [x] Database schema reviewed
- [x] Module registration reviewed
- [x] TypeScript types verified
- [x] Error handling implemented
- [x] Security guards implemented

### Documentation
- [x] Implementation guide written
- [x] Quick start guide written
- [x] Setup instructions written
- [x] API documentation written
- [x] Troubleshooting guide written
- [x] Architecture documentation written
- [x] Integration examples provided
- [x] Documentation index created

### Testing (TODO - Before Deployment)
- [ ] Database migration runs successfully
- [ ] VideoSource table created
- [ ] Service methods work correctly
- [ ] All 9 API endpoints respond
- [ ] Admin component loads
- [ ] Setup page displays
- [ ] CSS styling renders correctly
- [ ] Admin-only access enforced
- [ ] Videos discovered from sources
- [ ] Multiple sources aggregation works

---

## 🚀 Deployment Steps

### Step 1: Pre-Deployment Checklist
```bash
# Verify Node.js version
node --version  # Should be 18.17.0+

# Verify npm version
npm --version   # Should be 9.0.0+

# Check git status
git status

# Run linter
npm run lint

# Run type check
npm run type-check
```

### Step 2: Database Backup (Production)
```bash
# Backup production database BEFORE migration
pg_dump "postgresql://user:pass@host:5432/db" > backup.sql

# Store backup safely
mv backup.sql /secure/backup/location/
```

### Step 3: Configure Environment
```bash
# Set DATABASE_URL in api/.env
DATABASE_URL="postgresql://user:pass@host:5432/database"

# Verify DATABASE_URL is set
grep DATABASE_URL api/.env
```

### Step 4: Run Database Migration
```bash
# From project root
cd api

# Run migration
npm run migrate -- --name add_video_sources

# Verify migration
npx prisma migrate status

# Expected output: "Database is up to date"
```

### Step 5: Verify Migration Success
```bash
# Check VideoSource table exists
npx prisma studio

# In UI: Look for VideoSource model

# Or use psql:
psql -U postgres -d database -c "SELECT * FROM "VideoSource";"

# Should return empty table (no error)
```

### Step 6: Build Application
```bash
# From project root
npm run build

# Check for build errors
echo $?  # Should be 0
```

### Step 7: Update Frontend Integration
```typescript
# In web/components/admin/index.tsx or admin page:
import VideoSourcesAdmin from '@/components/admin/VideoSourcesAdmin';

// Add to admin page JSX:
<VideoSourcesAdmin />
```

### Step 8: Deploy Code
```bash
# Option 1: Docker
docker-compose up -d

# Option 2: Direct
npm start

# Option 3: PM2
pm2 start npm --name "api" -- start
pm2 start npm --name "web" -- start
```

### Step 9: Verify Deployment
```bash
# Check API is running
curl http://localhost:3001/api/admin/video-sources/status/check

# Expected response:
# {"success":true,"configured":false,"sourceCount":0,...}

# Check web frontend loads
curl http://localhost:3000/setup

# Should contain setup page HTML
```

### Step 10: Add First Video Source
```bash
# Via Admin UI:
1. Open http://localhost:3000/admin
2. Navigate to "Video Sources"
3. Enter source name: "Main Videos"
4. Enter path: "/videos" (or your actual path)
5. Click "Test Directory"
6. Click "Add Source"

# Via API:
curl -X POST http://localhost:3001/api/admin/video-sources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "name":"Main Videos",
    "path":"/videos",
    "type":"local",
    "priority":0
  }'
```

### Step 11: Verify Videos Appear
```bash
# Check videos are discovered
curl http://localhost:3001/api/admin/video-sources

# Should show source with videos

# Check setup page redirects
curl http://localhost:3000/setup

# Should redirect or show configured message
```

### Step 12: Monitor Logs
```bash
# Docker logs
docker logs strelitzia-api -f
docker logs strelitzia-web -f

# System logs
journalctl -u strelitzia-api -f
journalctl -u strelitzia-web -f

# Watch for errors
```

---

## 📋 Pre-Deployment Checklist

### Development Environment
- [ ] All dependencies installed: `npm install`
- [ ] Environment variables configured: `api/.env`
- [ ] Node.js version >= 18.17.0
- [ ] npm version >= 9.0.0
- [ ] PostgreSQL accessible and running
- [ ] Redis running (if using)

### Code Quality
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No linting errors: `npm run lint`
- [ ] Tests passing (if applicable)
- [ ] No security vulnerabilities: `npm audit`
- [ ] All console errors fixed
- [ ] No hardcoded secrets/passwords

### Git Repository
- [ ] All changes committed
- [ ] Branch up to date with main
- [ ] No uncommitted changes
- [ ] Tags updated if needed
- [ ] Release notes prepared

### Documentation
- [ ] README.md updated with new feature
- [ ] API documentation updated
- [ ] Setup guides written
- [ ] Troubleshooting guide written
- [ ] Integration examples provided
- [ ] Architecture documented

### Testing (Development)
- [ ] Setup page loads
- [ ] Admin panel accessible
- [ ] Can add video source
- [ ] Directory test works
- [ ] Videos appear after adding source
- [ ] Can enable/disable sources
- [ ] Can delete sources
- [ ] Can reorder sources
- [ ] All 9 API endpoints work
- [ ] Proper error handling

### Security
- [ ] JWT_SECRET secure and unique
- [ ] Database password strong
- [ ] Admin access restricted
- [ ] API endpoints protected
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] HTTPS enabled (production)

### Database
- [ ] Database backed up (production)
- [ ] Migration tested locally
- [ ] Schema validated
- [ ] Indexes created
- [ ] Foreign keys set up correctly
- [ ] Cascade rules appropriate
- [ ] Unique constraints in place

---

## 🎯 Deployment Configuration

### Environment Variables Required
```
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=production
PORT=3001
WEB_URL=http://localhost:3000
API_URL=http://localhost:3001
CORS_ORIGIN=http://localhost:3000
```

### Database Configuration
```
PostgreSQL 14+
Username: postgres
Password: strong-password
Database: animestream
Host: localhost or remote
Port: 5432
```

### Application Configuration
```
Node.js: 18.17.0+
npm: 9.0.0+
Memory: 512MB+ recommended
Storage: 10GB+ recommended
```

---

## 🔍 Post-Deployment Verification

### Immediate Checks
```bash
# 1. API health check
curl http://your-api:3001/health

# 2. Video sources status
curl http://your-api:3001/api/admin/video-sources/status/check

# 3. Web frontend loads
curl http://your-web:3000/

# 4. Setup page accessible
curl http://your-web:3000/setup
```

### Functional Tests
```bash
# 1. Add video source
curl -X POST http://your-api:3001/api/admin/video-sources \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Test","path":"/videos","type":"local","priority":0}'

# 2. List sources
curl http://your-api:3001/api/admin/video-sources

# 3. Test directory
curl -X POST http://your-api:3001/api/admin/video-sources/test-directory \
  -d '{"path":"/videos"}'

# 4. Get config status
curl http://your-api:3001/api/admin/video-sources/status/check
```

### Performance Checks
```bash
# Check response times
time curl http://your-api:3001/api/admin/video-sources

# Monitor CPU/Memory
top
free -h
df -h

# Check logs for errors
tail -f /var/log/strelitzia-api.log
```

### Security Verification
```bash
# Verify admin-only access
curl -H "Authorization: Bearer INVALID_TOKEN" \
  http://your-api:3001/api/admin/video-sources

# Should return 401 Unauthorized

# Verify HTTPS (if applicable)
curl -v https://your-domain

# Should use HTTPS
```

---

## ⚠️ Rollback Plan

If something goes wrong after deployment:

### Step 1: Stop Services
```bash
# Docker
docker-compose down

# Systemd
sudo systemctl stop strelitzia-api
sudo systemctl stop strelitzia-web

# PM2
pm2 stop all
```

### Step 2: Restore Database Backup
```bash
# Only if migration failed
pg_restore -d database backup.sql

# Or reset migration
cd api
npx prisma migrate resolve --rolled-back add_video_sources
```

### Step 3: Revert Code Changes
```bash
git revert HEAD~1

# Or checkout previous version
git checkout v0.2.0
```

### Step 4: Rebuild & Restart
```bash
npm run build
npm start
```

### Step 5: Verify System
```bash
curl http://localhost:3001/health
curl http://localhost:3000/
```

---

## 📞 Deployment Support

### If Migration Fails
1. Check DATABASE_URL is correct
2. Verify PostgreSQL is running
3. Check database credentials
4. Review migration logs
5. See SETUP_VIDEO_SOURCES.md#troubleshooting

### If Setup Page Doesn't Load
1. Check web frontend is running
2. Verify build completed
3. Check browser console for errors
4. Review web server logs
5. Verify NODE_ENV is set

### If API Endpoints Fail
1. Check API server is running
2. Verify database migration succeeded
3. Check JWT_SECRET in .env
4. Review API logs
5. Test with curl directly

### If Videos Don't Appear
1. Verify source was added correctly
2. Test directory accessibility
3. Check video file formats
4. Verify proper file permissions
5. Check API logs for errors

---

## 📊 Success Metrics

Deployment is successful when:

✅ Database migration completed
✅ VideoSource table exists
✅ All 9 API endpoints respond
✅ Setup page loads and auto-redirects
✅ Admin can add video sources
✅ Videos appear from sources
✅ Admin-only access works
✅ No errors in logs
✅ CSS styling displays correctly
✅ Mobile responsive design works

---

## 🎓 Key Commands Reference

```bash
# Development
npm run dev                        # Start all services
npm run build                     # Build all packages
npm run lint                      # Lint code

# Database
npm run migrate                   # Run migrations (api folder)
npx prisma studio               # View database UI
npx prisma migrate status        # Check migration status

# Production
npm start                        # Start production build
pm2 start npm -- start           # Start with PM2
docker-compose up -d             # Start with Docker

# Testing
npm run test                     # Run tests
npm audit                        # Check security
npm run type-check               # TypeScript check
```

---

## 📋 Files to Deploy

### Backend
- `api/src/modules/admin/video-sources.service.ts`
- `api/src/modules/admin/video-sources.controller.ts`
- `api/src/modules/admin/video-sources.module.ts`
- `api/src/modules/admin/admin.module.ts` (updated)

### Frontend
- `web/pages/setup.tsx`
- `web/components/admin/VideoSourcesAdmin.tsx`
- `web/styles/video-setup.module.css`
- `web/styles/admin/video-sources.module.css`

### Database
- `prisma/schema.prisma` (updated)
- `prisma/migrations/add_video_sources_*` (auto-created)

### Documentation
- `md/VIDEO_SOURCES_SUMMARY.md`
- `md/SETUP_VIDEO_SOURCES.md`
- `md/VIDEO_SOURCES_QUICK_START.md`
- `md/VIDEO_SOURCES_IMPLEMENTATION.md`
- `md/VIDEO_SOURCES_DOCS_INDEX.md`

---

## 🎯 Next Steps After Deployment

1. **Monitor System**
   - Watch logs for 24 hours
   - Monitor performance metrics
   - Check error rates

2. **Gather Feedback**
   - Test with real users
   - Collect issues/improvements
   - Note performance data

3. **Optimize**
   - Tune database queries if needed
   - Cache video lists if needed
   - Optimize CSS loading

4. **Secure**
   - Enable rate limiting fully
   - Set up intrusion detection
   - Enable audit logging

5. **Scale**
   - Add more sources as needed
   - Optimize for large datasets
   - Plan for growth

---

**Deployment Status**: Ready to deploy ✅

**Next Action**: Run database migration and test

**Questions**: See SETUP_VIDEO_SOURCES.md or VIDEO_SOURCES_IMPLEMENTATION.md
