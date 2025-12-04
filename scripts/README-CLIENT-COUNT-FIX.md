# Client Count Fix Scripts

## Problem
The Dashboard and Client Accounts pages are showing "0 Total Clients" even though there are 3 clients in the database with 1,000 cattle.

## Root Cause
The clients in the database may not have their `status` field set to `'active'`, which causes the `getActiveClients()` query to return an empty array.

## Solution Scripts

### 1. Diagnose the Issue
Run this script first to see what's in the database:

```bash
pnpm tsx scripts/diagnose-client-count.ts
```

This will show you:
- Total clients in the database
- How many are marked as "active"
- Cattle distribution per client
- What the API queries would return

### 2. Fix the Status
If the diagnosis shows clients with non-active status, run:

```bash
pnpm tsx scripts/fix-client-status.ts
```

This will:
- Set all clients to `status = 'active'`
- Show you the before/after state
- Verify the cattle counts

### 3. Restart Dev Server
After running the fix:

```bash
# Stop the current dev server (Ctrl+C)
pnpm dev
```

### 4. Verify in Browser
1. Open http://localhost:3001
2. Check the Dashboard - should show "3 Total Clients"
3. Go to Client Accounts - should show "3 Total Clients"
4. Verify the Bank View shows proper client diversification

## Technical Details

### Backend Code
The router in `server/routers.ts` calls:
```typescript
clients: router({
  active: publicProcedure
    .query(async () => {
      return await db.getActiveClients();
    }),
})
```

The `getActiveClients()` function in `server/db.ts`:
```typescript
export async function getActiveClients(): Promise<Client[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(clients)
    .where(eq(clients.status, 'active'))
    .orderBy(clients.name);
}
```

### Frontend Code
The Dashboard in `client/src/pages/Home.tsx` uses:
```typescript
const { data: activeClients } = trpc.clients.active.useQuery();
const totalClients = activeClients?.length || 0;
```

## Expected Result
After running the fix:
- Dashboard: "3 Total Clients" (or however many clients you have)
- Client Accounts: Shows all 3 clients with their cattle counts
- Bank View: Shows proper diversification across clients

## If Still Not Working
1. Check that the database is running (PostgreSQL on port 5433)
2. Verify DATABASE_URL in `.env` file
3. Check browser console for any API errors
4. Try clearing browser cache and hard refresh (Ctrl+Shift+R)
5. Check server logs for any database connection errors
