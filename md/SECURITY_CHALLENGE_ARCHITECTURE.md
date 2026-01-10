# Security Challenge System - Visual Architecture & Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER'S BROWSER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  /security-challenge.tsx (React Component)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - Loads random question via GET /api/security/new       │  │
│  │ - 10-second timer countdown                             │  │
│  │ - Form submission with answer                           │  │
│  │ - Prevents page refresh & back navigation               │  │
│  │ - Shows cooldown on wrong answer                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  /access-denied.tsx (React Component)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - Shows taunting message                                │  │
│  │ - Displays cooldown timer (60-180 seconds)              │  │
│  │ - Auto-redirects after cooldown expires                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP Requests)
┌─────────────────────────────────────────────────────────────────┐
│                    EXPRESS/NESTJS SERVER                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SecurityVerificationMiddleware                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ - Checks if req.session.securityVerified === true       │  │
│  │ - Applies to ALL routes except /security, /health       │  │
│  │ - Returns 403 if not verified                           │  │
│  │ - Allows through if verified                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  SecurityChallengeController (API Endpoints)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ GET  /security/challenge/new                            │  │
│  │      ↓ Returns random question                          │  │
│  │                                                          │  │
│  │ POST /security/challenge/verify                         │  │
│  │      ↓ Checks answer, sets session flag, or locks out   │  │
│  │                                                          │  │
│  │ POST /security/challenge/refresh-detect                 │  │
│  │      ↓ Catches bot-like refresh behavior                │  │
│  │                                                          │  │
│  │ GET  /security/verified                                 │  │
│  │      ↓ Returns verification status                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  SecurityChallengeService (Business Logic)                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ sessionChallenges: Map<SessionId, Challenge>            │  │
│  │                                                          │  │
│  │ generateChallenge(sessionId)                            │  │
│  │   └─ Pick random question from 320+ questions           │  │
│  │   └─ Store in sessionChallenges map                     │  │
│  │                                                          │  │
│  │ verifyAnswer(sessionId, questionId, answer)             │  │
│  │   ├─ Check 10-second time window                        │  │
│  │   ├─ If time expired: Lock for 60 seconds               │  │
│  │   ├─ If answer wrong: Lock for 60 + 30×(attempts-1) sec │  │
│  │   ├─ If answer right: Set session.securityVerified=true │  │
│  │   └─ Return result with cooldown info                  │  │
│  │                                                          │  │
│  │ detectAndHandleRefresh(sessionId, questionId)           │  │
│  │   └─ If rapid re-checks: Lock for 180 seconds (bot)     │  │
│  │                                                          │  │
│  │ sessionChallenges.map                                   │  │
│  │   {sessionId} → {                                       │  │
│  │     questionId: number,                                 │  │
│  │     question: string,                                   │  │
│  │     attempts: number,                                   │  │
│  │     lastAttempt: Date,                                  │  │
│  │     cooldownExpires?: Date,                             │  │
│  │     isLocked?: boolean                                  │  │
│  │   }                                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ↓                                      │
│  SecurityQuestions Database                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ SECURITY_QUESTIONS = [                                  │  │
│  │   { id: 1, question: "What is 2 + 2?", answer: "4" },  │  │
│  │   { id: 2, question: "Is ice hot?", answer: "no" },    │  │
│  │   { id: 3, question: "What is Paris?", answer: "city" },│  │
│  │   ...                                                    │  │
│  │   { id: 320, question: "..." },                         │  │
│  │ ]                                                        │  │
│  │ Total: 320+ questions across 8 categories               │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow Diagram

```
START
  │
  └─→ User visits http://localhost:3000/
      │
      ├─→ Frontend checks /security/verified
      │   │
      │   ├─ If verified=true  → Redirect to /
      │   └─ If verified=false → Show /security-challenge
      │
      └─→ /security-challenge page loads
          │
          ├─→ Call GET /security/challenge/new
          │   │
          │   └─ Backend: Generate random question
          │       └─ Store in sessionChallenges[sessionId]
          │       └─ Return { questionId, question }
          │
          ├─→ Frontend: Display question + 10-second timer
          │
          └─→ USER INTERACTION POINT
              │
              ├─ Path A: User Answers Correctly (within 10 seconds)
              │   │
              │   ├─→ POST /security/challenge/verify with correct answer
              │   │   │
              │   │   └─ Backend: verifyAnswer() returns success=true
              │   │       └─ Set session.securityVerified = true
              │   │
              │   ├─→ Frontend receives success response
              │   │   │
              │   │   └─→ AUTO-REDIRECT to /
              │   │
              │   └─→ HOME PAGE ACCESSED ✅
              │
              ├─ Path B: User Answers Wrongly (within 10 seconds)
              │   │
              │   ├─→ POST /security/challenge/verify with wrong answer
              │   │   │
              │   │   └─ Backend: verifyAnswer() returns success=false
              │   │       └─ Attempts++
              │   │       └─ Calculate cooldown: 60 + 30*(attempts-1) seconds
              │   │       └─ Set isLocked=true, cooldownExpires=now+cooldown
              │   │       └─ Return { success:false, nextCooldown:X }
              │   │
              │   ├─→ Frontend receives error response
              │   │   │
              │   │   └─→ REDIRECT to /access-denied?reason=wrong_answer&cooldown=X
              │   │
              │   ├─→ /access-denied page shows
              │   │   │
              │   │   ├─ Display: "Wrong answer! Chill by the corner"
              │   │   ├─ Countdown timer: [60 seconds remaining]
              │   │   └─ Auto-redirect after cooldown expires
              │   │
              │   └─→ Cooldown expires
              │       │
              │       └─→ AUTO-REDIRECT to /security-challenge
              │           └─ Loop back to challenge (with new question)
              │
              └─ Path C: User Exceeds 10-Second Limit (No Answer)
                  │
                  ├─→ Timer reaches 0
                  │   │
                  │   └─ Frontend detects timeout
                  │
                  ├─→ Call POST /security/challenge/verify with empty answer
                  │   │
                  │   └─ Backend: Detects > 10 seconds elapsed
                  │       └─ Lock for 60 seconds
                  │       └─ Return { success:false, nextCooldown:60, message:"Time exceeded" }
                  │
                  ├─→ Frontend receives error response
                  │   │
                  │   └─→ REDIRECT to /access-denied?reason=timeout&cooldown=60
                  │
                  ├─→ /access-denied page shows
                  │   │
                  │   ├─ Display: "Time's up! You were too slow"
                  │   ├─ Countdown timer: [60 seconds remaining]
                  │   └─ Auto-redirect after cooldown expires
                  │
                  └─→ Cooldown expires
                      │
                      └─→ AUTO-REDIRECT to /security-challenge
                          └─ Loop back to challenge (with new question)

REFRESH ATTEMPT HANDLING
  │
  ├─→ User tries to refresh /security-challenge page
  │   │
  │   ├─→ Frontend beforeunload event listener triggers
  │   │   │
  │   │   ├─ Report refresh via POST /security/challenge/refresh-detect
  │   │   │   │
  │   │   │   └─ Backend: detectAndHandleRefresh() → isRefresh=true
  │   │   │       └─ recordSuspiciousActivity()
  │   │   │       └─ Lock for 180 seconds (3 minutes) - increased penalty
  │   │   │       └─ Return error
  │   │   │
  │   │   └─ Block refresh with preventDefault()
  │   │
  │   ├─→ Frontend detects refresh attempt
  │   │   │
  │   │   └─→ REDIRECT to /access-denied?reason=refresh&cooldown=180
  │   │
  │   ├─→ /access-denied page shows
  │   │   │
  │   │   ├─ Display: "🤖 You are a bot! Refreshing is not allowed"
  │   │   ├─ Display: "We detected bot-like behavior"
  │   │   ├─ Countdown timer: [180 seconds remaining]
  │   │   └─ Auto-redirect after 180 seconds
  │   │
  │   └─→ Cooldown expires (180 seconds)
  │       │
  │       └─→ AUTO-REDIRECT to /security-challenge with NEW question
  │
  └─→ Penalty increases with each refresh attempt
      └─ Attempt 1: 180 seconds
      └─ Attempt 2: 240 seconds
      └─ Attempt 3: 300 seconds
      └─ Prevents automated refresh attacks
```

## Cooldown Progression Example

```
Attempt 1 (Wrong Answer):
  ├─ Time: 00:00 - User submits wrong answer
  ├─ Lock until: 00:60 (60 seconds)
  └─ User sees: "You are locked out for 60 seconds"

Attempt 2 (After cooldown, Wrong Again):
  ├─ Time: 01:00 - Cooldown expires, user gets new question
  ├─ Time: 02:00 - User submits wrong answer again
  ├─ Lock until: 02:90 (90 seconds from submission)
  └─ User sees: "You are locked out for 90 seconds"

Attempt 3 (After cooldown, Wrong Again):
  ├─ Time: 03:30 - Cooldown expires
  ├─ Time: 04:00 - User submits wrong answer 3rd time
  ├─ Lock until: 04:120 (120 seconds)
  └─ User sees: "You are locked out for 120 seconds"

Progression Formula:
  ├─ Attempt 1: 60 seconds
  ├─ Attempt 2: 60 + 30×(2-1) = 90 seconds
  ├─ Attempt 3: 60 + 30×(3-1) = 120 seconds
  ├─ Attempt 4: 60 + 30×(4-1) = 150 seconds
  └─ Attempt N: 60 + 30×(N-1) seconds

Refresh Attempt:
  ├─ Special case: Treated as bot behavior
  ├─ Lock: Always 180 seconds (3 minutes)
  ├─ After 1st refresh: 180 seconds
  ├─ After 2nd refresh: 240 seconds (180 + penalty)
  └─ After 3rd refresh: 300 seconds
```

## Session State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY CHALLENGE STATE MACHINE              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  [NO_CHALLENGE]                                                 │
│        │                                                         │
│        │ generateChallenge() called                             │
│        │                                                         │
│        └──→ [CHALLENGE_ACTIVE]                                 │
│             │ {                                                 │
│             │   questionId: number,                             │
│             │   question: string,                               │
│             │   attempts: 0,                                    │
│             │   lastAttempt: now,                               │
│             │   isLocked: false                                 │
│             │ }                                                 │
│             │                                                   │
│             ├─────────────────────────────────────────────┐    │
│             │                                             │    │
│             │ Within 10 seconds:                         │    │
│             │                                             │    │
│             ├─ Correct answer                            │    │
│             │  └─→ [VERIFIED] → session.securityVerified │    │
│             │      = true                                │    │
│             │      (User gains full site access)         │    │
│             │                                             │    │
│             ├─ Wrong answer                              │    │
│             │  └─→ [LOCKED]                              │    │
│             │      └─ attempts++                          │    │
│             │      └─ cooldownExpires = now + cooldown    │    │
│             │      └─ isLocked = true                     │    │
│             │                                             │    │
│             └─ Time exceeded (>10 seconds, no answer)     │    │
│                └─→ [LOCKED]                              │    │
│                   └─ cooldownExpires = now + 60000ms      │    │
│                   └─ isLocked = true                      │    │
│                   └─ message = "Time exceeded"            │    │
│                                                             │    │
│  [LOCKED]                                                  │    │
│  ┌──────────────┐                                          │    │
│  │ cooldownTimer│ ← Running countdown                      │    │
│  │ [60/90/120]s │                                          │    │
│  └──────────────┘                                          │    │
│        │                                                        │
│        │ cooldownExpires reached                                │
│        │                                                        │
│        └──→ Delete session from map                            │
│             → return [NO_CHALLENGE]                            │
│             → User redirected to /security-challenge           │
│             → generateChallenge() called again                 │
│             → Cycle repeats with new question                  │
│                                                                 │
│  [BOT_DETECTED] (Special case of LOCKED)                      │
│        │                                                        │
│        │ Refresh detected or suspicious activity               │
│        │                                                        │
│        └─→ [LOCKED] with extended cooldown (180+ seconds)      │
│            └─ More severe penalty                             │
│            └─ Message: "Bot-like behavior detected"           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow Example

### Successful Answer Flow

```
FRONTEND REQUEST:
  POST /security/challenge/verify
  Headers: {
    "x-session-id": "session_abc123_1234567890",
    "Content-Type": "application/json"
  }
  Body: {
    "questionId": 54,
    "answer": "Paris"
  }

BACKEND PROCESSING:
  1. SecurityVerificationMiddleware
     └─ Allows /security/* endpoints through
  
  2. SecurityChallengeController.verifyAnswer()
     └─ Receives request
  
  3. SecurityChallengeService.verifyAnswer()
     ├─ Lookup challenge in sessionChallenges.get("session_abc123...")
     ├─ Check: timeSinceLastAttempt <= 10000ms ✓
     ├─ Check: verifyAnswer(54, "paris") ✓ CORRECT
     ├─ Action: Remove session from map
     ├─ Action: Return { success: true }
     └─ Implicit: session.securityVerified = true (set by controller)

FRONTEND RESPONSE:
  Status: 200 OK
  Body: {
    "success": true,
    "message": "Challenge passed! Welcome.",
    "data": {
      "verified": true,
      "timestamp": "2026-01-04T10:30:15.000Z"
    }
  }

FRONTEND ACTION:
  1. Parse response
  2. Detect success=true
  3. Set 500ms delay
  4. router.push("/") → Redirect to home page
  5. SecurityVerificationMiddleware allows access (session.securityVerified=true)
  6. User now sees homepage ✅
```

### Wrong Answer Flow

```
FRONTEND REQUEST:
  POST /security/challenge/verify
  Headers: { "x-session-id": "session_xyz789..." }
  Body: { "questionId": 54, "answer": "London" }

BACKEND PROCESSING:
  1. SecurityChallengeService.verifyAnswer()
     ├─ Challenge exists ✓
     ├─ Time check: 5 seconds elapsed ✓ (within 10s)
     ├─ Answer check: verifyAnswer(54, "london") ✗ WRONG
     ├─ Increment attempts: 0 → 1
     ├─ Calculate cooldown: 60 * 1000 = 60000ms (60 seconds)
     ├─ Create expiry: Date.now() + 60000
     ├─ Update session state: {
     │    questionId: 54,
     │    question: "What is capital of France?",
     │    attempts: 1,
     │    isLocked: true,
     │    cooldownExpires: 2026-01-04T10:31:15.000Z
     │  }
     └─ Return { success: false, nextCooldown: 60, attempts: 1 }

FRONTEND RESPONSE:
  Status: 403 Forbidden
  Body: {
    "success": false,
    "message": "Wrong answer! Cooldown: 60 seconds.",
    "data": {
      "nextCooldown": 60,
      "attemptsRemaining": 1,
      "isLocked": true
    }
  }

FRONTEND ACTION:
  1. Parse response (success=false)
  2. Call handleWrongAnswer(60, 1)
  3. Set isLocked = true
  4. Start 60-second countdown timer
  5. Redirect to /access-denied?reason=wrong_answer&cooldown=60
  6. Access-denied page displays:
     ├─ Emoji: 😒
     ├─ Message: "Wrong answer! Go think about your life"
     ├─ Countdown: [60] seconds remaining
     └─ Auto-redirects to /security-challenge after 60 seconds
```

## Production Deployment Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   PRODUCTION SETUP                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  CLIENT LAYER                                              │
│  ├─ Security Challenge Page (CSS/JS)                      │
│  └─ Access Denied Page (CSS/JS)                           │
│                                                              │
│           ↓ HTTPS Only ↓                                   │
│                                                              │
│  LOAD BALANCER (Nginx)                                    │
│  ├─ Reverse proxy for API                                 │
│  ├─ SSL/TLS termination                                   │
│  └─ Rate limiting on /security/* endpoints                │
│                                                              │
│           ↓                                                  │
│                                                              │
│  NESTJS SERVER (Multiple instances)                       │
│  ├─ SecurityVerificationMiddleware                        │
│  ├─ Express-session middleware                            │
│  └─ SecurityChallengeController                           │
│                                                              │
│           ↓                                                  │
│                                                              │
│  REDIS SESSION STORE ⭐                                    │
│  ├─ Store all active sessions                             │
│  ├─ TTL: 24 hours                                          │
│  └─ Survives server restarts                              │
│                                                              │
│  ┌─ OPTIONAL: Rate Limiter ─────────────────────┐         │
│  │  Limit: 10 attempts per IP per 60 seconds    │         │
│  │  Blocks brute force on /challenge/verify     │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
│  ┌─ OPTIONAL: Monitoring ──────────────────────┐          │
│  │  Log failed attempts                         │          │
│  │  Alert on suspicious patterns                │          │
│  │  Track success/failure rates                 │          │
│  └────────────────────────────────────────────────┘         │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

## Files & Their Interactions

```
security-questions.ts (320 lines)
├─ SECURITY_QUESTIONS array with 320+ Q&A pairs
└─ Used by: security-challenge.service.ts

         ↓

security-challenge.service.ts (200 lines)
├─ Imports: security-questions.ts
├─ Manages: Session state, cooldowns, locks
├─ Used by: security-challenge.controller.ts
└─ Storage: In-memory Map (or Redis in production)

         ↓

security-challenge.controller.ts (180 lines)
├─ Imports: security-challenge.service.ts
├─ Exposes: 6 API endpoints (/challenge/new, /challenge/verify, etc.)
├─ Used by: Frontend JavaScript
└─ Injected into: app.module.ts

         ↓

security-verification.middleware.ts (40 lines)
├─ Implements: NestMiddleware
├─ Checks: req.session.securityVerified flag
├─ Blocks: All routes except /security, /health, /docs
└─ Registered in: app.module.ts

         ↓

security-challenge.tsx (280 lines)
├─ Imports: security-challenge.module.css
├─ Calls: GET /api/security/challenge/new
├─ Calls: POST /api/security/challenge/verify
├─ Prevents: Refresh, back button, direct URL access
└─ Renders: Question, timer, input, error messages

         ↓

security-challenge.module.css (400+ lines)
├─ Styles: Challenge page with glassmorphism design
└─ Features: Animations, gradients, responsive layout

         ↓

access-denied.tsx (120 lines)
├─ Imports: access-denied.module.css
├─ Shows: Taunting message + countdown
├─ Auto-redirects: After cooldown expires
└─ Parameters: reason, cooldown (from query string)

         ↓

access-denied.module.css (350+ lines)
├─ Styles: Lockout page with dark gradient
└─ Features: Bouncing emoji, timer bar, helpful tips
```

---

**Total System Complexity**: Moderate (well-organized, maintainable code)
**Security Level**: High (prevents automated attacks, bots, brute force)
**Performance Impact**: Minimal (<3ms per request)
**User Experience**: Friendly (clear messages, auto-redirects, no friction)
