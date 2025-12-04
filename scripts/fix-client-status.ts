import postgres from 'postgres';
import 'dotenv/config';

async function fixClientStatus() {
  console.log('🔧 Fixing Client Status...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const sql = postgres(process.env.DATABASE_URL);

  try {
    // Check current status
    console.log('📊 Current client status:');
    const beforeClients = await sql`SELECT id, name, status FROM clients ORDER BY id`;
    beforeClients.forEach(client => {
      console.log(`   - ID ${client.id}: ${client.name} (${client.status})`);
    });

    // Update all clients to active
    console.log('\n🔄 Setting all clients to "active" status...');
    const result = await sql`
      UPDATE clients 
      SET status = 'active' 
      WHERE status != 'active'
      RETURNING id, name, status
    `;

    if (result.length > 0) {
      console.log(`\n✅ Updated ${result.length} client(s):`);
      result.forEach(client => {
        console.log(`   - ID ${client.id}: ${client.name} → ${client.status}`);
      });
    } else {
      console.log('\n✅ All clients were already active!');
    }

    // Verify the fix
    console.log('\n📊 Verifying fix...');
    const afterClients = await sql`SELECT id, name, status FROM clients WHERE status = 'active' ORDER BY id`;
    console.log(`   Active clients now: ${afterClients.length}`);
    
    afterClients.forEach(client => {
      console.log(`   - ID ${client.id}: ${client.name} (${client.status})`);
    });

    // Count cattle per client
    const cattlePerClient = await sql`
      SELECT 
        c.id,
        c.name,
        COUNT(ca.id) as cattle_count
      FROM clients c
      LEFT JOIN cattle ca ON ca.client_id = c.id AND ca.status = 'active'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY c.id
    `;

    console.log('\n📊 Cattle distribution:');
    let totalCattle = 0;
    cattlePerClient.forEach(row => {
      const count = Number(row.cattle_count);
      totalCattle += count;
      console.log(`   - ${row.name}: ${count} cattle`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ FIX COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Active clients: ${afterClients.length}`);
    console.log(`Total cattle: ${totalCattle}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your dev server (pnpm dev)');
    console.log('   2. Refresh the dashboard in your browser');
    console.log('   3. Check that "Active Clients" now shows the correct count');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

fixClientStatus();
