# Security Challenge - Quick Integration Steps

## Summary

Adding a mandatory security challenge (DDoS guard) that requires users to answer a random question from 320+ questions before accessing the site. Main admin users bypass it.

## What's Been Created (8 Files)

### Backend (4 files)
1. `api/src/modules/security/security-questions.ts` - 320+ questions database
2. `api/src/modules/security/security-challenge.service.ts` - Challenge logic & cooldown
3. `api/src/modules/security/security-challenge.controller.ts` - API endpoints
4. `api/src/middleware/security-verification.middleware.ts` - Global route blocker

### Frontend (4 files)
5. `web/pages/security-challenge.tsx` - Challenge page component
6. `web/styles/security-challenge.module.css` - Challenge page styling
7. `web/pages/access-denied.tsx` - Wrong answer/lockout page
8. `web/styles/access-denied.module.css` - Lockout page styling

## Step 1: Backend Module Setup (2 minutes)

### 1a. Create Security Module (if not using global registration)

Create `api/src/modules/security/security.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { SecurityChallengeService } from './security-challenge.service';
import { SecurityChallengeController } from './security-challenge.controller';
import { PrismaService } from '../../common/prisma/prisma.service';

@Module({
  providers: [SecurityChallengeService, PrismaService],
  controllers: [SecurityChallengeController],
  exports: [SecurityChallengeService],
})
export class SecurityModule {}
```

### 1b. Update app.module.ts

Add imports and middleware configuration:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { SecurityModule } from './modules/security/security.module';
import { SecurityVerificationMiddleware } from './middleware/security-verification.middleware';
import session from 'express-session';

@Module({
  imports: [
    // ... existing imports ...
    SecurityModule, // Add this
  ],
  controllers: [
    // ... existing controllers ...
  ],
  providers: [
    // ... existing providers ...
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply session middleware first (if not already applied)
    consumer
      .apply(
        session({
          secret: process.env.SESSION_SECRET || 'change-this-in-production',
          resave: false,
          saveUninitialized: true,
          cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
          },
        })
      )
      .forRoutes('*');

    // Apply security verification middleware to all routes except bypasses
    consumer
      .apply(SecurityVerificationMiddleware)
      .exclude(
        '/security', // All security endpoints
        '/health',   // Health check
        '/docs',     // Swagger docs
      )
      .forRoutes('*');
  }
}
```

### 1c. Install Express Session (if not already installed)

```bash
cd api
npm install express-session
npm install --save-dev @types/express-session
```

### 1d. Update main.ts

Ensure app is configured to handle sessions:

```typescript
// main.ts - after app creation
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Session middleware will be applied by app.module.ts configuration

const app = await NestFactory.create(AppModule);
// ... rest of setup
await app.listen(3001);
```

## Step 2: Frontend Setup (1 minute)

No special setup needed! Files are already created and ready to use:
- `web/pages/security-challenge.tsx` - Automatically serves at `/security-challenge`
- `web/pages/access-denied.tsx` - Automatically serves at `/access-denied`
- CSS modules already linked

## Step 3: Update Environment Variables (1 minute)

Add to `.env` and `.env.local`:

```env
# Session configuration
SESSION_SECRET=your-super-secret-random-key-change-this-in-production

# Optional: API URL for frontend (if backend on different domain)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

For production, use a strong random secret:
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Test Everything (5 minutes)

### Test 1: Check Security Challenge Page

1. Start backend: `cd api && npm run start:dev`
2. Start frontend: `cd web && npm run dev`
3. Visit `http://localhost:3000/security-challenge`
4. Should see challenge page with random question

### Test 2: Verify Backend API

```bash
# Get a new challenge
curl http://localhost:3001/security/challenge/new \
  -H "x-session-id: test-session-123" \
  -H "Content-Type: application/json"

# Should return:
# {
#   "success": true,
#   "data": {
#     "questionId": 42,
#     "question": "What is the capital of France?"
#   }
# }
```

### Test 3: Verify Answer

```bash
# Submit correct answer
curl http://localhost:3001/security/challenge/verify \
  -X POST \
  -H "x-session-id: test-session-123" \
  -H "Content-Type: application/json" \
  -d '{"questionId": 54, "answer": "paris"}'

# Should return:
# {
#   "success": true,
#   "message": "Challenge passed! Welcome."
# }
```

### Test 4: Verify Route Protection

Try to access any site page without passing challenge:

```bash
# Try direct navigation to protected route
curl http://localhost:3000/characters

# Frontend should redirect you to /security-challenge
# If backend blocked it, you'll get 403:
# {
#   "success": false,
#   "message": "Security challenge required"
# }
```

### Test 5: Test Wrong Answer

```bash
# Submit wrong answer
curl http://localhost:3001/security/challenge/verify \
  -X POST \
  -H "x-session-id: test-session-456" \
  -H "Content-Type: application/json" \
  -d '{"questionId": 54, "answer": "wrong-city"}'

# Should return 403 with cooldown:
# {
#   "success": false,
#   "message": "Wrong answer! Cooldown: 60 seconds.",
#   "data": {
#     "nextCooldown": 60,
#     "attempts": 1,
#     "isLocked": true
#   }
# }
```

## Step 5: Customize (Optional - 5 minutes)

### Add More Questions

Edit `api/src/modules/security/security-questions.ts`:

```typescript
export const SECURITY_QUESTIONS = [
  // ... existing 320+ questions ...
  { id: 321, question: "Your custom question?", answer: "your answer" },
  { id: 322, question: "Another question?", answer: "another answer" },
];
```

### Change Timer Duration

Edit `web/pages/security-challenge.tsx`:

```typescript
// Change from 10 seconds to 15 seconds
const [timeRemaining, setTimeRemaining] = useState(15);
```

### Change Cooldown Durations

Edit `api/src/modules/security/security-challenge.service.ts`:

```typescript
// Change from 60 seconds to 90 seconds base cooldown
const cooldownDuration = newAttempts === 1 
  ? 90000  // 90 seconds
  : 90000 + (newAttempts - 1) * 30000;
```

### Customize Taunts

Edit `web/pages/access-denied.tsx`:

```typescript
const getTauntMessage = () => {
  const messages = [
    "Your custom taunt message 1",
    "Your custom taunt message 2",
    "Your custom taunt message 3",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
};
```

## Step 6: Handle Main Admin Bypass (Optional - 5 minutes)

Currently, security verification only checks sessions. To add main admin bypass:

### Option 1: Bypass in Middleware (Recommended)

Update `api/src/middleware/security-verification.middleware.ts`:

```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MainAdminService } from '../modules/admin/main-admin.service'; // Add import

@Injectable()
export class SecurityVerificationMiddleware implements NestMiddleware {
  constructor(private mainAdminService: MainAdminService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const path = req.path;
    const method = req.method;

    if (method === 'OPTIONS') return next();
    if (this.shouldBypassSecurity(path)) return next();

    // Check if user is main admin
    const user = (req as any).user; // Assuming auth middleware sets this
    if (user && await this.mainAdminService.isMainAdmin(user.id)) {
      return next(); // Skip security challenge for main admin
    }

    // Rest of existing logic...
    const isVerified = (req.session as any)?.securityVerified === true;
    if (!isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Security challenge required',
        data: { redirect: '/security-challenge' },
      });
    }

    next();
  }

  private shouldBypassSecurity(path: string): boolean {
    return ['/security', '/health', '/docs'].some(route =>
      path.startsWith(route)
    );
  }
}
```

## Step 7: Deploy (5 minutes)

### Build Both Applications

```bash
# Backend
cd api
npm run build

# Frontend
cd web
npm run build
```

### Environment Setup

Create production `.env`:

```env
SESSION_SECRET=<use-strong-random-key>
DATABASE_URL=<your-production-db>
NODE_ENV=production
```

### Run in Production

```bash
# Backend (with session store)
NODE_ENV=production npm start

# Frontend
NODE_ENV=production npm start
```

## Quick Verification Checklist

- [ ] Security module created and imported in app.module.ts
- [ ] SecurityVerificationMiddleware applied to all routes
- [ ] Session middleware configured with secure cookies
- [ ] Environment variables set (SESSION_SECRET)
- [ ] Frontend security-challenge page accessible at `/security-challenge`
- [ ] Access denied page accessible at `/access-denied`
- [ ] Can answer question correctly and get redirected to home
- [ ] Wrong answer shows cooldown screen
- [ ] Refresh detection blocks page reloads
- [ ] Main admin bypasses challenge (optional feature)
- [ ] Direct URL access (e.g., `/characters`) forces challenge first
- [ ] Backend API endpoints working: `/security/challenge/new`, `/security/challenge/verify`

## If Something Goes Wrong

### "Cannot find module" Error

```bash
# Reinstall dependencies
cd api && npm install
cd web && npm install
```

### "Session not defined" Error

Ensure `express-session` is installed:
```bash
npm install express-session @types/express-session
```

### Challenge page not showing

1. Check that `/security-challenge` route exists in Next.js pages
2. Verify CSS modules are imported
3. Check browser console for JavaScript errors

### Cooldown not working

1. Verify `express-session` middleware is running BEFORE security middleware
2. Check that SESSION_SECRET is set in environment
3. Enable debug logging in service to track session lifecycle

### Users can bypass with direct URL

1. Verify SecurityVerificationMiddleware is applied to ALL routes
2. Check that middleware properly checks `req.session.securityVerified`
3. Ensure session is being saved between requests

## Support Files

- **Full Documentation**: `/md/SECURITY_CHALLENGE_GUIDE.md`
- **API Endpoints**: See SECURITY_CHALLENGE_GUIDE.md - API Endpoints section
- **Troubleshooting**: See SECURITY_CHALLENGE_GUIDE.md - Troubleshooting section
- **Customization**: See SECURITY_CHALLENGE_GUIDE.md - Customization section

## Summary of Changes

| Component | Location | Action |
|-----------|----------|--------|
| Questions Database | `api/src/modules/security/security-questions.ts` | ✅ Created |
| Challenge Service | `api/src/modules/security/security-challenge.service.ts` | ✅ Created |
| Challenge Controller | `api/src/modules/security/security-challenge.controller.ts` | ✅ Created |
| Verification Middleware | `api/src/middleware/security-verification.middleware.ts` | ✅ Created |
| Challenge Page | `web/pages/security-challenge.tsx` | ✅ Created |
| Challenge Styles | `web/styles/security-challenge.module.css` | ✅ Created |
| Access Denied Page | `web/pages/access-denied.tsx` | ✅ Created |
| Denied Styles | `web/styles/access-denied.module.css` | ✅ Created |
| app.module.ts | `api/src/app.module.ts` | ⚠️ Needs update (add SecurityModule import & middleware config) |
| Environment Variables | `.env` | ⚠️ Needs update (add SESSION_SECRET) |

**Total Implementation Time**: ~20-30 minutes

Enjoy your new DDoS protection! 🛡️
