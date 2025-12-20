# KiyuMart Database Backup & Recovery Strategy

## Overview
This document outlines the database backup strategy for KiyuMart, ensuring data integrity, disaster recovery, and business continuity.

## Database Details
- **Provider**: Supabase (PostgreSQL)
- **Connection**: `postgresql://postgres.rbrwgssdggfhrqitundk:Smart@399@aws-1-eu-west-1.pooler.supabase.com:6543/postgres`
- **Region**: AWS EU-West-1
- **ORM**: Drizzle ORM with postgres-js driver

## Backup Strategy

### 1. Automated Daily Backups
**Schedule**: Every day at 2:00 AM UTC

#### Using Supabase Built-in Backups
Supabase provides automatic Point-in-Time Recovery (PITR):
- **Retention**: 7 days for free tier, 30 days for Pro tier
- **Recovery**: Can restore to any point in the last 7-30 days
- **Location**: Automatic backups stored in Supabase infrastructure

#### Manual pg_dump Backups (Additional Layer)
```bash
#!/bin/bash
# Daily backup script
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/kiyumart"
BACKUP_FILE="$BACKUP_DIR/kiyumart-backup-$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup using pg_dump
pg_dump "postgresql://postgres.rbrwgssdggfhrqitundk:Smart@399@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

# Compress backup
gzip "$BACKUP_FILE"

# Upload to cloud storage (S3/Google Cloud/Azure)
aws s3 cp "${BACKUP_FILE}.gz" "s3://kiyumart-backups/daily/${DATE}.sql.gz"

# Remove local backup older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### 2. Weekly Full Backups
**Schedule**: Every Sunday at 1:00 AM UTC

```bash
#!/bin/bash
# Weekly full backup script
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_DIR="/backups/kiyumart/weekly"
BACKUP_FILE="$BACKUP_DIR/kiyumart-weekly-$DATE.sql"

mkdir -p $BACKUP_DIR

# Full backup with all schemas
pg_dump "postgresql://postgres.rbrwgssdggfhrqitundk:Smart@399@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" \
  --format=custom \
  --schema=public \
  --file="$BACKUP_FILE" \
  --verbose

gzip "$BACKUP_FILE"

# Upload to long-term storage
aws s3 cp "${BACKUP_FILE}.gz" "s3://kiyumart-backups/weekly/${DATE}.sql.gz"

# Remove weekly backups older than 90 days
find $BACKUP_DIR -name "*.gz" -mtime +90 -delete

echo "Weekly backup completed: ${BACKUP_FILE}.gz"
```

### 3. Monthly Archive Backups
**Schedule**: First day of every month at 12:00 AM UTC
**Retention**: 12 months

```bash
#!/bin/bash
# Monthly archive backup
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups/kiyumart/monthly"
BACKUP_FILE="$BACKUP_DIR/kiyumart-monthly-$DATE.sql"

mkdir -p $BACKUP_DIR

pg_dump "postgresql://postgres.rbrwgssdggfhrqitundk:Smart@399@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" \
  --format=custom \
  --file="$BACKUP_FILE" \
  --verbose

gzip "$BACKUP_FILE"

# Upload to archive storage
aws s3 cp "${BACKUP_FILE}.gz" "s3://kiyumart-backups/monthly/${DATE}.sql.gz"

# Keep 12 months of monthly backups
find $BACKUP_DIR -name "*.gz" -mtime +365 -delete

echo "Monthly archive backup completed: ${BACKUP_FILE}.gz"
```

## Backup Implementation

### Option 1: Using GitHub Actions (Recommended)

Create `.github/workflows/database-backup.yml`:

```yaml
name: Database Backup

on:
  schedule:
    # Daily at 2:00 AM UTC
    - cron: '0 2 * * *'
    # Weekly on Sunday at 1:00 AM UTC
    - cron: '0 1 * * 0'
    # Monthly on 1st at 12:00 AM UTC
    - cron: '0 0 1 * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - name: Install PostgreSQL client
        run: |
          sudo apt-get update
          sudo apt-get install -y postgresql-client
      
      - name: Perform database backup
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: eu-west-1
        run: |
          DATE=$(date +%Y-%m-%d_%H-%M-%S)
          BACKUP_FILE="kiyumart-backup-$DATE.sql"
          
          # Perform backup
          pg_dump "$DATABASE_URL" --format=custom --file="$BACKUP_FILE"
          
          # Compress
          gzip "$BACKUP_FILE"
          
          # Upload to S3
          aws s3 cp "${BACKUP_FILE}.gz" "s3://kiyumart-backups/automated/${BACKUP_FILE}.gz"
          
          echo "Backup completed: ${BACKUP_FILE}.gz"
      
      - name: Notify on failure
        if: failure()
        run: |
          # Send notification (email, Slack, Discord, etc.)
          echo "Backup failed! Sending notification..."
```

### Option 2: Using Cron Jobs on Server

Add to `/etc/crontab`:
```bash
# Daily backup at 2:00 AM
0 2 * * * root /opt/scripts/daily-backup.sh >> /var/log/kiyumart-backup.log 2>&1

# Weekly backup at 1:00 AM on Sundays
0 1 * * 0 root /opt/scripts/weekly-backup.sh >> /var/log/kiyumart-backup.log 2>&1

# Monthly backup at 12:00 AM on 1st
0 0 1 * * root /opt/scripts/monthly-backup.sh >> /var/log/kiyumart-backup.log 2>&1
```

### Option 3: Using Supabase Dashboard (Easiest)

1. Log into Supabase Dashboard
2. Go to Project Settings → Database
3. Navigate to Backups tab
4. Enable automatic backups
5. Configure retention period
6. Download backups as needed

## Backup Storage

### Primary Storage: AWS S3
```bash
# S3 bucket structure
s3://kiyumart-backups/
├── daily/
│   ├── 2024-01-20_02-00-00.sql.gz
│   ├── 2024-01-21_02-00-00.sql.gz
│   └── ...
├── weekly/
│   ├── 2024-01-14_01-00-00.sql.gz
│   ├── 2024-01-21_01-00-00.sql.gz
│   └── ...
└── monthly/
    ├── 2024-01-01.sql.gz
    ├── 2024-02-01.sql.gz
    └── ...
```

### S3 Lifecycle Policy
```json
{
  "Rules": [
    {
      "Id": "DeleteOldDailyBackups",
      "Status": "Enabled",
      "Prefix": "daily/",
      "Expiration": {
        "Days": 7
      }
    },
    {
      "Id": "DeleteOldWeeklyBackups",
      "Status": "Enabled",
      "Prefix": "weekly/",
      "Expiration": {
        "Days": 90
      }
    },
    {
      "Id": "ArchiveMonthlyBackups",
      "Status": "Enabled",
      "Prefix": "monthly/",
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "GLACIER"
        }
      ],
      "Expiration": {
        "Days": 365
      }
    }
  ]
}
```

## Disaster Recovery Procedures

### Full Database Restore

```bash
#!/bin/bash
# Restore from backup

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./restore.sh <backup-file.sql.gz>"
  exit 1
fi

# Download from S3 if needed
if [[ $BACKUP_FILE == s3://* ]]; then
  aws s3 cp "$BACKUP_FILE" ./backup.sql.gz
  BACKUP_FILE="./backup.sql.gz"
fi

# Decompress
gunzip -c "$BACKUP_FILE" > backup.sql

# Restore database
pg_restore --clean --if-exists \
  -d "postgresql://postgres.rbrwgssdggfhrqitundk:Smart@399@aws-1-eu-west-1.pooler.supabase.com:6543/postgres" \
  backup.sql

echo "Database restored from $BACKUP_FILE"
```

### Point-in-Time Recovery (Supabase)

1. Go to Supabase Dashboard
2. Navigate to Database → Backups
3. Select "Point in Time Recovery"
4. Choose date/time to restore to
5. Confirm restoration
6. Wait for completion (can take 5-30 minutes)

### Partial Data Restore

```bash
# Restore specific tables only
pg_restore --table=users --table=products \
  -d "postgresql://..." \
  backup.sql
```

## Backup Verification

### Automated Verification Script
```bash
#!/bin/bash
# Verify backup integrity

BACKUP_FILE="$1"

# Test if backup is readable
pg_restore --list "$BACKUP_FILE" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Backup is valid: $BACKUP_FILE"
  exit 0
else
  echo "❌ Backup is corrupted: $BACKUP_FILE"
  # Send alert notification
  exit 1
fi
```

### Monthly Verification Process
1. Download random backup from each tier (daily/weekly/monthly)
2. Restore to test database instance
3. Run data integrity checks
4. Verify critical tables and row counts
5. Document verification results

## Monitoring & Alerts

### Backup Success/Failure Monitoring

**Using Uptime Robot or similar**:
- Monitor S3 bucket for new daily backups
- Alert if no backup file created in 25 hours
- Alert if backup file size is unusually small

**Using CloudWatch (AWS)**:
```bash
# Create SNS topic for alerts
aws sns create-topic --name kiyumart-backup-alerts

# Subscribe email to topic
aws sns subscribe \
  --topic-arn arn:aws:sns:eu-west-1:ACCOUNT:kiyumart-backup-alerts \
  --protocol email \
  --notification-endpoint admin@kiyumart.com
```

### Alert Notifications
Send alerts for:
- ❌ Backup failure
- ⚠️ Backup file size < 1MB (possibly corrupted)
- ⚠️ No backup in last 25 hours
- ✅ Weekly backup verification success

## Security Considerations

### Backup Encryption
```bash
# Encrypt backup before upload
openssl enc -aes-256-cbc -salt \
  -in backup.sql.gz \
  -out backup.sql.gz.enc \
  -pass pass:$ENCRYPTION_KEY

# Upload encrypted backup
aws s3 cp backup.sql.gz.enc s3://kiyumart-backups/
```

### Access Control
- Backup files stored in private S3 bucket
- IAM roles with least privilege access
- Encryption at rest (S3 server-side encryption)
- Encryption in transit (SSL/TLS)

### Credentials Management
- Never commit database credentials to Git
- Use GitHub Secrets for CI/CD
- Rotate database passwords quarterly
- Use read-only credentials for backup operations when possible

## Migration Tracking

### Drizzle Migration Backups
Before running migrations, automatically create backup:

```typescript
// server/migrations/backup-before-migrate.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function backupBeforeMigration() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pre-migration-${timestamp}.sql`;
  
  try {
    await execAsync(
      `pg_dump "${process.env.DATABASE_URL}" --format=custom --file="/backups/${filename}"`
    );
    console.log(`✅ Pre-migration backup created: ${filename}`);
    return filename;
  } catch (error) {
    console.error('❌ Failed to create pre-migration backup:', error);
    throw error;
  }
}
```

### Migration Rollback Procedure
1. Identify failed migration version
2. Restore from pre-migration backup
3. Fix migration code
4. Re-run migration with fixes

## Testing Recovery Procedures

### Quarterly Disaster Recovery Drill
1. Create test environment
2. Restore latest backup to test environment
3. Verify all data integrity
4. Run application against test database
5. Document time to recovery
6. Update procedures based on findings

### Recovery Time Objectives (RTO)
- **Critical**: 1 hour (restore from daily backup)
- **High**: 4 hours (restore from weekly backup)
- **Medium**: 24 hours (restore from monthly backup)

### Recovery Point Objectives (RPO)
- **Maximum data loss**: 24 hours
- **Target data loss**: 1 hour (with frequent backups)

## Compliance & Auditing

### Backup Audit Log
Maintain log of all backup operations:
```csv
Timestamp,Type,Status,Size,Location,Verified
2024-01-20T02:00:00Z,Daily,Success,245MB,s3://kiyumart-backups/daily/...,Yes
2024-01-21T02:00:00Z,Daily,Success,248MB,s3://kiyumart-backups/daily/...,Yes
```

### Retention Compliance
- Daily backups: 7 days
- Weekly backups: 90 days
- Monthly backups: 12 months
- Legal hold backups: Indefinite (until removed)

## Cost Optimization

### S3 Storage Costs (Estimated)
- Daily backups (7 days × 250MB): ~$0.06/month
- Weekly backups (12 weeks × 250MB): ~$0.07/month
- Monthly backups (12 months × 250MB): ~$0.07/month
- **Total**: ~$0.20/month (minimal cost)

### Glacier for Long-term Storage
Move monthly backups > 30 days to Glacier:
- Reduces storage cost by 85%
- Monthly cost: ~$0.03/month

## Emergency Contacts

**Database Issues:**
- Primary DBA: admin@kiyumart.com
- Supabase Support: support@supabase.com
- Emergency Hotline: +1-XXX-XXX-XXXX

**Backup Recovery Team:**
- Lead Developer: @rmohammed052-hue
- DevOps Engineer: TBD
- System Administrator: TBD

## Appendix

### Useful Commands

```bash
# List all backups in S3
aws s3 ls s3://kiyumart-backups/ --recursive

# Download specific backup
aws s3 cp s3://kiyumart-backups/daily/2024-01-20.sql.gz ./

# Check backup size
aws s3 ls s3://kiyumart-backups/daily/2024-01-20.sql.gz --human-readable

# Restore specific table
pg_restore -t users -d DATABASE_URL backup.sql

# Export data as CSV
psql DATABASE_URL -c "COPY users TO '/tmp/users.csv' CSV HEADER;"
```

---
**Document Version**: 1.0  
**Last Updated**: 2024-01-20  
**Next Review**: 2024-04-20  
**Owner**: KiyuMart DevOps Team
