import postgres from 'postgres';
import 'dotenv/config';

async function diagnoseClientCount() {
  console.log('🔍 Diagnosing Client Count Issue...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Check total clients in database
    console.log('📊 Checking clients table...');
    const allClients = await sql`SELECT id, name, status FROM clients ORDER BY id`;
    console.log(`   Total clients in database: ${allClients.length}`);
    
    if (allClients.length > 0) {
      console.log('\n   Client details:');
      allClients.forEach(client => {
        console.log(`   - ID ${client.id}: ${client.name} (${client.status})`);
      });
    }

    // Check active clients
    console.log('\n📊 Checking active clients...');
    const activeClients = await sql`SELECT id, name FROM clients WHERE status = 'active' ORDER BY id`;
    console.log(`   Active clients: ${activeClients.length}`);
    
    if (activeClients.length > 0) {
      console.log('\n   Active client details:');
      activeClients.forEach(client => {
        console.log(`   - ID ${client.id}: ${client.name}`);
      });
    }

    // Check cattle count per client
    console.log('\n📊 Checking cattle per client...');
    const cattlePerClient = await sql`
      SELECT 
        c.id,
        c.name,
        c.status,
        COUNT(ca.id) as cattle_count
      FROM clients c
      LEFT JOIN cattle ca ON ca.client_id = c.id AND ca.status = 'active'
      GROUP BY c.id, c.name, c.status
      ORDER BY c.id
    `;
    
    console.log('\n   Cattle distribution:');
    cattlePerClient.forEach(row => {
      console.log(`   - ${row.name} (${row.status}): ${row.cattle_count} cattle`);
    });

    // Check if there are any orphaned cattle (no client)
    console.log('\n📊 Checking for orphaned cattle...');
    const orphanedCattle = await sql`
      SELECT COUNT(*) as count 
      FROM cattle 
      WHERE client_id IS NULL AND status = 'active'
    `;
    console.log(`   Orphaned cattle (no client): ${orphanedCattle[0].count}`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`Total clients: ${allClients.length}`);
    console.log(`Active clients: ${activeClients.length}`);
    console.log(`Clients with cattle: ${cattlePerClient.filter(c => Number(c.cattle_count) > 0).length}`);
    
    const totalCattle = cattlePerClient.reduce((sum, c) => sum + Number(c.cattle_count), 0);
    console.log(`Total active cattle: ${totalCattle}`);

    // Check what the API would return
    console.log('\n📊 Testing API queries...');
    
    // Test getAllClients
    const apiAllClients = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
    console.log(`   getAllClients() would return: ${apiAllClients.length} clients`);
    
    // Test getActiveClients
    const apiActiveClients = await sql`SELECT * FROM clients WHERE status = 'active' ORDER BY name`;
    console.log(`   getActiveClients() would return: ${apiActiveClients.length} clients`);

    if (activeClients.length === 0 && allClients.length > 0) {
      console.log('\n⚠️  WARNING: You have clients but none are marked as "active"!');
      console.log('   This is why the dashboard shows 0 clients.');
      console.log('\n   Would you like to fix this? (Run fix-client-status.ts)');
    } else if (activeClients.length > 0) {
      console.log('\n✅ Client data looks good!');
      console.log('   If dashboard still shows 0, try restarting the dev server.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

diagnoseClientCount();
