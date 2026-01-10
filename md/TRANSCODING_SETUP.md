# Strelitzia Offline HLS Transcoding System

Complete guide for setting up and running the offline HLS transcoding system for the Strelitzia anime streaming platform.

## Table of Contents

1. [System Overview](#system-overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the Transcoder](#running-the-transcoder)
6. [API Usage](#api-usage)
7. [Monitoring & Logs](#monitoring--logs)
8. [Troubleshooting](#troubleshooting)
9. [Performance Tuning](#performance-tuning)

---

## System Overview

### Architecture

The transcoding system is designed as a distributed offline video processor:

```
Upload File
    ↓
[Backend API] enqueueTranscoding()
    ↓
Redis Queue (transcoding:queue)
    ↓
[Worker Process] worker.ts
    ↓
FFmpeg Processing (HLS generation)
    ↓
Local SSD Storage (/videos/<episode-id>/)
    ↓
Database Updated (filesystem_path)
    ↓
Frontend Streams HLS via Backend API
```

### Key Features

- **Offline-First**: No cloud dependencies, all processing local
- **Multiple Resolutions**: Automatically generates 360p, 480p, 720p, 1080p
- **HLS Adaptive Streaming**: Generates master.m3u8 with multiple bitrate options
- **Deterministic Processing**: Same input produces identical output
- **Error Recovery**: Failed jobs can be retried with detailed logs
- **Job Queue**: Redis-backed queue for reliable job processing
- **Comprehensive Logging**: Per-job logs for debugging

### Resolution Presets

| Resolution | Bitrate | Audio | Use Case |
|---|---|---|---|
| 360p | 800 kbps | 128 kbps | Low bandwidth, mobile |
| 480p | 1500 kbps | 128 kbps | Standard definition |
| 720p | 3500 kbps | 192 kbps | High definition |
| 1080p | 6000 kbps | 192 kbps | Full HD (input dependent) |

---

## Prerequisites

### System Requirements

- **OS**: Debian 13.x (or compatible Linux)
- **CPU**: Quad-core minimum (8+ cores recommended for 4K)
- **RAM**: 8 GB minimum (16+ GB recommended)
- **Storage**: SSD for video output (HDD acceptable for upload staging)
  - Estimate: ~5-8 GB per 1 hour of 1080p video
  - For 100 hours of content: ~500-800 GB
- **Network**: Redis connection (local or remote)

### Software Requirements

```bash
# Core dependencies
- Node.js 18+ (LTS)
- PostgreSQL 12+
- Redis 6+
- FFmpeg 4.4+ (with libx264 and libfdk-aac)

# Check versions
node --version      # v18.x.x or higher
redis-cli --version # >= 6.0
ffmpeg -version     # >= 4.4
psql --version      # >= 12
```

### Debian 13.x Installation

```bash
# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install FFmpeg with codec support
sudo apt-get install -y ffmpeg ffprobe

# Verify FFmpeg codecs
ffmpeg -codecs | grep h264        # Should show libx264
ffmpeg -codecs | grep aac         # Should show aac

# Install Node.js 18+ (via NodeSource)
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Redis
sudo apt-get install -y redis-server

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Verify installations
node -v && npm -v
redis-cli ping        # Should return PONG
psql --version
```

---

## Installation

### 1. Prepare Directories

```bash
# Create storage directories with proper permissions
sudo mkdir -p /videos
sudo mkdir -p /opt/strelitzia/storage
sudo mkdir -p /var/log/strelitzia
sudo mkdir -p /tmp/transcoding-workdir

# Set permissions (assuming 'strelitzia' user)
sudo chown -R strelitzia:strelitzia /videos
sudo chown -R strelitzia:strelitzia /opt/strelitzia/storage
sudo chown -R strelitzia:strelitzia /var/log/strelitzia
sudo chown -R strelitzia:strelitzia /tmp/transcoding-workdir

# Permissions: 755 for directories, allow read/write/execute
sudo chmod -R 755 /videos
sudo chmod -R 755 /opt/strelitzia/storage
sudo chmod -R 755 /var/log/strelitzia
sudo chmod -R 777 /tmp/transcoding-workdir  # Worker needs write access

# Verify
ls -la /videos
ls -la /opt/strelitzia/storage
```

### 2. Install Node Dependencies

```bash
cd /path/to/strelitzia-server/anime/transcoder

# Install dependencies
npm install

# Verify Prisma client is installed
npm ls @prisma/client

# Build TypeScript (if using TypeScript)
npm run build
```

### 3. Configure Environment

Create `.env` file in transcoder directory:

```bash
# .env file for transcoder
NODE_ENV=production

# Redis configuration
REDIS_URL=redis://localhost:6379

# Database (Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/strelitzia

# Storage paths
STORAGE_ROOT=/videos
UPLOADS_PATH=/opt/strelitzia/storage
WORK_DIR=/tmp/transcoding-workdir
LOG_DIR=/var/log/strelitzia

# Optional: Job configuration
MAX_CONCURRENT_JOBS=2
TRANSCODE_TIMEOUT_MS=3600000  # 1 hour timeout
```

### 4. Initialize Database

Ensure migrations are run:

```bash
cd /path/to/strelitzia-server/anime/api

# Run pending migrations
npx prisma migrate deploy

# Verify database schema
npx prisma db push
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | production | Environment mode |
| `REDIS_URL` | redis://localhost:6379 | Redis connection string |
| `DATABASE_URL` | - | PostgreSQL connection string (required) |
| `STORAGE_ROOT` | /videos | Output directory for HLS files |
| `UPLOADS_PATH` | /opt/strelitzia/storage | Input directory for uploaded files |
| `WORK_DIR` | /tmp/transcoding-workdir | Temporary working directory |
| `LOG_DIR` | /var/log/strelitzia | Log file directory |

### Redis Queue Configuration

The transcoder monitors the `transcoding:queue` Redis list:

```
Queue Key: transcoding:queue
Message Format: JSON { jobId, episodeId, uploadId }
Processing: Right-pop (RPOP) - FIFO order
Persistence: Redis RDB persistence (recommended)
```

### FFmpeg Configuration

Presets used by worker:

- **Encoding**: libx264 (H.264 video codec)
- **Audio**: AAC (Advanced Audio Coding)
- **HLS Segment Duration**: 10 seconds
- **Playlist Type**: Event (live-ready, seekable)

### Logging Configuration

Logs are written to two places:

1. **Console**: Real-time worker output
2. **File System**: `/var/log/strelitzia/transcoding-<job-id>.log`

Log files include:
- FFmpeg output and errors
- Job status transitions
- Resolution completion times
- Final success/failure status

---

## Running the Transcoder

### Manual Start (Development)

```bash
cd /path/to/strelitzia-server/anime/transcoder

# Run with TypeScript (requires ts-node)
npm run dev

# Or compile and run with Node
npm run build
npm start
```

### Systemd Service (Production)

Create `/etc/systemd/system/strelitzia-transcoder.service`:

```ini
[Unit]
Description=Strelitzia HLS Transcoder
After=network.target redis-server.service postgresql.service
Wants=redis-server.service postgresql.service

[Service]
Type=simple
User=strelitzia
WorkingDirectory=/path/to/strelitzia-server/anime/transcoder
ExecStart=/usr/bin/node worker.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

# Environment
Environment="NODE_ENV=production"
Environment="REDIS_URL=redis://localhost:6379"
Environment="DATABASE_URL=postgresql://user:password@localhost/strelitzia"
Environment="STORAGE_ROOT=/videos"
Environment="UPLOADS_PATH=/opt/strelitzia/storage"

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
# Enable service to start on boot
sudo systemctl enable strelitzia-transcoder

# Start transcoder
sudo systemctl start strelitzia-transcoder

# Check status
sudo systemctl status strelitzia-transcoder

# View logs
sudo journalctl -u strelitzia-transcoder -f
```

### Docker Container

Use the included Dockerfile:

```bash
cd /path/to/strelitzia-server/anime/transcoder

# Build image
docker build -t strelitzia-transcoder:latest .

# Run container
docker run -d \
  --name strelitzia-transcoder \
  --network strelitzia-net \
  -v /videos:/videos \
  -v /opt/strelitzia/storage:/opt/strelitzia/storage \
  -v /var/log/strelitzia:/var/log/strelitzia \
  -e REDIS_URL=redis://redis:6379 \
  -e DATABASE_URL=postgresql://user:password@postgres:5432/strelitzia \
  strelitzia-transcoder:latest
```

---

## API Usage

### Backend Service Integration

The transcoding service is integrated into the NestJS backend at:
`api/src/modules/transcoding/transcoding.service.ts`

### Enqueue Transcoding Job

**Endpoint**: `POST /api/transcoding/enqueue`

**Request**:
```json
{
  "episodeId": "episode-uuid",
  "uploadId": "upload-uuid"
}
```

**Response**:
```json
{
  "id": "job-uuid",
  "episodeId": "episode-uuid",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Authorization**: Admin/MainAdmin only

**Code Example** (TypeScript):
```typescript
// In videos.controller.ts or service
const job = await transcodingService.enqueueTranscoding(
  userId,
  episodeId,
  uploadId
);
```

### List Transcoding Jobs

**Endpoint**: `GET /api/transcoding/jobs`

**Query Parameters**:
```
?status=pending|running|success|failed
&episodeId=<episode-uuid>
&limit=50&offset=0
```

**Response**:
```json
[
  {
    "id": "job-uuid",
    "episodeId": "episode-uuid",
    "status": "running",
    "startedAt": "2024-01-15T10:30:00Z",
    "createdAt": "2024-01-15T10:25:00Z"
  }
]
```

### Get Job Status

**Endpoint**: `GET /api/transcoding/jobs/{jobId}`

**Response**:
```json
{
  "id": "job-uuid",
  "episodeId": "episode-uuid",
  "status": "running",
  "presetInfo": {
    "resolutions": ["360p", "480p", "720p", "1080p"],
    "outputDir": "/videos/episode-uuid"
  },
  "startedAt": "2024-01-15T10:30:00Z",
  "finishedAt": null,
  "logsText": "..."
}
```

### Get Job Logs

**Endpoint**: `GET /api/transcoding/jobs/{jobId}/logs`

**Response**: Plain text log file

```
Job started at 2024-01-15T10:30:00Z
Video info: 1920x1080, 3600.50s
Transcoding to resolutions: 360p, 480p, 720p, 1080p
[360p] ffmpeg output...
[360p] Completed transcode for 360p
[480p] Starting transcode for 480p
...
Generated master playlist: /videos/episode-uuid/master.m3u8
Job completed successfully
```

### Cancel Job

**Endpoint**: `POST /api/transcoding/jobs/{jobId}/cancel`

**Authorization**: Admin/MainAdmin only

**Response**:
```json
{
  "id": "job-uuid",
  "status": "cancelled",
  "finishedAt": "2024-01-15T10:45:00Z"
}
```

### Retry Failed Job

**Endpoint**: `POST /api/transcoding/jobs/{jobId}/retry`

**Request** (optional):
```json
{
  "uploadId": "new-upload-uuid"
}
```

**Authorization**: Admin/MainAdmin only

### Get Statistics

**Endpoint**: `GET /api/transcoding/stats`

**Response**:
```json
{
  "totalJobs": 1542,
  "statusCounts": {
    "pending": 2,
    "running": 1,
    "success": 1500,
    "failed": 35,
    "cancelled": 4
  },
  "averageDurationMs": 450000,
  "successRate": 97.72
}
```

---

## Monitoring & Logs

### Check Worker Status

```bash
# View real-time logs
sudo journalctl -u strelitzia-transcoder -f

# View last 100 lines
sudo journalctl -u strelitzia-transcoder -n 100

# View errors only
sudo journalctl -u strelitzia-transcoder -p err

# Search for specific job
sudo journalctl -u strelitzia-transcoder | grep "job-uuid"
```

### Check Queue Status

```bash
# Connect to Redis
redis-cli

# Check queue length
> LLEN transcoding:queue

# View next job in queue
> LINDEX transcoding:queue -1

# Check Redis memory
> INFO stats
```

### Monitor Disk Usage

```bash
# Check storage size
du -sh /videos
du -sh /opt/strelitzia/storage
df -h /videos

# Find largest episodes
du -sh /videos/* | sort -rh | head -20

# Check free space
df -h /
```

### Database Monitoring

```bash
# Count jobs by status
psql -c "SELECT status, COUNT(*) FROM \"TranscodingJob\" GROUP BY status;"

# Find slow jobs (>30 minutes)
psql -c "SELECT id, \"episodeId\", 
  EXTRACT(EPOCH FROM (\"finishedAt\" - \"startedAt\")) AS duration_sec
  FROM \"TranscodingJob\"
  WHERE \"finishedAt\" IS NOT NULL
  AND EXTRACT(EPOCH FROM (\"finishedAt\" - \"startedAt\")) > 1800
  ORDER BY duration_sec DESC LIMIT 20;"

# Find failed jobs
psql -c "SELECT id, \"episodeId\", \"logsText\" 
  FROM \"TranscodingJob\" 
  WHERE status = 'failed' 
  ORDER BY \"createdAt\" DESC LIMIT 10;"
```

---

## Troubleshooting

### Worker Won't Start

**Symptoms**: Process exits immediately

**Solutions**:
```bash
# 1. Check Redis connection
redis-cli ping  # Should return PONG

# 2. Check database connection
psql -c "SELECT 1"

# 3. Check environment variables
env | grep -E "REDIS|DATABASE|STORAGE"

# 4. Verify file permissions
ls -la /videos
ls -la /var/log/strelitzia

# 5. Check Node version
node --version  # Must be >= 18
```

### FFmpeg Not Found

**Symptoms**: "Failed to probe video: spawn ffmpeg ENOENT"

**Solutions**:
```bash
# Install FFmpeg
sudo apt-get install -y ffmpeg ffprobe

# Verify installation
which ffmpeg
ffmpeg -version

# Update PATH if needed
export PATH=$PATH:/usr/bin
```

### Out of Disk Space

**Symptoms**: "ENOSPC: no space left on device"

**Solutions**:
```bash
# Check disk usage
df -h

# Clean old logs
sudo rm /var/log/strelitzia/transcoding-*.log

# Cleanup service
sudo systemctl stop strelitzia-transcoder
sudo rm -rf /tmp/transcoding-workdir/*
sudo systemctl start strelitzia-transcoder

# Free up space
# Option 1: Delete old episodes
# Option 2: Compress old episodes to archive storage
# Option 3: Add more storage
```

### Jobs Stuck in Running

**Symptoms**: Jobs never complete, database shows running but worker idle

**Solutions**:
```bash
# Check worker process
ps aux | grep "node worker"

# Restart worker gracefully
sudo systemctl restart strelitzia-transcoder

# Force cancel stuck job (in database)
psql -c "UPDATE \"TranscodingJob\" SET status = 'failed' WHERE status = 'running' AND \"startedAt\" < NOW() - INTERVAL '2 hours';"
```

### High Memory Usage

**Symptoms**: Worker uses 2+ GB RAM, system slows down

**Solutions**:
```bash
# Check memory
free -h

# Reduce concurrent jobs
# Edit transcoder config to process 1 job at a time
MAX_CONCURRENT_JOBS=1

# Restart
sudo systemctl restart strelitzia-transcoder

# Monitor
watch -n 1 'ps aux | grep node'
```

### Video Quality Issues

**Symptoms**: Output video looks pixelated or has artifacts

**Solutions**:
1. Increase bitrate presets (edit worker.ts RESOLUTIONS)
2. Use faster FFmpeg preset: -preset fast → -preset slower
3. Check input video quality (ffprobe input.mp4)
4. Verify FFmpeg codec: ffmpeg -codecs | grep h264

### Redis Queue Growing

**Symptoms**: Jobs not being processed, queue size increases

**Solutions**:
```bash
# Check queue size
redis-cli LLEN transcoding:queue

# Check if worker is running
systemctl status strelitzia-transcoder

# Check worker logs
sudo journalctl -u strelitzia-transcoder -n 50 -p err

# Restart worker
sudo systemctl restart strelitzia-transcoder

# Clear queue if needed (careful!)
redis-cli DEL transcoding:queue
```

---

## Performance Tuning

### CPU Optimization

```bash
# Check CPU cores
nproc

# FFmpeg preset options (slower = better quality, more CPU):
# ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow

# For real-time: use "fast" preset
# For archive: use "slower" preset
```

### Hardware Acceleration

For systems with compatible GPUs:

```bash
# Check for NVIDIA GPU support
nvidia-smi

# Use NVIDIA hardware encoding (experimental)
# Replace -c:v libx264 with -c:v h264_nvenc

# Check for Intel Quick Sync
# Use -c:v h264_qsv for Intel systems
```

### Queue Management

```bash
# Process jobs sequentially (safe, stable)
# One job at a time, restart when complete

# Process jobs in batches
# Process 2-4 jobs concurrently if RAM allows
# Requires worker process management

# Distribute jobs across multiple workers
# Run transcoder on multiple machines
# All connecting to same Redis queue
```

### Storage Optimization

```bash
# Move old videos to archive storage
tar -czf episode-archive-$(date +%Y%m).tar.gz /videos/old-episodes
mv episode-archive-*.tar.gz /archive-storage

# Use symlinks for archive access
ln -s /archive-storage/episode-archive.tar.gz /videos/

# Compress HLS segments (if needed)
gzip /videos/*/360p/*.ts  # Not recommended - breaks streaming
```

---

## Appendix: HLS Protocol Overview

### Master Playlist (master.m3u8)

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
480p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1280x720
720p/playlist.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080
1080p/playlist.m3u8
```

### Resolution Playlist (360p/playlist.m3u8)

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:10.0,
segment_000.ts
#EXTINF:10.0,
segment_001.ts
#EXTINF:10.0,
segment_002.ts
```

### Segment Format

- Format: MPEG-TS (Transport Stream)
- Duration: 10 seconds per segment
- Codec: H.264 video, AAC audio
- Bitrate: Varies by resolution
- Seekable: Yes (within segment accuracy)

---

## Summary

The Strelitzia offline transcoding system provides:

✅ **Local Processing**: All processing stays on-premises  
✅ **Scalable**: Queue-based architecture supports multiple workers  
✅ **Reliable**: Job persistence in database, error recovery  
✅ **Observable**: Comprehensive logging and monitoring  
✅ **Performant**: Hardware-optimized FFmpeg settings  
✅ **Maintainable**: Well-documented, standardized configuration  

For production deployments, follow the systemd service approach and monitor queue/logs regularly.
