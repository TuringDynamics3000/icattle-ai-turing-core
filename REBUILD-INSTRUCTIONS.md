# 🔄 Complete Database Rebuild Instructions

## Overview
This will completely rebuild your PostgreSQL database with:
- **3 farmers** across NSW and QLD
- **3,000 cattle** (1,000 per farmer)
- **All status fields correctly set to "active"**
- **Realistic geographic distribution and data**

**⚠️ WARNING: This will DELETE ALL existing data in your database!**

---

## Prerequisites

1. **PostgreSQL running** on `localhost:5433`
2. **Docker container** with PostgreSQL should be running
3. **Environment variables** set in `.env` file:
   ```
   DATABASE_URL=postgresql://postgres:postgres_admin_password@localhost:5433/icattle
   ```

---

## Quick Start (Recommended)

### Option 1: One-Command Rebuild

Run this single command to rebuild everything:

```bash
pnpm tsx scripts/rebuild-database.ts
```

This will:
1. ✅ Drop the existing database
2. ✅ Create a fresh database
3. ✅ Run all Drizzle migrations
4. ✅ Seed with 3 farmers and 3,000 cattle
5. ✅ Verify the data

**Total time: ~2-3 minutes**

---

## Manual Step-by-Step (Alternative)

If you prefer to run each step manually:

### Step 1: Stop the Dev Server
```bash
# Press Ctrl+C in the terminal running `pnpm dev`
```

### Step 2: Drop and Recreate Database

**Option A: Using psql**
```bash
psql -h localhost -p 5433 -U postgres -c "DROP DATABASE IF EXISTS icattle;"
psql -h localhost -p 5433 -U postgres -c "CREATE DATABASE icattle;"
```

**Option B: Using Docker**
```bash
docker exec -it icattle-postgres psql -U postgres -c "DROP DATABASE IF EXISTS icattle;"
docker exec -it icattle-postgres psql -U postgres -c "CREATE DATABASE icattle;"
```

### Step 3: Run Migrations
```bash
pnpm drizzle-kit push
```

### Step 4: Seed the Database
```bash
pnpm tsx scripts/seed-3-farmers-3000-cattle.ts
```

### Step 5: Verify the Data
```bash
pnpm tsx scripts/diagnose-client-count.ts
```

---

## After Rebuild

### 1. Start the Dev Server
```bash
pnpm dev
```

### 2. Open the Application
Navigate to: http://localhost:3001

### 3. Verify Everything Works

**Dashboard (Home Page):**
- ✅ Should show **"3 Total Clients"** (not 0!)
- ✅ Should show **"3,000 Total Cattle"**
- ✅ Should show **~$10M+ Portfolio Value**
- ✅ Charts should display breed and type distributions

**Client Accounts Page:**
- ✅ Should show **"3 Total Clients"**
- ✅ Should list all 3 farmers:
  - Riverside Cattle Station (1,000 cattle)
  - Highland Breeding Farm (1,000 cattle)
  - Golden Plains Pastoral (1,000 cattle)

**Bank & Investor View:**
- ✅ Should show portfolio metrics
- ✅ Should show client diversification (33.3% each)
- ✅ Should show LVR calculations
- ✅ Should show risk assessment

**Golden Record Detail:**
- ✅ Click any cattle to see detailed view
- ✅ Should show Turing Protocol Badge
- ✅ Should show verification pillars
- ✅ Should show confidence score

---

## Expected Results

### Database Statistics
```
Active Clients: 3
Active Cattle: 3,000
Total Portfolio Value: ~$10,000,000

Client Breakdown:
- Riverside Cattle Station (Wagga Wagga, NSW): 1,000 cattle (~$3.3M)
- Highland Breeding Farm (Armidale, NSW): 1,000 cattle (~$3.3M)
- Golden Plains Pastoral (Toowoomba, QLD): 1,000 cattle (~$3.3M)
```

### Geographic Distribution
- **NSW Riverina** (Wagga Wagga): 1,000 cattle
- **NSW Northern Tablelands** (Armidale): 1,000 cattle
- **QLD Darling Downs** (Toowoomba): 1,000 cattle

### Cattle Data Includes
- ✅ Unique NLIS IDs (e.g., RCS0000001, HBF0000001, GPP0000001)
- ✅ Visual IDs (e.g., RCS-0001, HBF-0001, GPP-0001)
- ✅ 10 different breeds (Angus, Hereford, Brahman, etc.)
- ✅ Realistic weights (100-800kg based on age)
- ✅ Realistic valuations ($1,000-$4,000 per head)
- ✅ GPS coordinates matching farm locations
- ✅ Health status (90% healthy, 10% sick/quarantine)
- ✅ Birth dates within last 5 years
- ✅ All cattle marked as "active" status

---

## Troubleshooting

### Issue: "Database icattle does not exist"
**Solution:** Make sure PostgreSQL is running:
```bash
docker ps
# Should show icattle-postgres container running
```

If not running:
```bash
docker start icattle-postgres
```

### Issue: "Cannot connect to database"
**Solution:** Check your `.env` file has the correct DATABASE_URL:
```
DATABASE_URL=postgresql://postgres:postgres_admin_password@localhost:5433/icattle
```

### Issue: Still showing "0 Total Clients"
**Solution:**
1. Hard refresh browser (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Restart dev server
5. Run diagnostic script:
   ```bash
   pnpm tsx scripts/diagnose-client-count.ts
   ```

### Issue: Migrations fail
**Solution:** Make sure you're using the correct Drizzle command:
```bash
pnpm drizzle-kit push
```

Not `migrate` or `generate` - use `push` for development.

### Issue: "Permission denied" errors
**Solution:** Make sure PostgreSQL user has correct permissions:
```bash
psql -h localhost -p 5433 -U postgres -c "ALTER USER postgres WITH SUPERUSER;"
```

---

## Performance Notes

With 3,000 cattle:
- **Database size:** ~5-10 MB
- **Page load time:** <1 second
- **Query performance:** <100ms for most queries
- **Rebuild time:** ~2-3 minutes

This is a good balance between:
- ✅ Enough data to test features realistically
- ✅ Fast enough for smooth development
- ✅ Quick rebuild when needed

---

## Next Steps After Rebuild

1. ✅ Test all navigation links
2. ✅ Test AI Recommendations page
3. ✅ Test Price Forecast page
4. ✅ Test Provenance Tracking page
5. ✅ Test Bank View with 3 clients
6. ✅ Test Golden Record detail views
7. ✅ Verify pastel color scheme throughout
8. ✅ Test all filters and search functionality

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `rebuild-database.ts` | Complete rebuild (drop, create, migrate, seed) |
| `seed-3-farmers-3000-cattle.ts` | Seed 3 farmers with 1,000 cattle each |
| `diagnose-client-count.ts` | Check client count and status |
| `fix-client-status.ts` | Fix client status to "active" |

---

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Run the diagnostic script
3. Check server logs for errors
4. Verify PostgreSQL is running
5. Check `.env` file configuration

---

**Ready to rebuild? Run:**
```bash
pnpm tsx scripts/rebuild-database.ts
```

**Good luck! 🚀**
