# MeuHub Database Initialization

## Files

| File | Description |
|------|-------------|
| `001_schema.sql` | Complete database schema (tables, indexes, functions, views) |
| `002_seed.sql` | Initial data (admin account, demo user, invite codes) |

## How It Works

PostgreSQL Docker images automatically execute `.sql` files from `/docker-entrypoint-initdb.d/` in **alphabetical order** when the container is created for the first time.

**IMPORTANT:** Scripts only run when the database volume is empty (first time creation). If you need to re-run them, you must delete the volume first:

```bash
docker compose down -v  # -v flag removes volumes
docker compose up -d
```

## Initial Accounts

### Admin Account
- **Username:** `admin`
- **Email:** `admin@meuhub.app.br`
- **Password:** `Admin@123`
- **Is Admin:** Yes

> **IMPORTANT:** Change the admin password immediately after first login!

### Demo Account
- **Username:** `demo`
- **Email:** `demo@meuhub.app.br`
- **Password:** `Demo@123`
- **Is Admin:** No

## Database Schema

### Tables

1. **users** - User accounts
2. **links** - User's links
3. **social_icons** - Social media icons
4. **invite_codes** - Invitation codes for registration
5. **analytics_clicks** - Link click analytics
6. **profile_views** - Profile view analytics

### Views

- **user_analytics_summary** - Aggregated analytics per user

### Functions

- `generate_invite_code()` - Generate single invite code
- `generate_multiple_invite_codes(count, created_by, expires_at, notes)` - Generate multiple codes
- `trigger_set_timestamp()` - Auto-update `updated_at` column

## Regenerating Password Hashes

If you need to generate a new bcrypt hash:

```bash
cd linktree-backend
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword', 10));"
```

## Troubleshooting

### Scripts not running
- Make sure the volume is empty (delete with `docker compose down -v`)
- Check file permissions: files must be readable
- Check PostgreSQL logs: `docker logs linktree-postgres`

### Permission denied errors
- Ensure the database user has proper permissions
- The scripts grant permissions to `linktree_dev_user` if using that configuration

### Schema changes in production
For production schema changes, use migration scripts instead of modifying these init files.
