# Quick Reference: New Commands & Endpoints

## 🚀 Deployment Commands

### Run Database Migration
```bash
cd api
npx prisma migrate dev --name "add_moderators_and_activity_tracking"
npx prisma generate
npm run build
```

### Start Application
```bash
# Terminal 1: Backend
cd api && npm run start:dev

# Terminal 2: Frontend  
cd web && npm run dev
```

---

## 📊 Admin API Endpoints

### Get Active Users (with IPs)
```bash
# Get users active in last 30 minutes
curl http://localhost:3001/api/admin/active-users?minutesWindow=30

# Response:
{
  "data": [
    {
      "id": "user-123",
      "username": "john_doe",
      "email": "john@example.com",
      "ipAddress": "192.168.1.100",
      "role": "admin",
      "lastActivityAt": "2024-01-15T10:30:00Z"
    },
    ...
  ],
  "count": 5,
  "minutesWindow": 30
}
```

### Search Active Users
```bash
# Search by username or email
curl "http://localhost:3001/api/admin/search-users?query=john&minutesWindow=30"

# Response:
{
  "data": [
    { "id": "...", "username": "john_doe", "email": "john@example.com", ... }
  ],
  "count": 1
}
```

### Get User Statistics
```bash
# Get online/offline counts
curl http://localhost:3001/api/admin/user-stats?minutesWindow=30

# Response:
{
  "total": 150,
  "active": 12,
  "inactive": 138,
  "minutesWindow": 30
}
```

### Promote User
```bash
curl -X POST http://localhost:3001/api/admin/promote \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user-456",
    "newRole": "admin"
  }'

# Response:
{
  "success": true,
  "user": {
    "id": "user-456",
    "username": "jane_doe",
    "role": "admin"
  }
}
```

### Demote User
```bash
curl -X POST http://localhost:3001/api/admin/demote \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": "user-456",
    "newRole": "watcher"
  }'
```

---

## 👥 Community API Endpoints

### Create Post (Auto-assigns 2 Moderators)
```bash
curl -X POST http://localhost:3001/api/community/post \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Discussion",
    "content": "Let me discuss this topic..."
  }'

# Response (auto-moderators assigned):
{
  "id": "post-123",
  "title": "My Discussion",
  "authorId": "user-123",
  "mainModeratorId": "user-123",
  "moderators": [
    { "id": "main-admin-id", "username": "admin", "role": "main_admin" },
    { "id": "user-123", "username": "john", "role": "user" }
  ],
  "replyCount": 0,
  "lastActivityAt": "2024-01-15T10:30:00Z"
}
```

### Add Reply
```bash
curl -X POST http://localhost:3001/api/community/post/post-123/reply \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Great discussion! Here is my reply..."
  }'

# Response:
{
  "id": "reply-456",
  "postId": "post-123",
  "authorId": "user-456",
  "content": "Great discussion! Here is my reply...",
  "createdAt": "2024-01-15T10:31:00Z"
}
```

### Get Post Moderators
```bash
curl http://localhost:3001/api/community/post/post-123/moderators

# Response:
{
  "mainModerator": {
    "id": "user-123",
    "username": "post_creator",
    "isActive": true
  },
  "moderators": [
    { "id": "main-admin-id", "username": "admin" },
    { "id": "user-123", "username": "post_creator" }
  ]
}
```

---

## 🎨 Theme API Endpoints

### Get Current User Theme
```bash
curl http://localhost:3001/api/user/theme \
  -H "Authorization: Bearer {token}"

# Response:
{
  "currentTheme": "naruto"
}
```

### Update User Theme
```bash
curl -X POST http://localhost:3001/api/user/theme \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "themeId": "leblanc"
  }'

# Response:
{
  "id": "user-123",
  "currentTheme": "leblanc"
}
```

---

## 🎭 Frontend Theme Usage

### Import and Use Themes
```typescript
import { THEMES, getTheme, getAllThemes, searchThemes } from '@/data/themes';
import { THEMES_EXTENDED } from '@/data/themes_extended';

// Get all themes
const allThemes = getAllThemes();

// Get specific theme
const narutoTheme = getTheme('naruto');

// Search themes
const animeThemes = searchThemes('naruto');

// Apply theme colors
<div style={{
  backgroundColor: narutoTheme.colors.background,
  color: narutoTheme.colors.text
}}>
  Naruto Theme Content
</div>
```

---

## 🔐 Admin Authentication

### All admin endpoints require:
1. User to have role: `'admin'` or `'main_admin'`
2. User to have IP in whitelist (if IP whitelist enabled)
3. For sensitive operations (promote/demote): User must be `main_admin`

```typescript
// In AdminController, endpoints are protected by:
@UseGuards(RolesGuard, MainAdminGuard)
@Roles('admin', 'main_admin')
```

---

## 📋 Database Queries

### Find Active Users (30 min window)
```sql
SELECT * FROM "User"
WHERE "lastActivityAt" >= NOW() - INTERVAL '30 minutes'
  AND "isActive" = true
ORDER BY "lastActivityAt" DESC;
```

### Find Post Moderators
```sql
SELECT u.* FROM "User" u
JOIN "CommunityPostModerators" cpm ON u.id = cpm."userId"
WHERE cpm."postId" = 'post-123';
```

### Get Audit Log (Admin Actions)
```sql
SELECT * FROM "AuditLog"
WHERE "actorId" = 'admin-123'
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Find Most Active Replier in Post
```sql
SELECT "authorId", COUNT(*) as reply_count
FROM "CommunityReply"
WHERE "postId" = 'post-123'
GROUP BY "authorId"
ORDER BY reply_count DESC
LIMIT 1;
```

---

## 🔍 Debugging Commands

### Check if Middleware is Applied
```bash
# Look for ActivityTrackingMiddleware in console logs
npm run start:dev | grep -i "activity\|middleware"
```

### Verify Database Migration
```bash
cd api
npx prisma migrate status
```

### Check Prisma Schema
```bash
cd api
npx prisma db push --dry-run
```

### View Database Data (Prisma Studio)
```bash
cd api
npx prisma studio
# Opens http://localhost:5555
```

---

## 📊 Available Themes (60+)

### League of Legends (16 themes)
- default, ahri, akali, ambessa, ashe, belveth, briar, drmundo, ekko, elise, evelynn, jinx, leblanc, renata, vayne, vi, zed

### Popular Anime (44 themes)
**Dragon Ball**: goku, vegeta
**Naruto**: naruto, sasuke
**Bleach**: ichigo
**Demon Slayer**: tanjiro
**One Punch Man**: saitama
**My Hero Academia**: deku, bakugo
**Jujutsu Kaisen**: yuji, megumi, nobara, gojo
**Death Note**: light, l
**Code Geass**: lelouch, cc
**Attack on Titan**: eren, mikasa, levi
**Steins;Gate**: okabe, kurisu
**Fullmetal Alchemist**: edward, alphonse
**Sword Art Online**: kirito, asuna
**Tokyo Ghoul**: kaneki, touka
**Mob Psycho 100**: mob, reigen
**Haikyuu**: tobio, hinata
**Bleach**: byakuya, uryu
**Assassination Classroom**: korosensei

---

## 🚦 Status Endpoints

### Health Check
```bash
curl http://localhost:3001/health
```

### API Version
```bash
curl http://localhost:3001/api/version
```

---

## 📝 Example: Complete Admin Workflow

```bash
# 1. Check active users
curl http://localhost:3001/api/admin/active-users

# 2. Search for specific user
curl "http://localhost:3001/api/admin/search-users?query=newuser"

# 3. Promote user to admin
curl -X POST http://localhost:3001/api/admin/promote \
  -H "Content-Type: application/json" \
  -d '{"targetUserId":"user-123","newRole":"admin"}'

# 4. Check audit log
curl http://localhost:3001/api/admin/audit-log

# 5. Get user stats
curl http://localhost:3001/api/admin/user-stats
```

---

## 📱 Example: Complete Theme Workflow

```bash
# 1. User selects theme
curl -X POST http://localhost:3001/api/user/theme \
  -d '{"themeId":"naruto"}'

# 2. Load theme in frontend
import { getTheme } from '@/data/themes';
const theme = getTheme('naruto');

# 3. Apply theme to UI
<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>

# 4. User sees themed interface with naruto colors
```

---

All endpoints require proper authentication (JWT token in Authorization header) except health check.
