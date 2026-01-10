# API Usage Examples

Complete examples for all new endpoints.

## Authentication & Registration

### First User Registration (Auto main_admin)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "firstadmin@example.com",
    "password": "SecurePassword123!",
    "username": "firstadmin"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "firstadmin@example.com",
    "username": "firstadmin",
    "role": "main_admin"
  }
}
```

### Regular User Registration (watcher role)

**Request:**
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MyPassword123!",
    "username": "username"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "email": "user@example.com",
    "username": "username",
    "role": "watcher"
  }
}
```

## Admin IP Whitelist Management

### 1. Get Your Current IP

**Request:**
```bash
curl -X GET http://localhost:3000/admin/my-ip \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "ip": "192.168.1.100"
}
```

### 2. Get All Whitelisted Admin IPs

**Request:**
```bash
curl -X GET http://localhost:3000/admin/ips \
  -H "Authorization: Bearer MAIN_ADMIN_TOKEN"
```

**Response:**
```json
{
  "data": [
    {
      "id": "ip-id-1",
      "ipAddress": "192.168.1.100",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "userName": "firstadmin",
      "isMainAdmin": true,
      "addedAt": "2024-01-15T10:30:00Z",
      "lastAccessed": "2024-01-15T15:45:00Z"
    },
    {
      "id": "ip-id-2",
      "ipAddress": "192.168.1.105",
      "userId": "550e8400-e29b-41d4-a716-446655440002",
      "userName": "secondadmin",
      "isMainAdmin": false,
      "addedAt": "2024-01-15T11:00:00Z",
      "lastAccessed": null
    }
  ]
}
```

### 3. Add New Admin IP

**Request:**
```bash
curl -X POST http://localhost:3000/admin/ips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer MAIN_ADMIN_TOKEN" \
  -d '{
    "email": "secondadmin@example.com",
    "ipAddress": "192.168.1.105"
  }'
```

**Response (201 Created):**
```json
{
  "id": "ip-id-2",
  "ipAddress": "192.168.1.105",
  "userId": "550e8400-e29b-41d4-a716-446655440002",
  "userName": "secondadmin",
  "isMainAdmin": false,
  "addedAt": "2024-01-15T11:00:00Z"
}
```

### 4. Remove Admin IP

**Request:**
```bash
curl -X DELETE http://localhost:3000/admin/ips/ip-id-2 \
  -H "Authorization: Bearer MAIN_ADMIN_TOKEN"
```

**Response:**
```json
{
  "success": true
}
```

**Error (if trying to remove only IP):**
```json
{
  "statusCode": 400,
  "message": "Cannot remove the only IP address for main admin (prevents lockout)"
}
```

### 5. Check IP Whitelist Status

**Request:**
```bash
curl -X POST http://localhost:3000/admin/check-ip \
  -H "Content-Type: application/json" \
  -d '{
    "ipAddress": "192.168.1.100"
  }'
```

**Response:**
```json
{
  "whitelisted": true
}
```

## Community Forum

### 1. Get All Posts (Paginated)

**Request:**
```bash
curl -X GET "http://localhost:3000/community/posts?page=1&limit=20&category=general"
```

**Response:**
```json
{
  "data": [
    {
      "id": "post-id-1",
      "title": "Welcome to the Community!",
      "content": "This is a sample post content here...",
      "author": "firstadmin",
      "category": "general",
      "views": 45,
      "replies": 3,
      "pinned": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    {
      "id": "post-id-2",
      "title": "Best Anime of 2024",
      "content": "What's your favorite anime so far?",
      "author": "username",
      "category": "anime",
      "views": 28,
      "replies": 7,
      "pinned": false,
      "createdAt": "2024-01-15T09:30:00Z",
      "updatedAt": "2024-01-15T10:15:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pageSize": 20,
    "pages": 3
  }
}
```

### 2. Filter Posts by Category

**Request:**
```bash
curl -X GET "http://localhost:3000/community/posts?category=anime&page=1&limit=20"
```

**Categories available:**
- `general` - General discussion
- `anime` - Anime discussion
- `support` - Support/help
- `events` - Site events
- `off-topic` - Off-topic discussion

### 3. Search Posts

**Request:**
```bash
curl -X GET "http://localhost:3000/community/posts?search=favorite+anime&page=1&limit=20"
```

**Response:** Matching posts in title or content

### 4. Get Single Post with Replies

**Request:**
```bash
curl -X GET http://localhost:3000/community/posts/post-id-2
```

**Response:**
```json
{
  "id": "post-id-2",
  "title": "Best Anime of 2024",
  "content": "What's your favorite anime so far?",
  "author": "username",
  "authorId": "550e8400-e29b-41d4-a716-446655440001",
  "category": "anime",
  "views": 29,
  "pinned": false,
  "createdAt": "2024-01-15T09:30:00Z",
  "updatedAt": "2024-01-15T10:15:00Z",
  "replies": [
    {
      "id": "reply-id-1",
      "content": "I really enjoyed Attack on Titan!",
      "author": "firstadmin",
      "authorId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2024-01-15T09:45:00Z",
      "updatedAt": "2024-01-15T09:45:00Z"
    },
    {
      "id": "reply-id-2",
      "content": "JJK is definitely the best this season!",
      "author": "someuser",
      "authorId": "550e8400-e29b-41d4-a716-446655440003",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 5. Create New Post

**Request:**
```bash
curl -X POST http://localhost:3000/community/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -d '{
    "title": "What anime are you watching?",
    "content": "I just finished Demon Slayer and I'm hooked! What are everyone else watching these days?",
    "category": "anime"
  }'
```

**Response (201 Created):**
```json
{
  "id": "post-id-new",
  "title": "What anime are you watching?",
  "content": "I just finished Demon Slayer and I'm hooked! What are everyone else watching these days?",
  "author": "username",
  "category": "anime",
  "views": 0,
  "replies": 0,
  "pinned": false,
  "createdAt": "2024-01-15T16:00:00Z",
  "updatedAt": "2024-01-15T16:00:00Z"
}
```

**Validation Errors:**
```json
{
  "statusCode": 400,
  "message": "Title must be 255 characters or less"
}
```

### 6. Get Post Replies

**Request:**
```bash
curl -X GET http://localhost:3000/community/posts/post-id-2/replies
```

**Response:**
```json
{
  "data": [
    {
      "id": "reply-id-1",
      "content": "I really enjoyed Attack on Titan!",
      "author": "firstadmin",
      "authorId": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2024-01-15T09:45:00Z",
      "updatedAt": "2024-01-15T09:45:00Z"
    }
  ]
}
```

### 7. Add Reply to Post

**Request:**
```bash
curl -X POST http://localhost:3000/community/posts/post-id-2/replies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -d '{
    "content": "I completely agree! The character development is amazing."
  }'
```

**Response (201 Created):**
```json
{
  "id": "reply-id-new",
  "content": "I completely agree! The character development is amazing.",
  "author": "username",
  "createdAt": "2024-01-15T16:05:00Z",
  "updatedAt": "2024-01-15T16:05:00Z"
}
```

### 8. Delete Post (Author or Admin)

**Request:**
```bash
curl -X DELETE http://localhost:3000/community/posts/post-id-2 \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true
}
```

**Error (not author):**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to delete this post"
}
```

### 9. Delete Reply (Author or Admin)

**Request:**
```bash
curl -X DELETE http://localhost:3000/community/replies/reply-id-1 \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true
}
```

## Error Handling

### 401 Unauthorized (Missing Token)
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden (IP Not Whitelisted)
```json
{
  "statusCode": 403,
  "message": "Access denied: Your IP address (192.168.1.50) is not whitelisted for admin access. Please contact your main administrator."
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Post not found"
}
```

### 400 Bad Request (Validation)
```json
{
  "statusCode": 400,
  "message": "Post content is required"
}
```

## JavaScript/TypeScript Client Examples

### Using Fetch API

```typescript
// Create a post
async function createPost(title: string, content: string, category: string) {
  const response = await fetch('http://localhost:3000/community/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ title, content, category })
  });

  if (!response.ok) throw new Error('Failed to create post');
  return response.json();
}

// Get posts
async function getPosts(category?: string, page: number = 1) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: '20'
  });

  if (category) params.append('category', category);

  const response = await fetch(
    `http://localhost:3000/community/posts?${params}`,
    { credentials: 'include' }
  );

  return response.json();
}

// Check if IP whitelisted
async function checkIPAccess() {
  const response = await fetch('http://localhost:3000/admin/my-ip', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log('Your IP:', data.ip);
  }
}
```

## Rate Limiting (if enabled)

- Registration: 3 requests per hour per IP
- Login: 5 requests per 15 minutes per IP
- Community posts: No limit (adjust as needed)
- Admin endpoints: No limit (internal only)

## Testing Checklist

- [ ] First user auto-becomes main_admin
- [ ] First user IP auto-whitelisted
- [ ] Can create forum posts
- [ ] Can filter posts by category
- [ ] Can create replies
- [ ] Can delete own posts/replies
- [ ] Admin can delete any post/reply
- [ ] IP whitelist prevents non-whitelisted access
- [ ] Admin panel accessible only with whitelisted IP
- [ ] Theme consolidation works
