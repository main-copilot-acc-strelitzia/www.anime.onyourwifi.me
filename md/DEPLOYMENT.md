# Deployment Guide - Strelitzia

Complete guide for deploying Strelitzia on Windows, macOS, and Linux servers.

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18.17.0+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Redis 6.0+ installed and running
- [ ] Domain name configured
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] `.env` files configured with production values
- [ ] Database backed up
- [ ] All dependencies updated and tested locally

## 🪟 Windows Server Deployment

### 1. Install Prerequisites

```powershell
# Install Node.js 18.17.0+
# Download from https://nodejs.org/

# Install PostgreSQL
# Download from https://www.postgresql.org/download/windows/

# Install Redis
# Option A: Download from https://github.com/microsoftarchive/redis/releases
# Option B: Use Windows Subsystem for Linux (WSL2)
```

### 2. Clone Repository

```powershell
cd C:\projects
git clone <your-repo-url>
cd anime
```

### 3. Install Dependencies

```powershell
npm run setup
```

### 4. Configure Environment

Edit `api\.env`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/strelitzia"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="very-long-random-string-here"
CORS_ORIGIN="https://your-domain.com"
```

Edit `web\.env.local`:
```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com
```

### 5. Build

```powershell
npm run build
```

### 6. Setup Services

Using NSSM (Non-Sucking Service Manager):
```powershell
# Download from https://nssm.cc/download

# Install API service
nssm install strelitzia-api "C:\nodejs\node.exe" "C:\projects\anime\node_modules\.bin\nestjs" "start"
nssm set strelitzia-api AppDirectory "C:\projects\anime\api"
nssm set strelitzia-api AppEnvironmentExtra NODE_ENV=production PORT=3001
nssm start strelitzia-api

# Install Web service
nssm install strelitzia-web "C:\nodejs\node.exe" "C:\projects\anime\web\server.js"
nssm set strelitzia-web AppDirectory "C:\projects\anime\web"
nssm set strelitzia-web AppEnvironmentExtra NODE_ENV=production
nssm start strelitzia-web
```

### 7. Configure IIS or Nginx

**Using IIS:**
- Create new website pointing to `web\.next\standalone`
- Enable URL rewrite with reverse proxy to Node.js servers
- Bind SSL certificate

**Using Nginx:**
See Linux section below (similar configuration)

## 🍎 macOS Server Deployment

### 1. Install Prerequisites

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install PostgreSQL
brew install postgresql

# Install Redis
brew install redis
```

### 2. Clone Repository

```bash
cd ~/projects
git clone <your-repo-url>
cd anime
```

### 3. Install Dependencies

```bash
npm run setup
```

### 4. Configure Environment

```bash
nano api/.env
nano web/.env.local
```

### 5. Build

```bash
npm run build
```

### 6. Setup Services with Launchd

Create `~/Library/LaunchAgents/com.strelitzia.api.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.strelitzia.api</string>
    <key>Program</key>
    <string>/usr/local/bin/node</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/username/projects/anime/api/dist/main.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/username/projects/anime/api</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
        <key>PORT</key>
        <string>3001</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Load service:
```bash
launchctl load ~/Library/LaunchAgents/com.strelitzia.api.plist
```

### 7. Setup Nginx

```bash
brew install nginx
```

Configure `/usr/local/etc/nginx/nginx.conf`:
```nginx
http {
    upstream api {
        server localhost:3001;
    }
    
    upstream web {
        server localhost:3000;
    }
    
    server {
        listen 80;
        server_name your-domain.com;
        
        location /api {
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        location / {
            proxy_pass http://web;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

## 🐧 Linux Server Deployment

### 1. Install Prerequisites

**Ubuntu/Debian:**
```bash
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Install Redis
sudo apt-get install -y redis-server

# Install Nginx
sudo apt-get install -y nginx
```

**CentOS/RHEL:**
```bash
sudo yum update -y

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib

# Install Redis
sudo yum install -y redis

# Install Nginx
sudo yum install -y nginx
```

### 2. Clone Repository

```bash
cd /opt
sudo git clone <your-repo-url>
sudo chown -R $USER:$USER anime
cd anime
```

### 3. Install Dependencies

```bash
npm run setup
```

### 4. Configure Environment

```bash
sudo nano api/.env
sudo nano web/.env.local
```

### 5. Build

```bash
npm run build
```

### 6. Setup Systemd Services

Create `/etc/systemd/system/strelitzia-api.service`:
```ini
[Unit]
Description=Strelitzia API Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=strelitzia
WorkingDirectory=/opt/anime/api
ExecStart=/usr/bin/node dist/main.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
Environment="PORT=3001"

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/strelitzia-web.service`:
```ini
[Unit]
Description=Strelitzia Web Server
After=network.target strelitzia-api.service

[Service]
Type=simple
User=strelitzia
WorkingDirectory=/opt/anime/web
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"

[Install]
WantedBy=multi-user.target
```

Enable and start services:
```bash
sudo systemctl daemon-reload
sudo systemctl enable strelitzia-api
sudo systemctl enable strelitzia-web
sudo systemctl start strelitzia-api
sudo systemctl start strelitzia-web
```

### 7. Configure Nginx Reverse Proxy

Create `/etc/nginx/sites-available/strelitzia`:
```nginx
upstream api {
    server localhost:3001;
}

upstream web {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API proxy
    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Web proxy
    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/strelitzia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 8. Setup SSL Certificate (Let's Encrypt)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com
```

## 🗄️ Database Setup

### Create Database

```bash
# For all platforms, connect to PostgreSQL:
psql -U postgres

# Then run:
CREATE DATABASE strelitzia;
CREATE USER strelitzia_user WITH PASSWORD 'secure_password';
ALTER ROLE strelitzia_user WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE strelitzia TO strelitzia_user;
```

### Run Migrations

```bash
npm run migrate:deploy
```

## 📊 Monitoring & Logs

### Check Service Status

**Linux:**
```bash
sudo systemctl status strelitzia-api
sudo systemctl status strelitzia-web
sudo journalctl -u strelitzia-api -f
```

**macOS:**
```bash
launchctl list | grep strelitzia
log stream --predicate 'process == "node"'
```

**Windows:**
```powershell
nssm status strelitzia-api
nssm status strelitzia-web
```

### View Logs

```bash
# API logs
tail -f api/logs/error.log

# Web logs
tail -f web/logs/error.log

# Combined
journalctl -u strelitzia-api -u strelitzia-web -f
```

## 🔧 Troubleshooting

### Service won't start
1. Check logs: `journalctl -u strelitzia-api -n 50`
2. Verify environment variables
3. Check port availability: `sudo netstat -tlnp | grep :3001`
4. Check database connection

### High CPU/Memory usage
1. Monitor with `top` or `htop`
2. Check for memory leaks
3. Restart service: `sudo systemctl restart strelitzia-api`

### Database connection errors
1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Test connection: `psql -U user -h localhost -d strelitzia`

## 📈 Scaling

### Load Balancing

For multiple servers, use Nginx load balancing:
```nginx
upstream api_backend {
    server api1.internal:3001;
    server api2.internal:3001;
    server api3.internal:3001;
}

server {
    location /api {
        proxy_pass http://api_backend;
    }
}
```

### Database Replication

Use PostgreSQL replication for high availability:
- Setup primary-replica configuration
- Use connection pooling (pgBouncer)
- Implement automated backups

### Caching

Configure Redis cluster for distributed caching:
- Setup Redis sentinel for failover
- Use Redis cluster for horizontal scaling
- Monitor memory usage

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Enable firewall on server
- [ ] Configure SSH key authentication only
- [ ] Setup fail2ban for intrusion prevention
- [ ] Enable HTTPS with valid certificate
- [ ] Configure regular backups
- [ ] Setup monitoring and alerting
- [ ] Implement DDoS protection
- [ ] Regular security audits
- [ ] Keep dependencies updated

## 📞 Support

For deployment issues, check:
- Application logs
- System logs
- Database status
- Network connectivity
- Firewall rules
- SSL certificate validity

---

**Last Updated:** January 4, 2026
**Version:** 0.2.0
