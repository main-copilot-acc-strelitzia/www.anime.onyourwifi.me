#!/usr/bin/env bash
# Backup script for Strelitzia
# Dumps Postgres, compresses, and uploads to S3 or copies via mc (MinIO client)

set -euo pipefail

# Configuration: override via environment or edit below
: ${DATABASE_URL:="${DATABASE_URL:-}"}
: ${BACKUP_DIR:="/var/backups/strelitzia"}
: ${S3_BUCKET:=""}
: ${AWS_PROFILE:=""}

timestamp() { date -u +"%Y-%m-%dT%H%M%SZ"; }

mkdir -p "$BACKUP_DIR"

OUTFILE="$BACKUP_DIR/strelitzia-$(timestamp).sql.gz"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set. Exiting." >&2
  exit 1
fi

echo "Dumping database to $OUTFILE"
pg_dump --dbname="$DATABASE_URL" --format=plain | gzip > "$OUTFILE"

echo "Dump complete. Size: $(du -h "$OUTFILE" | cut -f1)"

if command -v aws >/dev/null 2>&1 && [ -n "$S3_BUCKET" ]; then
  echo "Uploading to s3://$S3_BUCKET/"
  if [ -n "$AWS_PROFILE" ]; then
    AWS_PROFILE="$AWS_PROFILE" aws s3 cp "$OUTFILE" "s3://$S3_BUCKET/"
  else
    aws s3 cp "$OUTFILE" "s3://$S3_BUCKET/"
  fi
  echo "Upload finished."
fi

if command -v mc >/dev/null 2>&1 && [ -n "$S3_BUCKET" ]; then
  echo "Using mc to mirror to $S3_BUCKET"
  mc cp "$OUTFILE" "$S3_BUCKET/"
fi

echo "Prune backups older than 30 days in $BACKUP_DIR"
find "$BACKUP_DIR" -type f -name 'strelitzia-*.sql.gz' -mtime +30 -print -delete || true

echo "Backup finished: $OUTFILE"

# Cron example (run daily at 02:00):
# 0 2 * * * /path/to/strelitzia/scripts/backup-strelitzia.sh >> /var/log/strelitzia/backup.log 2>&1
