# Complete Integration Guide

## Step-by-Step Integration Instructions

### Step 1: Database Migration

```bash
cd api
npx prisma migrate dev --name "add_moderators_and_activity_tracking"
npx prisma generate
```

This will:
- Add `currentTheme` and `lastActivityAt` to User table
- Add `mainModeratorId`, `replyCount`, `lastActivityAt` to CommunityPost table
- Create `CommunityPostModerators` join table for many-to-many relationships
- Generate updated Prisma Client

### Step 2: Update App Module

In `api/src/app.module.ts`:

```typescript
import { MainAdminService } from './modules/admin/main-admin.service';
import { ActiveUsersService } from './modules/admin/active-users.service';
import { CommunityServiceV2 } from './modules/community/community.service.v2';
import { ActivityTrackingMiddleware } from './middleware/activity-tracking.middleware';

@Module({
  imports: [
    // ... existing imports
  ],
  providers: [
    // ... existing providers
    MainAdminService,
    ActiveUsersService,
    CommunityServiceV2,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ActivityTrackingMiddleware)
      .forRoutes('*');
  }
}
```

### Step 3: Update Admin Module

In `api/src/modules/admin/admin.module.ts`:

```typescript
import { MainAdminService } from './main-admin.service';
import { ActiveUsersService } from './active-users.service';

@Module({
  controllers: [AdminController],
  providers: [
    AdminService,
    MainAdminService,
    ActiveUsersService,
  ],
  exports: [MainAdminService, ActiveUsersService],
})
export class AdminModule {}
```

### Step 4: Update Community Module

In `api/src/modules/community/community.module.ts`:

```typescript
import { CommunityServiceV2 } from './community.service.v2';

@Module({
  controllers: [CommunityController],
  providers: [
    CommunityService,
    CommunityServiceV2, // Add V2 service
  ],
  exports: [CommunityServiceV2],
})
export class CommunityModule {}
```

### Step 5: Inject Services in Controllers

**In AdminController:**
```typescript
constructor(
  @Inject('PRISMA') private prisma: PrismaClient,
  private mainAdminService: MainAdminService,
  private activeUsersService: ActiveUsersService,
) {}
```

**In CommunityController:**
```typescript
constructor(
  private communityServiceV2: CommunityServiceV2,
  private prisma: PrismaClient,
) {}
```

### Step 6: Update Admin Controller Methods

Replace community post creation to use V2 service:

```typescript
@Post('community/post')
async createPost(@Body() dto: CreatePostDto, @Req() req: any) {
  const post = await this.communityServiceV2.createPost(
    dto,
    req.user.id
  );
  return post;
}

@Post('community/:postId/reply')
async createReply(
  @Param('postId') postId: string,
  @Body() dto: CreateReplyDto,
  @Req() req: any,
) {
  const reply = await this.communityServiceV2.createReply(
    postId,
    dto,
    req.user.id
  );
  return reply;
}
```

### Step 7: Update Frontend Theme Imports

**Old:**
```typescript
import themes from '@/config/themes';
```

**New:**
```typescript
import { THEMES, getTheme, searchThemes } from '@/data/themes';
// Or for extended themes:
import { THEMES_MERGED, getAllThemesExtended } from '@/data/themes_extended';
```

### Step 8: Update Theme Selector Component

Example in a settings page:

```tsx
import { THEMES, getAllThemes } from '@/data/themes';

export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  const handleThemeChange = async (themeId: string) => {
    setSelectedTheme(themeId);
    // Save to API
    await fetch('/api/user/theme', {
      method: 'POST',
      body: JSON.stringify({ themeId }),
    });
  };

  return (
    <div>
      {getAllThemes().map((theme) => (
        <button
          key={theme.id}
          onClick={() => handleThemeChange(theme.id)}
          style={{ 
            backgroundColor: theme.colors.primary,
            color: theme.colors.text,
          }}
        >
          {theme.label}
        </button>
      ))}
    </div>
  );
}
```

### Step 9: Update Admin Security Page

In `web/pages/admin/security.tsx`:

```tsx
import { useEffect, useState } from 'react';

export function AdminSecurityPage() {
  const [activeUsers, setActiveUsers] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Load active users
    fetch('/api/admin/active-users?minutesWindow=30')
      .then(r => r.json())
      .then(d => setActiveUsers(d.data));

    // Load stats
    fetch('/api/admin/user-stats')
      .then(r => r.json())
      .then(d => setStats(d));
  }, []);

  return (
    <div className="admin-security">
      <h2>User Activity</h2>
      {stats && (
        <div className="stats">
          <p>Total Users: {stats.total}</p>
          <p>Active (30 min): {stats.active}</p>
          <p>Inactive: {stats.inactive}</p>
        </div>
      )}

      <h3>Active Users</h3>
      <table>
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>IP Address</th>
            <th>Role</th>
            <th>Last Activity</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {activeUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.ipAddress}</td>
              <td>{user.role}</td>
              <td>{new Date(user.lastActivityAt).toLocaleString()}</td>
              <td>
                <button onClick={() => addToWhitelist(user.ipAddress)}>
                  Add IP to Whitelist
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Step 10: Create User Theme Endpoint

In `api/src/modules/user/user.controller.ts`:

```typescript
@Post('theme')
@UseGuards(JwtAuthGuard)
async updateTheme(
  @Body() dto: { themeId: string },
  @Req() req: any,
) {
  return this.prisma.user.update({
    where: { id: req.user.id },
    data: { currentTheme: dto.themeId },
  });
}

@Get('theme')
@UseGuards(JwtAuthGuard)
async getTheme(@Req() req: any) {
  const user = await this.prisma.user.findUnique({
    where: { id: req.user.id },
    select: { currentTheme: true },
  });
  return { currentTheme: user?.currentTheme || 'default' };
}
```

### Step 11: Test All Features

```bash
# Terminal 1: Start backend
cd api
npm run start:dev

# Terminal 2: Start frontend
cd ../web
npm run dev

# Terminal 3: Test endpoints
curl http://localhost:3001/api/admin/active-users
curl http://localhost:3001/api/admin/user-stats
curl -X POST http://localhost:3001/api/admin/promote \
  -H "Content-Type: application/json" \
  -d '{"targetUserId":"user123","newRole":"admin"}'
```

### Step 12: Verify Community Moderators

When creating a post, verify:
1. Post is created with author as mainModerator
2. Both author and main_admin are in moderators list
3. When a reply is added, replyCount increments
4. If main_admin becomes inactive, most active replier is promoted

---

## API Reference

### Admin Endpoints

```
GET  /admin/active-users?minutesWindow=30
     Returns: { data: [], count: N, minutesWindow: 30 }

GET  /admin/search-users?query=john&minutesWindow=30
     Returns: { data: [], count: N }

GET  /admin/user-stats?minutesWindow=30
     Returns: { total: N, active: N, inactive: N, minutesWindow: 30 }

POST /admin/promote
     Body: { targetUserId: "...", newRole: "admin|main_admin|watcher" }
     Returns: { success: true, user: {...} }

POST /admin/demote
     Body: { targetUserId: "...", newRole: "watcher|admin" }
     Returns: { success: true, user: {...} }
```

### User Endpoints

```
GET  /api/user/theme
     Returns: { currentTheme: "theme-id" }

POST /api/user/theme
     Body: { themeId: "..." }
     Returns: { id: "...", currentTheme: "..." }
```

### Community Endpoints

```
POST /api/community/post
     Body: { title: "...", content: "..." }
     Returns: { id: "...", mainModeratorId: "...", moderators: [...] }

POST /api/community/:postId/reply
     Body: { content: "..." }
     Returns: { id: "...", postId: "...", replyCount: N }

GET  /api/community/:postId/moderators
     Returns: { moderators: [...], mainModerator: {...} }
```

---

## Verification Checklist

- [ ] Prisma migration runs without errors
- [ ] New fields appear in database: User.currentTheme, User.lastActivityAt
- [ ] New table created: CommunityPostModerators
- [ ] Admin endpoints return active users list
- [ ] Creating post assigns 2 moderators (main_admin + creator)
- [ ] Activity middleware updates lastActivityAt on requests
- [ ] MainAdminGuard prevents non-main-admin from sensitive actions
- [ ] Community moderator auto-rotation works
- [ ] Theme selector works in frontend
- [ ] Admin security page displays active users and IPs

---

## Troubleshooting

**Issue**: Prisma migration fails
**Solution**: Check DATABASE_URL in .env is correct, run `npx prisma db push`

**Issue**: Services not injected
**Solution**: Ensure services are registered in module providers

**Issue**: Active users endpoint returns empty
**Solution**: Verify middleware is applied, check lastActivityAt field populated

**Issue**: Theme selector shows no themes
**Solution**: Verify import path, check THEMES object is exported from themes.ts

**Issue**: Moderators not assigned to posts
**Solution**: Verify CommunityServiceV2 is used, check mainModerator mapping

---

## Performance Considerations

1. **Activity Tracking**: Runs async, doesn't block requests
2. **Active Users Query**: Filtered by lastActivityAt index for speed
3. **Theme Lookup**: Object key-based, O(1) lookup
4. **Moderator Updates**: Only runs when new reply added

All optimizations already implemented.

---

## Security Notes

- Main admin approval required for promote/demote
- All admin actions logged to auditLog table
- IP addresses tracked for access history
- Activity middleware only tracks authenticated users

---

Integration complete! All features are now ready to use.
