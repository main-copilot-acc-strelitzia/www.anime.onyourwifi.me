# Strelitzia - Debian Trixie Installation Guide (Native, No Docker)

Complete step-by-step guide for installing and running Strelitzia on Debian Trixie without Docker.

## ✅ Prerequisites

### System Requirements
- **OS**: Debian Trixie (testing branch)
- **RAM**: 2GB minimum (4GB+ recommended)
- **Storage**: 20GB for application + space for videos
- **Processor**: 2+ cores

### Required Software
- Node.js 18.17.0 or higher
- npm 9.0.0 or higher
- PostgreSQL 14+
- Redis 6.0+ (optional, for caching)
- Git (optional, for version control)

---

## Step 1: Install System Dependencies

Update package list and install prerequisites:

```bash
sudo apt-get update
sudo apt-get upgrade -y

# Install build tools and required libraries
sudo apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    python3 \
    ffmpeg \
    imagemagick
```

---

## Step 2: Install Node.js 18

Install Node.js 18.x from NodeSource repository:

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 3: Install PostgreSQL 14

Install and configure PostgreSQL database:

```bash
# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify PostgreSQL is running
sudo systemctl status postgresql
```

### Create Database and User

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE animestream;
CREATE USER akaza WITH PASSWORD 'yourboiakaza';
ALTER ROLE akaza SET client_encoding TO 'utf8';
ALTER ROLE akaza SET default_transaction_isolation TO 'read committed';
ALTER ROLE akaza SET default_transaction_deferrable TO on;
ALTER ROLE akaza SET default_timeZone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE animestream TO akaza;
\q
```

Verify connection:
```bash
psql -U akaza -d animestream -h localhost
\q
```

---

## Step 4: Install Redis (Optional)

For caching and session management:

```bash
sudo apt-get install -y redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping  # Should return PONG
```

---

## Step 5: Clone and Setup Project

```bash
# Create application directory
sudo mkdir -p /opt/strelitzia-server
sudo chown $USER:$USER /opt/strelitzia-server
cd /opt/strelitzia-server

# Clone repository (replace with your repo URL)
git clone <your-repository-url> anime
cd anime

# Copy environment files
cp .env.example .env
cp api/.env.example api/.env
cp web/.env.example web/.env.local
```

---

## Step 6: Configure Environment Files

### API Configuration (api/.env)

Edit `api/.env`:

```bash
# Database - PostgreSQL on localhost
DATABASE_URL="postgresql://akaza:yourboiakaza@localhost:5432/animestream"

# Alternative: Remote database
# DATABASE_URL="postgresql://akaza:yourboiakaza@remote-host:5432/animestream"

# Server configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=yourboiakaza
JWT_EXPIRATION=7d

# API settings
API_URL=http://localhost:3001
WEB_URL=http://localhost:3000

# Transcoding (optional)
TRANSCODER_ENABLED=true
VIDEO_QUALITY=medium

# Redis (optional, leave blank if not using)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
```

### Web Configuration (web/.env.local)

Edit `web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=Strelitzia
NEXT_PUBLIC_THEME=dark
```

---

## Step 7: Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all

# Or manually install each:
cd api && npm install && cd ..
cd web && npm install && cd ..
cd transcoder && npm install && cd ..
```

---

## Step 8: Initialize Database

Generate Prisma Client and run migrations:

```bash
# From root directory
cd api

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run migrate:dev

# Or specific migration
npm run migrate -- --name initial_schema

# Verify with Prisma Studio (optional)
npm run studio
```

The database now has all tables including:
- VideoSource (for multi-source video management)
- User (authentication)
- AdminIPWhitelist (security)
- CommunityPost (forums)
- And others

---

## Step 9: Verify Installation

### Test API Server

```bash
# From root, start API
npm run dev:api

# In another terminal, test endpoint
curl http://localhost:3001/api/health

# Should return: {"status":"ok"}
```

### Test Web Frontend

```bash
# From root, start web server
npm run dev:web

# Visit in browser: http://localhost:3000
# Should see Strelitzia home page (or setup page if no videos configured)
```

### Test Both Together

```bash
# From root directory, start everything
npm run dev

# API: http://localhost:3001
# Web: http://localhost:3000
```

---

## Step 10: Configure Video Sources

Video sources let you stream videos from multiple directories/drives.

### Via Setup Page (First Time)

1. Navigate to http://localhost:3000
2. You'll see setup page (since no videos configured)
3. Click "Go to Admin Panel"
4. Add first video source:
   - **Name**: My Videos
   - **Path**: /mnt/videos (or your video directory)
   - **Type**: local
   - **Priority**: 1
5. Click "Add Source" and test directory
6. Page will auto-redirect when configured

### Via Admin Dashboard

1. Go to http://localhost:3000/admin
2. Click "Video Sources" section
3. Add/edit/delete sources
4. Toggle enable/disable
5. Reorder by priority

### Directory Path Examples

**Local storage:**
```
/home/user/Videos
/mnt/data/anime
/opt/videos
```

**External SSD/Drive:**
```
/mnt/external_ssd
/mnt/usb_drive
```

**Network storage (NFS):**
```
/mnt/nfs/videos
```

**Network storage (Samba):**
Mount first:
```bash
sudo mount -t cifs //nas-ip/share /mnt/nas -o username=user,password=pass
```
Then add: `/mnt/nas`

---

## Step 10.5: Production Setup (Systemd Services)

### Create systemd Service for API

Create `/etc/systemd/system/strelitzia-api.service`:

```bash
sudo nano /etc/systemd/system/strelitzia-api.service
```

Paste:

```ini
[Unit]
Description=Strelitzia API Service
After=network.target postgresql.service

[Service]
Type=simple
User=animestream
WorkingDirectory=/opt/strelitzia-server/anime
ExecStart=/usr/bin/npm start --workspace=api
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3001"
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Create systemd Service for Web

Create `/etc/systemd/system/strelitzia-web.service`:

```bash
sudo nano /etc/systemd/system/strelitzia-web.service
```

Paste:

```ini
[Unit]
Description=Strelitzia Web Service
After=network.target

[Service]
Type=simple
User=animestream
WorkingDirectory=/opt/strelitzia-server/anime
ExecStart=/usr/bin/npm start --workspace=web
Restart=always
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3000"
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable strelitzia-api
sudo systemctl enable strelitzia-web

# Start services
sudo systemctl start strelitzia-api
sudo systemctl start strelitzia-web

# Check status
sudo systemctl status strelitzia-api
sudo systemctl status strelitzia-web

# View logs
sudo journalctl -u strelitzia-api -f
sudo journalctl -u strelitzia-web -f
```

---

## Step 11: Configure Nginx (Reverse Proxy)

### Install Nginx

```bash
sudo apt-get install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Create Nginx Configuration

Create `/etc/nginx/sites-available/strelitzia`:

```bash
sudo nano /etc/nginx/sites-available/strelitzia
```

Paste:

```nginx
upstream api {
    server localhost:3001;
}

upstream web {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # API endpoints
    location /api/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Web application
    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Enable Configuration

```bash
sudo ln -s /etc/nginx/sites-available/strelitzia /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

---

## Step 12: SSL/HTTPS with Let's Encrypt

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Create Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

Certbot will automatically update Nginx configuration for HTTPS.

### Auto-renewal

Certbot auto-renewal is enabled by default. Verify:

```bash
sudo systemctl status certbot.timer
sudo certbot renew --dry-run
```

---

## Firewall Configuration (Optional)

### Using UFW (Uncomplicated Firewall)

```bash
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check rules
sudo ufw status numbered
```

---

## Common Tasks

### Start Everything in Development

```bash
cd /opt/strelitzia-server/anime
npm run dev
```

### Start Individual Services

```bash
npm run dev:api        # API only
npm run dev:web        # Web only
npm run dev:transcoder # Transcoder only
```

### View Database

```bash
npm run studio  # Opens Prisma Studio at http://localhost:5555
```

### Backup Database

```bash
pg_dump -U animeuser -d animestream > backup-$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U animeuser -d animestream < backup-20240105.sql
```

### Check Service Logs

```bash
# API logs
sudo journalctl -u strelitzia-api -n 50 --follow

# Web logs
sudo journalctl -u strelitzia-web -n 50 --follow

# All services
sudo journalctl -u strelitzia* --follow
```

### Restart Services

```bash
sudo systemctl restart strelitzia-api
sudo systemctl restart strelitzia-web
sudo systemctl restart strelitzia-api strelitzia-web
```

### Monitor System

```bash
# System resources
htop

# Nginx status
sudo systemctl status nginx

# PostgreSQL status
sudo systemctl status postgresql

# Redis status
sudo systemctl status redis-server

# Check ports
sudo ss -tlnp | grep -E ':(3000|3001|5432|6379|80|443)'
```

---

## Troubleshooting

### PostgreSQL Connection Error

**Error:** `FATAL: Ident authentication failed for user "animeuser"`

**Solution:**
```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Change this line:
# local   all             all                                     ident

# To this:
# local   all             all                                     md5

sudo systemctl restart postgresql
```

### Node Version Mismatch

**Error:** `npm ERR! The engine "node" is incompatible`

**Solution:**
```bash
# Check version
node --version

# If not 18.x, install correct version
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find process using port
sudo lsof -i :3001

# Kill process
sudo kill -9 <PID>

# Or change port in .env
PORT=3002
```

### Permission Denied

**Error:** `EACCES: permission denied, open '/opt/strelitzia-server/anime/...`

**Solution:**
```bash
sudo chown -R $USER:$USER /opt/strelitzia-server
chmod -R 755 /opt/strelitzia-server
```

### Redis Connection Failed

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:6379`

**Solution:**
```bash
# Start Redis if not running
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Or disable Redis in .env
REDIS_URL=
```

### FFmpeg Not Found

**Error:** `FFmpeg not found in system PATH`

**Solution:**
```bash
sudo apt-get install -y ffmpeg
which ffmpeg  # Should show path
```

---

## Security Recommendations

1. **Change default passwords**
   - JWT_SECRET in api/.env
   - PostgreSQL user password
   - Redis password (if exposed)

2. **Use strong database password**
   - Minimum 16 characters
   - Mix of uppercase, lowercase, numbers, symbols

3. **Enable firewall**
   - Restrict SSH access
   - Only expose 80 (HTTP) and 443 (HTTPS)

4. **Regular backups**
   - Daily database backups
   - Test restore procedures

5. **Keep system updated**
   - Regular `apt-get upgrade`
   - Update Node.js and npm

6. **Use SSL/HTTPS**
   - Always use Let's Encrypt
   - Force HTTPS redirects

---

## Performance Notes

**System Specifications** (Debian Trixie):
- **2GB RAM**: Handles 5-10 concurrent streams
- **4GB RAM**: Handles 20-30 concurrent streams
- **8GB+ RAM**: Handles 50+ concurrent streams

**Optimization Tips**:
- Use SSD for database (20-30x faster than HDD)
- Use Redis for caching
- Monitor with `htop` and `iotop`
- Tune PostgreSQL for your hardware

---

## Updating to New Version

```bash
cd /opt/strelitzia-server/anime

# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Migrate database if needed
npm run migrate

# Restart services
sudo systemctl restart strelitzia-api strelitzia-web

# Check status
sudo systemctl status strelitzia-api strelitzia-web
```

---

## Getting Help

1. **Check logs first**
   ```bash
   sudo journalctl -u strelitzia-api --since "1 hour ago"
   ```

2. **Check PostgreSQL**
   ```bash
   psql -U animeuser -d animestream -c "SELECT * FROM pg_tables WHERE schemaname='public';"
   ```

3. **Verify services running**
   ```bash
   ps aux | grep -E "node|npm"
   ```

4. **Common errors in documentation:**
   - See "Troubleshooting" section above
   - Check README.md for additional help

---

**Installation Complete!** 🎉

Your Strelitzia instance should now be running on http://localhost:3000 (or https://your-domain.com in production).

Next steps:
1. Add video sources in admin panel
2. Start streaming
3. Configure advanced features as needed
