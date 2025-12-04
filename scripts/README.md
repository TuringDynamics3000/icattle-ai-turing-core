# Scripts Directory

Utility scripts for database management and development.

## Available Scripts

### `test-connection.ts`
Test database connection and display current state.

```bash
pnpm db:test
# or
pnpm exec tsx scripts/test-connection.ts
```

**What it does:**
- Tests PostgreSQL connection
- Shows PostgreSQL version
- Lists all tables
- Shows record counts
- Provides troubleshooting tips

### `seed.ts`
Seed the database with test data.

```bash
pnpm db:seed
# or
pnpm exec tsx scripts/seed.ts
```

**What it creates:**
- 1 test admin user
- 2 test clients (farms)
- 5 test cattle records
- Lifecycle events for each cattle
- Initial valuations

**Test Data:**
- **Riverside Cattle Station** (NSW)
  - 3 cattle: Angus cow, Wagyu bull, Hereford steer
- **Highland Breeding Farm** (NSW)
  - 2 cattle: Angus heifer, Wagyu cow

## Usage Examples

### Initial Setup
```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Push schema
pnpm db:push

# 3. Test connection
pnpm db:test

# 4. Seed data
pnpm db:seed
```

### Reset Database
```bash
# Stop and remove database
docker-compose down -v

# Start fresh
docker-compose up -d postgres
sleep 3

# Recreate schema and seed
pnpm db:push
pnpm db:seed
```

### Check Current State
```bash
pnpm db:test
```

## Creating New Scripts

When creating new scripts:

1. Add shebang: `#!/usr/bin/env tsx`
2. Use TypeScript
3. Import from `../server/db` and `../drizzle/schema`
4. Add error handling
5. Add to package.json scripts section
6. Document in this README

Example:
```typescript
#!/usr/bin/env tsx
import { getDb } from '../server/db';

async function myScript() {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Your code here
}

myScript().catch(console.error);
```
