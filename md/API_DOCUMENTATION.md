# Strelitzia Backend API Documentation

## Overview

Strelitzia Backend is a NestJS application providing secure video streaming and user management APIs. All endpoints are protected with JWT authentication and role-based access control.

**Base URL:** `http://localhost:3000/api` (development)

## Authentication

### JWT Token Structure

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Token Lifecycle

- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 30 days, stored in database
- **Token Refresh**: Use refresh token to get new access token

## Role-Based Access Control

### Roles

| Role | Permissions |
|------|------------|
| **watcher** | Watch videos, view own profile, maintain watch history |
| **admin** | Upload videos, manage other users, view system stats |
| **main_admin** | Full system access including role management |

## API Endpoints

### Authentication

#### Register New User

**POST** `/auth/register`

Register a new user account. All new users default to `watcher` role.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "username": "optional_username"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "optional_username",
    "role": "watcher",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

**Status Codes:**
- `201`: User created successfully
- `400`: Invalid email or password format
- `409`: Email or username already registered

---

#### Login

**POST** `/auth/login`

Authenticate user and receive access + refresh tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "uuid-string",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "watcher"
  }
}
```

**Status Codes:**
- `200`: Login successful
- `401`: Invalid credentials

---

#### Refresh Access Token

**POST** `/auth/refresh`

Get a new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "uuid-from-login",
  "userId": "user-id"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGc..."
}
```

**Status Codes:**
- `200`: Token refreshed
- `401`: Invalid or expired refresh token

---

#### Get Current User Profile

**GET** `/auth/me`

Get authenticated user's profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "optional_username",
    "role": "watcher",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

#### Logout

**POST** `/auth/logout`

Logout and revoke all refresh tokens.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Users Management

#### Get User by ID

**GET** `/users/:id`

Get user profile. Watchers can only view their own profile, admins can view any user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "optional_username",
    "role": "watcher",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden (trying to view other user as watcher)
- `404`: User not found

---

#### List All Users

**GET** `/users`

List all users in system. Admin only.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Query Parameters:**
```
limit?: number (default: 50, max: 100)
offset?: number (default: 0)
role?: 'watcher' | 'admin' | 'main_admin' (optional filter)
isActive?: boolean (optional filter)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "role": "watcher",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `403`: Forbidden (non-admin)

---

#### Update User Role

**PATCH** `/users/:id/role`

Change user role. Main admin only. Cannot downgrade main_admin.

**Headers:**
```
Authorization: Bearer <access_token>
Role: main_admin
```

**Request Body:**
```json
{
  "role": "admin"
}
```

**Valid Roles:** `watcher`, `admin`, `main_admin`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid role
- `401`: Unauthorized
- `403`: Forbidden (non-main_admin)
- `404`: User not found

---

#### Deactivate User

**POST** `/users/:id/deactivate`

Deactivate user account. Admin only. Cannot deactivate main_admin.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "isActive": false
  }
}
```

---

#### Reactivate User

**POST** `/users/:id/reactivate`

Reactivate deactivated user. Admin only.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "isActive": true
  }
}
```

---

#### Get User Statistics

**GET** `/users/stats/all`

Get system statistics about users. Admin only.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 145,
    "roleDistribution": {
      "watchers": 140,
      "admins": 4,
      "mainAdmins": 1
    }
  }
}
```

---

### Videos Management

#### Create Video

**POST** `/videos`

Create new video series. Admin only.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Request Body:**
```json
{
  "title": "Attack on Titan",
  "description": "Optional description",
  "nsfw": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Attack on Titan",
    "description": "Optional description",
    "nsfw": false,
    "episodes": [],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

#### Get Video by ID

**GET** `/videos/:videoId`

Get video with all episodes.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Attack on Titan",
    "episodes": [
      {
        "id": "uuid",
        "title": "Colossus Titan",
        "season": 1,
        "episodeNumber": 1,
        "runtimeSec": 1440,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

#### Get Episodes for Video

**GET** `/videos/:videoId/episodes`

List all episodes for a video.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Colossus Titan",
      "season": 1,
      "episodeNumber": 1,
      "runtimeSec": 1440
    }
  ]
}
```

---

#### Delete Video

**DELETE** `/videos/:videoId`

Delete video and all episodes. Admin only.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Response:**
```json
{
  "success": true,
  "message": "Video deleted successfully"
}
```

---

### Video Streaming

#### Get Signed URL

**GET** `/videos/:episodeId/signed-url`

Get streaming URL for episode.

**Response:**
```json
{
  "success": true,
  "url": "/api/videos/:episodeId/stream"
}
```

---

#### Stream Video

**GET** `/videos/:episodeId/stream`

Stream HLS master playlist (m3u8 file).

**Response:** HLS m3u8 file (application/x-mpegURL)

---

#### Stream HLS Segment

**GET** `/videos/:episodeId/segment/:segmentName`

Stream individual HLS video segment.

**Response:** MPEG-TS segment (video/MP2T)

---

### Watch History

#### Record Watch Position

**POST** `/videos/:episodeId/watch`

Record current playback position for episode.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "positionSec": 1200
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "episodeId": "uuid",
    "lastPositionSec": 1200,
    "watchedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

#### Get Watch History

**GET** `/videos/watch-history/me`

Get user's watch history.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "episodeId": "uuid",
      "lastPositionSec": 1200,
      "episode": {
        "title": "Colossus Titan",
        "video": {
          "id": "uuid",
          "title": "Attack on Titan"
        }
      },
      "watchedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

### Uploads

#### Initialize Upload

**POST** `/upload/init`

Initialize single file upload. Admin only.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Request Body:**
```json
{
  "filename": "episode01.mkv",
  "size": 5368709120,
  "prefer_downscale_to_1080": true,
  "keep_original": false
}
```

**Response:**
```json
{
  "success": true,
  "uploadId": "uuid",
  "uploadUrl": "/api/upload/uuid/stream",
  "key": "uploads/uuid/episode01.mkv"
}
```

---

#### Initialize Batch Upload

**POST** `/upload/init/batch`

Initialize batch upload (multiple files). Admin only.

**Request Body:**
```json
[
  {
    "filename": "episode01.mkv",
    "size": 5368709120,
    "prefer_downscale_to_1080": true
  },
  {
    "filename": "episode02.mkv",
    "size": 5368709120,
    "prefer_downscale_to_1080": true
  }
]
```

**Response:**
```json
{
  "success": true,
  "batchId": "uuid",
  "files": [
    {
      "uploadId": "uuid",
      "uploadUrl": "/api/upload/uuid/stream",
      "key": "uploads/batchId/uuid/episode01.mkv"
    }
  ]
}
```

---

#### Stream Upload File

**PUT** `/upload/:uploadId/stream`

Upload file to server.

**Headers:**
```
Content-Type: application/octet-stream
x-filename: episode01.mkv
```

**Body:** Raw file data (binary)

**Response:**
```json
{
  "success": true,
  "status": "uploaded",
  "uploadId": "uuid",
  "filename": "episode01.mkv",
  "bytes": 5368709120
}
```

---

#### Complete Upload

**POST** `/upload/complete`

Finalize upload and enqueue for transcoding.

**Headers:**
```
Authorization: Bearer <access_token>
Role: admin or main_admin
```

**Request Body:**
```json
{
  "uploadId": "uuid",
  "metadata": {
    "videoId": "uuid",
    "episodeNumber": 1,
    "season": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "message": "File uploaded and queued for transcoding"
}
```

---

#### Get Upload Status

**GET** `/upload/:uploadId/status`

Get transcoding job status.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

**Status Values:** `pending`, `running`, `success`, `failed`, `cancelled`

---

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "BadRequest"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (missing/invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (resource exists) |
| `413` | Payload Too Large |
| `500` | Internal Server Error |

---

## Rate Limiting

Future implementation. Currently unlimited.

---

## CORS

CORS is configured for:
- Development: `http://localhost:3000`, `http://localhost:3001`
- Production: Configure via environment

---

## Pagination

Some list endpoints support pagination:

```
GET /users?limit=50&offset=0
```

**Query Parameters:**
- `limit`: Items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

---

## Filtering

Endpoints support optional filtering:

```
GET /users?role=admin&isActive=true
```

---

## Timestamps

All timestamps are in ISO 8601 format (UTC):
```
2024-01-15T10:30:00Z
```

---

## Example: Complete Upload Workflow

```javascript
// 1. Initialize upload
const initRes = await fetch('/api/upload/init', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    filename: 'episode01.mkv',
    size: 5000000,
    prefer_downscale_to_1080: true
  })
});
const { uploadId } = await initRes.json();

// 2. Upload file
const file = new File([...], 'episode01.mkv');
const uploadRes = await fetch(`/api/upload/${uploadId}/stream`, {
  method: 'PUT',
  headers: { 'x-filename': 'episode01.mkv' },
  body: file
});

// 3. Complete upload
const completeRes = await fetch('/api/upload/complete', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: JSON.stringify({
    uploadId,
    metadata: { videoId: '...', episodeNumber: 1 }
  })
});
const { jobId } = await completeRes.json();

// 4. Check transcoding status
const statusRes = await fetch(`/api/upload/${jobId}/status`, {
  headers: { 'Authorization': 'Bearer token' }
});
const { data } = await statusRes.json();
console.log(data.status); // pending -> running -> success
```

---

## Security Notes

1. **Never** store access tokens in localStorage (use HttpOnly cookies or memory)
2. **Always** use HTTPS in production
3. **Validate** all user input on client and server
4. **Implement** CSRF protection for state-changing operations
5. **Use** strong passwords (16+ characters, mixed case, symbols)
6. **Enable** 2FA for admin accounts (future feature)
7. **Rotate** JWT keys regularly
8. **Monitor** audit logs for suspicious activity

---

## Support

For API issues or questions:
1. Check audit logs for activity details
2. Review error messages carefully
3. Verify JWT token validity and expiration
4. Check user role and permissions
5. Review database for data consistency
