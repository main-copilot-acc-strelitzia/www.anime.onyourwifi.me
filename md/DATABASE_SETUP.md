# Database Setup Guide - PostgreSQL with Prisma

## Overview

Strelitzia Backend uses **PostgreSQL** as the primary database with **Prisma ORM** for database access and migrations.

**Important:** All database access is **localhost-only** for security. Remote connections are disabled.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 16+ and npm/yarn
- Prisma CLI: `npm install -g @prisma/cli`

## Installation

### 1. Install PostgreSQL

**Windows:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql
```

### 2. Start PostgreSQL Service

**Windows:**
```powershell
# PostgreSQL should start automatically after installation
# Verify: Services > postgres service
```

**Linux:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew services start postgresql
```

### 3. Create Database and User

Open PostgreSQL interactive terminal:

```bash
psql -U postgres
```

Execute these SQL commands:

```sql
-- Create database
CREATE DATABASE strelitzia;

-- Create user
CREATE USER strelitzia_user WITH PASSWORD 'your-secure-password-here';

-- Grant privileges
ALTER ROLE strelitzia_user SET client_encoding TO 'utf8';
ALTER ROLE strelitzia_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE strelitzia_user SET default_transaction_deferrable TO on;
ALTER ROLE strelitzia_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE strelitzia TO strelitzia_user;

-- Exit
\q
```

## Configuration

### 1. Environment Variables

Create `.env` file in the `api/` directory:

```env
# Database
DATABASE_URL="postgresql://strelitzia_user:your-secure-password-here@localhost:5432/strelitzia"

# JWT
JWT_PRIVATE_KEY="your-jwt-private-key-here"
JWT_PUBLIC_KEY="your-jwt-public-key-here"

# Storage
STORAGE_PATH="/opt/strelitzia/storage"

# Redis
REDIS_URL="redis://localhost:6379"

# Node environment
NODE_ENV="development"
```

### 2. Generate JWT Keys (Optional)

If you need to generate new JWT keys:

```bash
# Using OpenSSL (Linux/macOS/WSL)
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Convert to base64 for use in environment
cat private.pem | base64
cat public.pem | base64
```

Or use online tools like jwt.io to generate a test key.

## Database Initialization

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Run Prisma Migrations

Initialize the database with the schema:

```bash
# Generate migration from schema
npx prisma migrate dev --name init

# Or reset database (development only!)
npx prisma migrate reset
```

### 3. Verify Setup

Check that tables were created:

```bash
psql -U strelitzia_user -d strelitzia -c "\dt"
```

You should see tables:
- users
- refresh_tokens
- videos
- episodes
- watch_history
- transcoding_jobs
- upload_metrics
- audit_logs

## Development Workflow

### View Database in Prisma Studio

```bash
cd api
npx prisma studio
```

This opens a web UI at `http://localhost:5555` for database inspection.

### Generate TypeScript Types

After schema changes:

```bash
npx prisma generate
```

### Create Migration

After modifying `schema.prisma`:

```bash
npx prisma migrate dev --name <description>
```

Example:
```bash
npx prisma migrate dev --name add_user_status_field
```

### Reset Database (Development Only)

⚠️ **Warning:** This deletes all data!

```bash
npx prisma migrate reset
```

## Production Database Setup

### 1. Use Managed PostgreSQL Service

Recommended options:
- AWS RDS PostgreSQL
- Digital Ocean Managed Postgres
- Azure Database for PostgreSQL
- Google Cloud SQL

### 2. Connection String

Update `DATABASE_URL` in production environment:

```env
DATABASE_URL="postgresql://username:password@hostname:5432/strelitzia"
```

### 3. SSL Connection

For managed databases, enable SSL:

```env
DATABASE_URL="postgresql://username:password@hostname:5432/strelitzia?sslmode=require"
```

### 4. Run Migrations

```bash
npx prisma migrate deploy
```

## Backup & Recovery

### Backup Database

```bash
# Full backup
pg_dump -U strelitzia_user -d strelitzia > strelitzia_backup.sql

# With compression
pg_dump -U strelitzia_user -d strelitzia | gzip > strelitzia_backup.sql.gz
```

### Restore Database

```bash
# From SQL file
psql -U strelitzia_user -d strelitzia < strelitzia_backup.sql

# From compressed backup
gunzip -c strelitzia_backup.sql.gz | psql -U strelitzia_user -d strelitzia
```

## Security Best Practices

### 1. Strong Passwords

Always use strong, unique passwords:
- Minimum 16 characters
- Mix of uppercase, lowercase, numbers, symbols
- Generate with tools like: `openssl rand -base64 24`

### 2. Firewall Rules

Configure PostgreSQL to only accept localhost connections in `postgresql.conf`:

```conf
listen_addresses = 'localhost'
```

### 3. User Permissions

Create specific database users with minimal required permissions:

```sql
-- Read-only user (optional)
CREATE USER strelitzia_reader WITH PASSWORD 'password';
GRANT CONNECT ON DATABASE strelitzia TO strelitzia_reader;
GRANT USAGE ON SCHEMA public TO strelitzia_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO strelitzia_reader;
```

### 4. SSL Connections

For production, enforce SSL:

```sql
-- In postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

### 5. Connection Limits

Set connection limits per role:

```sql
ALTER USER strelitzia_user WITH CONNECTION LIMIT 10;
```

## Troubleshooting

### Cannot Connect to Database

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check connection details
psql -U strelitzia_user -h localhost -d strelitzia

# Debug connection string
echo $DATABASE_URL
```

### Prisma Migration Issues

```bash
# Check migration status
npx prisma migrate status

# Resolve diverged migrations
npx prisma migrate resolve --rolled-back <migration_name>
```

### Permission Errors

```bash
# Grant all privileges on schema
GRANT ALL PRIVILEGES ON SCHEMA public TO strelitzia_user;

# Grant on existing tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO strelitzia_user;

# Ensure default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO strelitzia_user;
```

### Slow Queries

Check slow query log:

```sql
-- Enable
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Or set connection
psql -U postgres -c "SET log_duration = on;"
```

## Database Schema

### User Roles

- **watcher**: Regular user, can watch videos and maintain watch history
- **admin**: Can create/delete videos, manage uploads, manage users
- **main_admin**: Can do everything including role changes and system configuration

### Key Tables

**users** - User authentication and profiles
```
- id: UUID primary key
- email: unique email address
- passwordHash: Argon2 hashed password
- role: 'watcher' | 'admin' | 'main_admin'
- isActive: boolean for account status
- refreshTokens: relation to refresh tokens
```

**videos** - Video series/collections
```
- id: UUID primary key
- title: video series title
- nsfw: flag for adult content
- episodes: relation to episodes
```

**episodes** - Individual video files
```
- id: UUID primary key
- videoId: foreign key to video
- season: season number
- episodeNumber: episode number
- filesystem_path: local storage path
- s3_master_key: S3 key (legacy)
```

**watchHistory** - User viewing history
```
- id: UUID primary key
- userId: foreign key to user
- episodeId: foreign key to episode
- lastPositionSec: playback position
- watchedAt: timestamp
```

**auditLogs** - Security and activity logging
```
- id: UUID primary key
- action: action type (user_login, video_created, etc)
- actorId: who performed the action
- targetId: what was acted upon
- detailsJson: additional metadata
```

## Monitoring

### Connection Pool Monitoring

```sql
-- Check active connections
SELECT datname, usename, application_name, state
FROM pg_stat_activity
WHERE datname = 'strelitzia';

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'strelitzia'
  AND state = 'idle'
  AND query_start < NOW() - INTERVAL '30 minutes';
```

### Database Size

```sql
SELECT pg_database.datname,
       pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'strelitzia';
```

### Table Sizes

```sql
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html#SQL-SYNTAX-IDENTIFIERS)
