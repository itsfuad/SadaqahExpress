# Redis Utilities

This directory contains utility scripts for managing and troubleshooting Redis data.

## Available Utilities

### 1. Redis Cleanup Tool

**Purpose**: Diagnose and fix Redis data type issues, orphaned keys, and corrupted data.

**File**: `redis-cleanup.ts`

**Usage**:

```bash
# Diagnose issues (safe, read-only)
npm run redis-cleanup

# Delete only problematic keys (recommended)
npm run redis-cleanup -- --delete-problematic

# Delete all user data (nuclear option for development)
npm run redis-cleanup -- --delete-all-users

# Delete entire Redis database (⚠️ WARNING: deletes everything!)
npm run redis-cleanup -- --delete-all
```

**What it does**:
- Scans all `user:*` keys in Redis
- Categorizes keys by type (string, hash, list, etc.)
- Detects orphaned index keys pointing to non-existent users
- Identifies keys with incorrect data types
- Shows all user data in a readable format
- Provides safe cleanup options

**When to use**:
- When you see `WRONGTYPE` errors
- After code changes that modify the Redis schema
- Before deploying new versions
- When debugging authentication issues
- As part of regular maintenance

### 2. Promote to Admin Tool

**Purpose**: Promote an existing user account to admin role.

**File**: `promote-to-admin.ts`

**Usage**:

```bash
# Interactive mode (prompts you to select a user)
npm run promote-to-admin

# Specify user by email
npm run promote-to-admin -- --email=user@example.com

# Auto-select if only one user exists
npm run promote-to-admin
```

**What it does**:
- Lists all users in the database
- Shows current role for each user
- Promotes selected user to admin role
- Updates the `updatedAt` timestamp
- Prevents duplicate promotions (checks if already admin)

**When to use**:
- When you need to grant admin access to an existing user
- When `/new-admin` is not accessible (admin already exists)
- For bulk admin account setup
- When recovering from lost admin credentials

## Common Scenarios

### Scenario 1: WRONGTYPE Error on Login/Signup

**Problem**: 
```
Error: WRONGTYPE Operation against a key holding the wrong kind of value
```

**Solution**:
```bash
# Step 1: Diagnose
npm run redis-cleanup

# Step 2: Fix
npm run redis-cleanup -- --delete-problematic

# Step 3: Verify
npm run redis-cleanup
```

### Scenario 2: Need to Create First Admin

**Option A - Use existing account**:
```bash
# Check what users exist
npm run redis-cleanup

# Promote existing user
npm run promote-to-admin -- --email=your@email.com
```

**Option B - Start fresh**:
```bash
# Delete all users
npm run redis-cleanup -- --delete-all-users

# Go to /new-admin in browser
# Create new admin account
```

### Scenario 3: Fresh Install / Development Reset

```bash
# Clean slate - delete everything
npm run redis-cleanup -- --delete-all

# Restart server
npm run dev

# Create admin at /new-admin
```

### Scenario 4: Multiple Users, Need to Promote One

```bash
# Interactive mode - shows all users, pick one
npm run promote-to-admin
```

## Data Structure Reference

### User Hash (Correct Format)

```
user:{uuid} (HASH)
├─ id: "{uuid}"
├─ email: "user@example.com"
├─ password: "$2b$10$..." (bcrypt hash)
├─ name: "User Name"
├─ role: "admin" | "user"
├─ isEmailVerified: "true" | "false" (stored as string)
├─ createdAt: "2024-01-01T00:00:00.000Z"
└─ updatedAt: "2024-01-01T00:00:00.000Z"
```

### Email Index (Correct Format)

```
user:email:{email} (STRING) = "{uuid}"
```

## Safety Features

All utilities include:
- ✅ Read-only mode by default (diagnose first)
- ✅ Explicit confirmation required for destructive operations
- ✅ Clear output showing what will be deleted
- ✅ Separate options for different cleanup levels
- ✅ Automatic detection of data corruption
- ✅ Validation before modifying data

## Troubleshooting

### Connection Issues

If you see `NOAUTH Authentication required`:
- Check `.env` file has correct `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- Verify Redis server is running
- Test connection manually: `redis-cli -h <host> -p <port> -a <password>`

### No Users Found

If cleanup shows 0 users:
- Database might be empty (fresh install)
- Check if you're connected to the correct Redis instance
- Verify `REDIS_HOST` and `REDIS_PORT` in `.env`

### Can't Promote User

If promotion fails:
- User must exist (run `redis-cleanup` to see all users)
- Ensure email is correct (case-sensitive)
- Check Redis connection

## Advanced: Manual Redis Commands

If you prefer direct Redis access:

```bash
# Connect to Redis CLI
redis-cli -h redis-12110.crce182.ap-south-1-1.ec2.redns.redis-cloud.com -p 12110 -a <password>

# List all user keys
KEYS user:*

# Check key type
TYPE user:some-key

# Get hash data
HGETALL user:123-456-789

# Get string data
GET user:email:test@example.com

# Promote user to admin (manual)
HSET user:123-456-789 role admin
HSET user:123-456-789 updatedAt 2024-01-01T00:00:00.000Z

# Delete specific key
DEL user:some-key

# Delete all user keys (⚠️ dangerous)
EVAL "return redis.call('del', unpack(redis.call('keys', 'user:*')))" 0
```

## Best Practices

1. **Always diagnose first**: Run `npm run redis-cleanup` before making changes
2. **Start with least destructive option**: Use `--delete-problematic` before `--delete-all`
3. **Backup before cleanup**: Use the admin Backup & Restore feature first
4. **Verify after changes**: Run cleanup again to confirm issues are fixed
5. **Document custom changes**: If you manually modify Redis, document what you did
6. **Use version control**: Commit `.env.example` but never commit `.env`

## Related Documentation

- `../REDIS_TROUBLESHOOTING.md` - Full troubleshooting guide
- `../REDIS_FIX_SUMMARY.md` - Recent fix summary
- `../AUTH_IMPLEMENTATION.md` - Authentication system docs
- `../PASSWORD_SECURITY.md` - Password hashing details

## Support

If these utilities don't solve your issue:

1. Check Redis server logs
2. Verify environment variables in `.env`
3. Review `REDIS_TROUBLESHOOTING.md` for manual commands
4. Check TypeScript errors: `npm run check`
5. Restart Redis server
6. Contact support with output from `npm run redis-cleanup`
