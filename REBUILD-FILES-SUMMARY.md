# Database Rebuild Files Summary

## Files Created for Database Rebuild

### 1. Main Rebuild Script
**File:** `scripts/rebuild-database.ts`
**Purpose:** Master script that orchestrates the complete rebuild process
**What it does:**
- Drops existing database
- Creates fresh database
- Runs Drizzle migrations
- Calls seeding script
- Verifies the rebuild

**Usage:**
```bash
pnpm tsx scripts/rebuild-database.ts
```

---

### 2. Seeding Script
**File:** `scripts/seed-3-farmers-3000-cattle.ts`
**Purpose:** Seeds database with 3 farmers and 3,000 cattle
**What it creates:**
- 3 farmers (Riverside, Highland, Golden Plains)
- 1,000 cattle per farmer (3,000 total)
- All with status = 'active'
- Realistic data (weights, valuations, GPS, etc.)

**Usage:**
```bash
pnpm tsx scripts/seed-3-farmers-3000-cattle.ts
```

---

### 3. Diagnostic Script
**File:** `scripts/diagnose-client-count.ts`
**Purpose:** Diagnose why client count might be showing 0
**What it checks:**
- Total clients in database
- Active clients count
- Cattle per client
- What API queries return

**Usage:**
```bash
pnpm tsx scripts/diagnose-client-count.ts
```

---

### 4. Fix Script
**File:** `scripts/fix-client-status.ts`
**Purpose:** Fix client status if they're not marked as 'active'
**What it does:**
- Updates all clients to status = 'active'
- Shows before/after state
- Verifies cattle counts

**Usage:**
```bash
pnpm tsx scripts/fix-client-status.ts
```

---

### 5. Instructions
**File:** `REBUILD-INSTRUCTIONS.md`
**Purpose:** Complete step-by-step guide for rebuilding database
**Contents:**
- Quick start guide
- Manual step-by-step instructions
- Troubleshooting tips
- Expected results
- Verification steps

---

### 6. README for Diagnostic Scripts
**File:** `scripts/README-CLIENT-COUNT-FIX.md`
**Purpose:** Explains the client count issue and how to fix it
**Contents:**
- Problem description
- Root cause analysis
- Solution scripts
- Technical details

---

## Quick Reference

### To Rebuild Everything:
```bash
pnpm tsx scripts/rebuild-database.ts
```

### To Just Seed (after migrations):
```bash
pnpm tsx scripts/seed-3-farmers-3000-cattle.ts
```

### To Diagnose Issues:
```bash
pnpm tsx scripts/diagnose-client-count.ts
```

### To Fix Client Status:
```bash
pnpm tsx scripts/fix-client-status.ts
```

---

## What Gets Created

### 3 Farmers:
1. **Riverside Cattle Station**
   - Location: Wagga Wagga, NSW
   - Type: Producer
   - Cattle: 1,000
   - Status: active

2. **Highland Breeding Farm**
   - Location: Armidale, NSW
   - Type: Breeder
   - Cattle: 1,000
   - Status: active

3. **Golden Plains Pastoral**
   - Location: Toowoomba, QLD
   - Type: Producer
   - Cattle: 1,000
   - Status: active

### 3,000 Cattle:
- Unique NLIS IDs
- Visual IDs
- 10 different breeds
- Realistic weights (100-800kg)
- Realistic valuations ($1,000-$4,000)
- GPS coordinates
- Health status
- All marked as 'active'

---

## Expected Database State After Rebuild

```
Active Clients: 3
Active Cattle: 3,000
Total Portfolio Value: ~$10,000,000
Geographic Coverage: NSW + QLD
```

---

## Files Location

All scripts are in the `scripts/` directory:
```
scripts/
├── rebuild-database.ts              (Main rebuild script)
├── seed-3-farmers-3000-cattle.ts    (Seeding script)
├── diagnose-client-count.ts         (Diagnostic tool)
├── fix-client-status.ts             (Fix tool)
└── README-CLIENT-COUNT-FIX.md       (Documentation)
```

Documentation in root:
```
REBUILD-INSTRUCTIONS.md              (Step-by-step guide)
REBUILD-FILES-SUMMARY.md             (This file)
```
