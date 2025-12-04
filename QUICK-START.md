# 🚀 Quick Start - Database Rebuild

## One-Line Rebuild (Recommended)

### PowerShell (Windows):
```powershell
.\rebuild-simple.ps1
```

### Or directly:
```powershell
pnpm tsx scripts/rebuild-database.ts
```

---

## What This Does

1. ✅ Drops existing database
2. ✅ Creates fresh database
3. ✅ Runs all migrations
4. ✅ Seeds with 3 farmers
5. ✅ Creates 3,000 cattle (1,000 each)
6. ✅ Verifies everything

**Time: ~2-3 minutes**

---

## After Rebuild

```powershell
pnpm dev
```

Then open: http://localhost:3001

---

## Expected Results

### Dashboard
- ✅ **3 Total Clients** (not 0!)
- ✅ **3,000 Total Cattle**
- ✅ **~$10M Portfolio Value**

### Client Accounts
- ✅ Riverside Cattle Station: 1,000 cattle
- ✅ Highland Breeding Farm: 1,000 cattle
- ✅ Golden Plains Pastoral: 1,000 cattle

### Bank View
- ✅ Client diversification: 33.3% each
- ✅ LVR calculations
- ✅ Risk assessment

---

## Troubleshooting

### Still shows 0 clients?
```powershell
# Diagnose the issue
pnpm tsx scripts/diagnose-client-count.ts

# Fix client status
pnpm tsx scripts/fix-client-status.ts

# Restart dev server
pnpm dev
```

### Database connection error?
1. Check PostgreSQL is running:
   ```powershell
   docker ps
   ```
2. Check `.env` file has:
   ```
   DATABASE_URL=postgresql://postgres:postgres_admin_password@localhost:5433/icattle
   ```

---

## Files Reference

| File | Purpose |
|------|---------|
| `rebuild-simple.ps1` | PowerShell rebuild script |
| `rebuild-database.ts` | Main rebuild script |
| `seed-3-farmers-3000-cattle.ts` | Seeding script |
| `diagnose-client-count.ts` | Diagnostic tool |
| `fix-client-status.ts` | Fix client status |

---

## Full Documentation

See `REBUILD-INSTRUCTIONS.md` for complete details.

---

**Ready? Run:**
```powershell
.\rebuild-simple.ps1
```
