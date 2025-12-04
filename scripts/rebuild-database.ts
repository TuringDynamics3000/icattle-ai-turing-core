import postgres from 'postgres';
import 'dotenv/config';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * COMPLETE DATABASE REBUILD SCRIPT
 * =================================
 * This script will:
 * 1. Drop the existing database
 * 2. Create a fresh database
 * 3. Run all Drizzle migrations
 * 4. Seed with 3 farmers and 3,000 cattle (1,000 each)
 * 
 * WARNING: This will DELETE ALL existing data!
 */

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env file');
  process.exit(1);
}

// Parse the database URL to get connection details
const dbUrl = new URL(DATABASE_URL);
const dbName = dbUrl.pathname.slice(1); // Remove leading slash
const dbUser = dbUrl.username;
const dbPassword = dbUrl.password;
const dbHost = dbUrl.hostname;
const dbPort = dbUrl.port || '5432';

// Connection URL for postgres database (to drop/create the target database)
const adminDbUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;

async function rebuildDatabase() {
  console.log('🔄 COMPLETE DATABASE REBUILD');
  console.log('='.repeat(60));
  console.log(`Database: ${dbName}`);
  console.log(`Host: ${dbHost}:${dbPort}`);
  console.log('='.repeat(60));
  console.log('');

  // Step 1: Connect to postgres database to drop/create target database
  console.log('📋 Step 1: Dropping existing database...');
  const adminSql = postgres(adminDbUrl);
  
  try {
    // Terminate existing connections
    await adminSql`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = ${dbName}
        AND pid <> pg_backend_pid()
    `;
    console.log('   ✅ Terminated existing connections');

    // Drop database
    await adminSql.unsafe(`DROP DATABASE IF EXISTS ${dbName}`);
    console.log('   ✅ Dropped database');

    // Create fresh database
    await adminSql.unsafe(`CREATE DATABASE ${dbName}`);
    console.log('   ✅ Created fresh database\n');

  } catch (error) {
    console.error('❌ Error dropping/creating database:', error);
    await adminSql.end();
    process.exit(1);
  } finally {
    await adminSql.end();
  }

  // Step 2: Run Drizzle migrations
  console.log('📋 Step 2: Running Drizzle migrations...');
  try {
    execSync('pnpm drizzle-kit push', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log('   ✅ Migrations completed\n');
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    process.exit(1);
  }

  // Step 3: Seed the database
  console.log('📋 Step 3: Seeding database with 3 farmers and 3,000 cattle...');
  try {
    execSync('pnpm tsx scripts/seed-3-farmers-3000-cattle.ts', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });
    console.log('   ✅ Seeding completed\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }

  // Step 4: Verify the rebuild
  console.log('📋 Step 4: Verifying database...');
  const sql = postgres(DATABASE_URL);
  
  try {
    const clientCount = await sql`SELECT COUNT(*) as count FROM clients WHERE status = 'active'`;
    const cattleCount = await sql`SELECT COUNT(*) as count FROM cattle WHERE status = 'active'`;
    const totalValue = await sql`SELECT SUM(current_valuation) as total FROM cattle WHERE status = 'active'`;

    console.log('   ✅ Database verification:');
    console.log(`      - Active clients: ${clientCount[0].count}`);
    console.log(`      - Active cattle: ${cattleCount[0].count}`);
    console.log(`      - Total portfolio value: $${(Number(totalValue[0].total) / 100).toLocaleString()}`);
    console.log('');

    // Show client details
    const clients = await sql`
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(ca.id) as cattle_count,
        SUM(ca.current_valuation) as total_value
      FROM clients c
      LEFT JOIN cattle ca ON ca.client_id = c.id AND ca.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.status
      ORDER BY c.id
    `;

    console.log('   📊 Client breakdown:');
    clients.forEach(client => {
      const value = Number(client.total_value) / 100;
      console.log(`      - ${client.name}: ${client.cattle_count} cattle ($${value.toLocaleString()})`);
    });

  } catch (error) {
    console.error('❌ Error verifying database:', error);
  } finally {
    await sql.end();
  }

  console.log('');
  console.log('='.repeat(60));
  console.log('✅ DATABASE REBUILD COMPLETE!');
  console.log('='.repeat(60));
  console.log('');
  console.log('💡 Next steps:');
  console.log('   1. Start the dev server: pnpm dev');
  console.log('   2. Open http://localhost:3001');
  console.log('   3. Check Dashboard shows "3 Total Clients"');
  console.log('   4. Verify all features work correctly');
  console.log('');
}

rebuildDatabase().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
