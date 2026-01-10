# System Architecture - Updated Implementation

## Database Schema (Updated)

```
┌─────────────────────────────────────────────────────────────┐
│                          USER                               │
├─────────────────────────────────────────────────────────────┤
│ id                    String        @primary                │
│ username              String                                │
│ email                 String                                │
│ role                  String        (admin|main_admin|...)  │
│ currentTheme          String        @default("default")     │ ✨ NEW
│ lastActivityAt        DateTime?     @index                  │ ✨ NEW
│ moderatedPosts        CommunityPost[]  @relation("mods")    │ ✨ NEW
│ ...                   (other fields)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    COMMUNITY_POST                           │
├─────────────────────────────────────────────────────────────┤
│ id                    String        @primary                │
│ title                 String                                │
│ content               String                                │
│ authorId              String                                │
│ author                User          @relation               │
│ mainModeratorId       String?       @index                  │ ✨ NEW
│ mainModerator         User?         @relation("main_mod")   │ ✨ NEW
│ moderators            User[]        @relation("moderators") │ ✨ NEW
│ replyCount            Int           @default(0)            │ ✨ NEW
│ lastActivityAt        DateTime?     @index                  │ ✨ NEW
│ ...                   (other fields)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              COMMUNITY_POST_MODERATORS        ✨ NEW TABLE   │
├─────────────────────────────────────────────────────────────┤
│ postId                String        @foreign_key            │
│ userId                String        @foreign_key            │
│ assignedAt            DateTime      @default(now())         │
│ PRIMARY KEY           (postId, userId)                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AUDIT_LOG (Updated)                      │
├─────────────────────────────────────────────────────────────┤
│ id                    String        @primary                │
│ actorId               String        @foreign_key            │
│ actor                 User          @relation("actor")      │
│ targetId              String?       @foreign_key            │
│ target                User?         @relation("target")     │
│ action                String        (promote|demote|...)    │
│ detailsJson           Json                                  │
│ createdAt             DateTime      @default(now())         │
└─────────────────────────────────────────────────────────────┘
```

---

## API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API CLIENT (Frontend)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼──────┐ ┌────▼─────┐ ┌───▼──────┐
         │   ADMIN     │ │ COMMUNITY │ │  USER    │
         │ CONTROLLER  │ │CONTROLLER │ │CONTROLLER│
         └──────┬──────┘ └────┬─────┘ └───┬──────┘
                │             │            │
    ┌───────────┼─────────────┼────────────┤
    │           │             │            │
    ▼           ▼             ▼            ▼
┌───────────────────────────────────────────────────────────┐
│                    SERVICES LAYER                         │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────┐  ┌──────────────────────────┐   │
│  │ MainAdminService    │  │ ActiveUsersService       │   │
│  ├─────────────────────┤  ├──────────────────────────┤   │
│  │ • getMainAdmin()    │  │ • updateUserActivity()   │   │
│  │ • isMainAdmin()     │  │ • getActiveUsers()       │   │
│  │ • verifyApproval()  │  │ • searchActiveUsers()    │   │
│  │ • logAdminAction()  │  │ • getUserStats()         │   │
│  │ • getAuditLog()     │  │ • getUserByIP()          │   │
│  └─────────────────────┘  └──────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │ CommunityServiceV2                              │    │
│  ├──────────────────────────────────────────────────┤    │
│  │ • createPost() - assigns 2 moderators           │    │
│  │ • createReply() - increments replyCount         │    │
│  │ • updateModeratorIfNeeded() - auto-promotion    │    │
│  │ • getPostModerators()                           │    │
│  │ • deletePost() / deleteReply()                  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                           │
└───────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
                    ▼                    ▼
         ┌───────────────────┐  ┌──────────────────┐
         │  PRISMA CLIENT    │  │  MIDDLEWARE      │
         │                   │  ├──────────────────┤
         │  • User CRUD      │  │ActivityTracking  │
         │  • CommunityPost  │  │Updates lastActivity
         │  • Audit logging  │  │on every request  │
         └────────┬──────────┘  └──────────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │  POSTGRESQL DB   │
         └──────────────────┘
```

---

## Request Flow: Active User Display

```
1. Admin Dashboard Opens
   ↓
2. fetch('/admin/active-users')
   ↓
3. AdminController.getActiveUsers()
   ↓
4. MainAdminGuard checks if admin
   ↓
5. ActiveUsersService.getActiveUsers(minutesWindow)
   ↓
6. Query: SELECT * FROM User 
          WHERE lastActivityAt >= (now - 30 mins)
          ORDER BY lastActivityAt DESC
   ↓
7. Response: [
     { username, email, ipAddress, role, lastActivityAt, ... },
     { username, email, ipAddress, role, lastActivityAt, ... },
     ...
   ]
   ↓
8. Admin sees list of online users with IPs
   ↓
9. Click "Add to Whitelist" → POST /admin/add-whitelist
```

---

## Request Flow: Creating Community Post

```
1. User Creates Post
   ↓
2. POST /community/post { title, content }
   ↓
3. CommunityController.createPost()
   ↓
4. ActivityTrackingMiddleware updates User.lastActivityAt
   ↓
5. CommunityServiceV2.createPost()
   ├─ Creates post with author as authorId
   ├─ Sets mainModerator = author
   └─ Adds 2 moderators: [main_admin, author]
   ↓
6. INSERT INTO CommunityPost (...)
   INSERT INTO CommunityPostModerators (postId, main_admin_id)
   INSERT INTO CommunityPostModerators (postId, author_id)
   ↓
7. Response: { id, title, mainModerator, moderators: [...] }
```

---

## Request Flow: Auto-Promotion of Moderators

```
Timeline of Events:

T1: Post created with moderators = [main_admin, user_a]
    ↓
T2: user_a replies (replyCount = 1, lastActivityAt = now)
    ↓
T3: main_admin replies (replyCount = 2, lastActivityAt = now)
    ↓
T4: main_admin becomes inactive (no activity for 30 mins)
    ↓
T5: user_b replies to the post
    ├─ replyCount = 3
    ├─ CommunityServiceV2.updateModeratorIfNeeded()
    │  ├─ Check if mainModerator (main_admin) is active
    │  ├─ mainModerator.lastActivityAt < 30 mins ago → INACTIVE
    │  ├─ Find most active replier:
    │  │  ├─ user_a: 1 reply
    │  │  ├─ main_admin: 1 reply (but inactive)
    │  │  ├─ user_b: 1 reply (just replied)
    │  │  └─ Most active = user_a or user_b
    │  ├─ Promote most active replier
    │  └─ UPDATE CommunityPost SET mainModeratorId = user_a
    ├─ New moderators = [main_admin (still in list), user_a (main now)]
    └─ Response: post with updated moderators
```

---

## Theme System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   THEME MANAGEMENT                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (React Components)                           │
│  ├─ Theme Selector Component                          │
│  ├─ Theme Provider (Context)                          │
│  └─ Styled Components using theme.colors              │
│         │                                               │
│         ▼                                               │
│  ┌──────────────────────────────────────────┐          │
│  │  web/data/themes.ts                      │          │
│  ├──────────────────────────────────────────┤          │
│  │  export THEMES = {                       │          │
│  │    'default': {...colors, wallpaper...}  │          │
│  │    'leblanc': {...},                     │          │
│  │    'jinx': {...},                        │          │
│  │    'naruto': {...},                      │          │
│  │    'luffy': {...},                       │          │
│  │    ... 40+ more themes                   │          │
│  │  }                                       │          │
│  │                                          │          │
│  │  export getTheme(id)                     │          │
│  │  export searchThemes(query)              │          │
│  │  export getThemesByTag(tag)              │          │
│  │  export getAllThemes()                   │          │
│  └──────────────────────────────────────────┘          │
│         │                                               │
│         ▼                                               │
│  ┌──────────────────────────────────────────┐          │
│  │  web/data/themes_extended.ts             │          │
│  ├──────────────────────────────────────────┤          │
│  │  export EXTENDED_THEMES = {              │          │
│  │    'eren-yeager': {...},                 │          │
│  │    'tanjiro-kny': {...},                 │          │
│  │    'yuji-jjk': {...},                    │          │
│  │    ... 40+ more anime themes             │          │
│  │  }                                       │          │
│  │                                          │          │
│  │  export THEMES_MERGED = merge both       │          │
│  │  export getThemeExtended(id)             │          │
│  │  export getAllThemesExtended()           │          │
│  └──────────────────────────────────────────┘          │
│         │                                               │
│         ▼                                               │
│  Backend API                                           │
│  ├─ POST /user/theme { themeId }                      │
│  │  └─ UPDATE User SET currentTheme = ?               │
│  │                                                    │
│  └─ GET /user/theme                                  │
│     └─ SELECT currentTheme FROM User                 │
│                                                       │
└─────────────────────────────────────────────────────────┘

Total Themes Available: 60+ (expandable to 250+)
```

---

## Admin Authorization Flow

```
Request: POST /admin/promote

  ├─ RolesGuard: Check if user is 'admin' or 'main_admin'
  │  └─ If not → 403 Forbidden
  │
  ├─ MainAdminGuard: Check if user IS main_admin
  │  └─ Get main_admin from DB (first user created)
  │  └─ If user.id !== main_admin.id → 403 Forbidden
  │
  ├─ MainAdminService.verifyMainAdminApproval()
  │  ├─ Check if promoting to main_admin role
  │  ├─ Prevent demoting main_admin
  │  └─ Allow other promotions
  │
  ├─ Execute: UPDATE User SET role = ? WHERE id = ?
  │
  ├─ Audit Log: INSERT INTO AuditLog (actor, target, action, details)
  │
  └─ Response: { success: true, user: {...updated user...} }
```

---

## Middleware Pipeline

```
Request
  │
  ├─ (Existing middleware)
  │
  ├─ ActivityTrackingMiddleware ✨ NEW
  │  ├─ Check if req.user?.id exists
  │  ├─ If authenticated: UPDATE User SET lastActivityAt = now()
  │  └─ Continue (async, non-blocking)
  │
  ├─ JWT Auth Middleware
  │
  ├─ CORS Middleware
  │
  ├─ (Controller routing)
  │
  └─ Response
```

---

## Data Flow: Admin Dashboard

```
Admin User              Admin Dashboard         Backend Services
     │                      │                         │
     │─ Opens /admin ──────>│                         │
     │                      │─ GET /admin/active-users ──>│
     │                      │                         │
     │                      │                    MainAdminGuard ✅
     │                      │                    ActiveUsersService.getActiveUsers()
     │                      │                    Query: SELECT * FROM User
     │                      │                         │  WHERE lastActivityAt > 30 mins ago
     │                      │<─ [ {...user1}, {...user2} ] ─│
     │<─ Display users ─────│
     │
     │ Sees: | Username | Email | IP | Role | Activity |
     │
     │─ Click: "Add IP" ──>│
     │                      │─ POST /admin/add-whitelist ──>│
     │                      │                    Add IP to whitelist
     │<─ "IP Added" ────────│
```

---

## Complete Feature Interaction

```
         ┌──────────────────────────────────────────────┐
         │    INTEGRATED SYSTEM - ALL FEATURES WORK      │
         │           TOGETHER SEAMLESSLY                 │
         └──────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
    ┌─────────┐        ┌──────────┐      ┌──────────────┐
    │ THEMES  │        │ ACTIVITY │      │  COMMUNITY   │
    │         │        │ TRACKING │      │  MODERATORS  │
    ├─────────┤        ├──────────┤      ├──────────────┤
    │ 60+     │        │ Updates  │      │ 2 per post   │
    │ themes  │        │ on every │      │ Auto-rotates │
    │ for UI  │        │ request  │      │ when needed  │
    └────┬────┘        └────┬─────┘      └──────┬───────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                   ┌────────▼──────────┐
                   │   MAIN ADMIN      │
                   │   AUTHORITY       │
                   ├───────────────────┤
                   │ All admin actions │
                   │ require main      │
                   │ admin approval    │
                   └───────────────────┘
```

This completes the entire system architecture. All features are fully integrated and working together.
