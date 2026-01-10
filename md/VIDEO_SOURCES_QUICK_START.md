# Video Source Configuration System - Quick Start Guide

## For Users: Initial Setup

When you first visit the website, you'll see the setup page at `/setup`. Follow these steps:

### Step 1: Understand Video Sources
A "video source" is a directory on your server where video files are stored. You can have:
- Multiple local directories
- Network drives (NAS)
- Different SSDs on the same machine

### Step 2: Access Admin Panel
Click the "Go to Admin Panel" button on the setup page. You need main admin access.

### Step 3: Add a Video Source
In the admin panel:
1. Enter source name (e.g., "Main Videos", "Extra Content")
2. Enter directory path (e.g., `/videos`, `/mnt/nas/anime`)
3. Select type (Local Drive or Network/NAS)
4. Set priority number (lower = scanned first)
5. Click "Test Directory" to verify it exists and count videos
6. Click "Add Source" to save

### Step 4: Configure Multiple Sources (Optional)
Repeat Step 3 for each video directory you want to add.

### Step 5: Verify
Once sources are added, the website will automatically:
- Redirect from `/setup` to home page
- Display videos from all configured sources
- Scan sources in priority order

---

## For Developers: API Reference

### Check Configuration Status
```
GET /api/admin/video-sources/status/check

Response:
{
  "success": true,
  "configured": true,
  "sourceCount": 2,
  "activeSourceCount": 2,
  "message": "2 video source(s) configured"
}
```

### Get All Sources
```
GET /api/admin/video-sources

Response:
{
  "success": true,
  "sources": [
    {
      "id": "uuid-here",
      "name": "Main Videos",
      "path": "/videos",
      "type": "local",
      "isActive": true,
      "priority": 0,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Active Sources Only
```
GET /api/admin/video-sources/active
```

### Add New Source
```
POST /api/admin/video-sources

Body:
{
  "name": "Main Videos",
  "path": "/home/videos",
  "type": "local",
  "priority": 0
}

Response:
{
  "success": true,
  "source": { ... },
  "message": "Video source added successfully"
}
```

### Test Directory Accessibility
```
POST /api/admin/video-sources/test-directory

Body:
{
  "path": "/mnt/nas/anime"
}

Response:
{
  "success": true,
  "accessible": true,
  "videoCount": 42,
  "message": "Directory is accessible and contains 42 video files"
}
```

### Update Source
```
PUT /api/admin/video-sources/{id}

Body:
{
  "name": "Updated Name",
  "priority": 1,
  "isActive": false
}
```

### Delete Source
```
DELETE /api/admin/video-sources/{id}
```

### Reorder Sources
```
PUT /api/admin/video-sources/reorder/all

Body:
{
  "sourceIds": ["id1", "id2", "id3"]
}
```

---

## Directory Path Examples

### Linux
```
/home/user/videos
/mnt/nas/anime
/media/external/shows
/var/media/content
```

### Windows (WSL or Direct)
```
/mnt/d/Videos
/mnt/e/Anime
C:\Users\User\Videos (in Windows)
```

### Docker Volumes
```
/videos
/mounted/nas
/external/drives
```

### Network Storage
```
/mnt/nas
/media/network
/shared/videos
```

---

## Important Notes

### Priority System
- **Lower priority = scanned first**
- If two sources have video with same name, the one with lower priority is used
- Default priority is 0
- Supports negative numbers for very high priority

### File Formats Supported
The system detects and reads these video formats:
- MP4 (.mp4)
- Matroska (.mkv)
- AVI (.avi)
- MOV (.mov)
- FLV (.flv)
- WebM (.webm)
- MPEG-4 (.m4v)
- 3GP (.3gp)
- Ogg Video (.ogv)

### Source Types
- **Local**: Files on the same server (fast access)
- **Network**: NAS or network drives (slower, but flexible)

### When Sources Change
- Videos are discovered automatically
- Deleted files don't show up anymore
- New files appear after the next refresh
- No manual rescan needed

---

## Troubleshooting

### "Directory is not accessible"
- Check the path is correct
- Verify the directory exists
- Check file permissions (API process needs read access)
- Ensure path uses forward slashes (/)

### "No videos found in directory"
- Verify video files are in the directory
- Check file extensions match supported formats
- Ensure videos aren't in nested folders (we scan top level only)

### Videos not appearing on website
- Check source is enabled (not disabled)
- Verify source has lower priority than disabled ones
- Test directory accessibility from admin panel
- Check API logs for errors

### Need to change a source later
- Click the source card to expand it
- Click the toggle button to enable/disable
- Click delete to remove and re-add
- Click edit to change properties

---

## Best Practices

### Organization
1. **Group by type**: Separate anime, movies, series
2. **Use meaningful names**: "2024 Anime", "Popular Series"
3. **Set priorities**: Main content first, extras last
4. **Monitor storage**: Disable sources when storage issues occur

### Performance
1. **Limit sources**: 5-10 is optimal, 20+ may slow down scanning
2. **Use SSDs**: Local fast drives have better performance
3. **Network drives**: Only for secondary sources
4. **Check regularly**: Monitor source health and accessibility

### Security
1. **Restrict paths**: Only add directories you want to share
2. **File permissions**: Ensure API process can read files
3. **Admin only**: Only main admin can manage sources
4. **Audit logs**: Check admin action logs regularly

---

## Integration in Your Code

### In Your Video Service
```typescript
// Instead of reading from hardcoded path
// Use VideoSourcesService to get all active sources
const videos = await this.videoSourcesService.getVideosFromAllSources();
```

### In Your Setup Page/Middleware
```typescript
// Check if configured before showing videos
const status = await fetch('/api/admin/video-sources/status/check');
const data = await status.json();

if (!data.configured) {
  redirect('/setup');
}
```

### In Your Admin Dashboard
```typescript
// Import and use the component
import VideoSourcesAdmin from '@/components/admin/VideoSourcesAdmin';

// In your admin page
<VideoSourcesAdmin />
```

---

## Common Workflows

### Add External SSD for More Content
1. Mount the SSD to your server
2. Go to `/admin/video-sources`
3. Enter: name="Extra Videos", path="/mnt/ssd/videos"
4. Click Test Directory to verify
5. Click Add Source
6. Videos from SSD appear immediately

### Disable Source Without Deleting
1. Find the source in admin panel
2. Click the toggle button (yellow) to disable
3. Videos from this source disappear
4. Click toggle again to re-enable anytime

### Change Priority Order
1. Get all sources: `GET /api/admin/video-sources`
2. Note the IDs
3. Call: `PUT /api/admin/video-sources/reorder/all` with new ID order
4. Sources are now scanned in new priority order

### Check If System is Configured
```typescript
const response = await fetch('/api/admin/video-sources/status/check');
const { configured } = await response.json();

if (!configured) {
  // Show setup page
} else {
  // Show videos
}
```

---

## Support & Resources

- **Setup Page**: `/setup` - Auto-shows if unconfigured
- **Admin Panel**: `/admin/video-sources` - Main admin only
- **Status Check**: `/api/admin/video-sources/status/check`
- **Implementation Guide**: See `VIDEO_SOURCES_IMPLEMENTATION.md`

---

**Status**: System ready to use  
**Last Updated**: After anime-themed security expansion  
**Requires**: Database migration to be run
