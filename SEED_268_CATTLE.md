# 🐄 Seed 268 Cattle with Muzzle Biometrics & Turing Protocol

This guide shows you how to populate your iCattle Dashboard with **268 real cattle** complete with muzzle biometric photos and full Turing Protocol enforcement.

## What You Get

### 📊 **268 Cattle** with:
- **Biometric muzzle photos** (multiple high-resolution images per cattle)
- **Cryptographically signed events** (EdDSA/Ed25519)
- **Complete audit trail** (SHA-256 hashing)
- **Kafka event sourcing** (published to `turing.cattle.events`)
- **Realistic data**: breeds, weights, ages, acquisition costs

### 🏢 **5 Farms** across Australia:
1. **Riverside Cattle Station** - Wagga Wagga, NSW
2. **Highland Breeding Farm** - Armidale, NSW
3. **Outback Beef Co** - Longreach, QLD
4. **Southern Cross Pastoral** - Mount Gambier, SA
5. **Northern Territory Cattle Co** - Katherine, NT

### 🔐 **Turing Protocol V2** Enforcement:
- Every cattle creation event is cryptographically signed
- Tamper-proof audit trail
- Event chaining for provenance
- Published to Kafka for event sourcing
- Stored in `cattle_events` table

### 📋 **Additional Data**:
- 100+ lifecycle events (vaccinations, weight checks)
- 268 valuations (market-based)
- Market data from MLA
- Complete farm management data

## Prerequisites

Make sure you have:
- ✅ Docker running (PostgreSQL + Kafka)
- ✅ Database schema pushed (`pnpm db:push`)
- ✅ Latest code pulled from GitHub

## Quick Start

### 1. Pull Latest Code

```powershell
cd C:\Users\mjmil\TuringCore-v3\icattle-ai-turing-core\icattle-ai-turing-core
git pull origin main
pnpm install
```

### 2. Ensure Services Running

```powershell
# Check Docker services
docker compose ps

# If not running, start them
docker compose up -d
```

### 3. Clear Existing Data (Optional)

If you want to start fresh:

```powershell
docker exec icattle-postgres psql -U icattle -d icattle -c "TRUNCATE users, clients, cattle, lifecycle_events, valuations, market_data, cattle_events CASCADE;"
```

### 4. Run Comprehensive Seed

```powershell
pnpm db:seed-full
```

This will take 2-5 minutes to:
- Create 268 cattle records
- Generate and sign 268 events
- Create lifecycle events
- Generate valuations
- Publish events to Kafka (if available)

### 5. Start Dashboard

```powershell
pnpm dev
```

Open http://localhost:3000 and you'll see:
- **268 cattle** in the inventory
- **5 farms** with cattle distributed across them
- **Muzzle photos** for every cattle
- **Complete audit trail** with cryptographic signatures

## What Happens During Seeding

```
🌱 Starting comprehensive database seed with Turing Protocol...
📊 Target: 268 cattle with muzzle biometrics

🔐 Generated cryptographic key pair for Turing Protocol
   Public Key: 1a2b3c4d...
   Private Key: 9z8y7x6w...

📡 Connected to Kafka for event sourcing

✅ Database connection established

👤 Creating admin user...
   ✅ Created user: System Administrator (ID: 1)

🏢 Creating farms...
   ✅ Riverside Cattle Station
   ✅ Highland Breeding Farm
   ✅ Outback Beef Co
   ✅ Southern Cross Pastoral
   ✅ Northern Territory Cattle Co

   📊 Total farms: 5

📋 Found 268 cattle with muzzle photos

🐄 Creating cattle records with Turing Protocol enforcement...

   ✅ Created 25/268 cattle...
   ✅ Created 50/268 cattle...
   ✅ Created 75/268 cattle...
   ...
   ✅ Created 268/268 cattle...

   📊 Total cattle created: 268
   🔐 Total signed events: 268

📅 Creating lifecycle events...
   ✅ Created 100 lifecycle events

💰 Creating valuations...
   ✅ Created 268 valuations

📈 Creating market data...
   ✅ Created 5 market data entries

🔄 Updating farm cattle counts...
   ✅ Farm counts updated

========================================
🎉 Database seeded successfully!
========================================

📊 Summary:
   - Users: 1
   - Farms: 5
   - Cattle: 268
   - Signed Events: 268
   - Lifecycle Events: 100
   - Valuations: 268
   - Market Data: 5

🔐 Turing Protocol Enforcement:
   - All cattle creation events cryptographically signed
   - EdDSA (Ed25519) signatures
   - SHA-256 event hashing
   - Complete audit trail
   - Events published to Kafka: Yes

🌐 Open http://localhost:3000 to view the dashboard
```

## Verify the Data

### Check Database

```powershell
# Connect to PostgreSQL
docker exec -it icattle-postgres psql -U icattle -d icattle

# Count cattle
SELECT COUNT(*) FROM cattle;
# Should return: 268

# Check signed events
SELECT COUNT(*) FROM cattle_events;
# Should return: 268

# View sample cattle with muzzle photos
SELECT visual_id, name, breed, muzzle_image_url FROM cattle LIMIT 10;
```

### Check Kafka

```powershell
# Open Kafka UI
start http://localhost:8080

# Look for topic: turing.cattle.events
# Should have 268 messages
```

### Check Dashboard

1. Open http://localhost:3000
2. Navigate to **Assets** → **Cattle Inventory**
3. You should see 268 cattle
4. Click on any cattle to see:
   - Muzzle biometric photo
   - Complete details
   - Lifecycle events
   - Valuation history
   - Cryptographic audit trail

## Troubleshooting

### Seed Fails with "role icattle does not exist"

Wait a bit longer for PostgreSQL to initialize:

```powershell
# Check PostgreSQL logs
docker compose logs postgres

# Restart PostgreSQL
docker compose restart postgres

# Wait 30 seconds, then try again
pnpm db:seed-full
```

### Kafka Connection Fails

The seed will continue without Kafka. Events are still stored in the database, just not published to Kafka.

To enable Kafka:

```powershell
# Make sure Kafka is running
docker compose ps kafka

# Check Kafka logs
docker compose logs kafka

# Restart if needed
docker compose restart kafka zookeeper
```

### Images Not Showing

Make sure the public directory is being served:

```powershell
# Check if images exist
ls public/images/muzzles | measure

# Should show 268 directories
```

## Next Steps

Once seeded:

1. **Explore the Dashboard** - Browse cattle, farms, valuations
2. **Test Event Sourcing** - Create new events and watch Kafka
3. **Verify Signatures** - Check the `cattle_events` table for cryptographic proofs
4. **Generate Reports** - Use the financial reporting features
5. **Test Fraud Detection** - Try to modify data and see alerts

## Performance Notes

- **Seeding time**: 2-5 minutes (depending on system)
- **Database size**: ~50MB with all data
- **Image storage**: ~600MB (muzzle photos)
- **Kafka topics**: 268 messages in `turing.cattle.events`

## Clean Up

To remove all data and start over:

```powershell
# Stop services
docker compose down

# Remove volumes
docker volume rm icattle-ai-turing-core_postgres-data

# Start fresh
docker compose up -d
pnpm db:push
pnpm db:seed-full
```

---

🎉 **Enjoy your fully populated iCattle Dashboard with 268 cattle and complete Turing Protocol enforcement!**
