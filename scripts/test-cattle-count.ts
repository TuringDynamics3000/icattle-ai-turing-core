import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!);

async function testCattleCount() {
  try {
    console.log('🔍 Checking cattle in database...\n');
    
    // Total count
    const totalResult = await sql`SELECT COUNT(*) as count FROM cattle`;
    console.log(`Total cattle in database: ${totalResult[0].count}`);
    
    // By status
    const statusResult = await sql`SELECT status, COUNT(*) as count FROM cattle GROUP BY status`;
    console.log('\nCattle by status:');
    statusResult.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    // By health
    const healthResult = await sql`SELECT health_status, COUNT(*) as count FROM cattle GROUP BY health_status`;
    console.log('\nCattle by health status:');
    healthResult.forEach(row => {
      console.log(`  ${row.health_status}: ${row.count}`);
    });
    
    // Sample cattle
    const sampleResult = await sql`SELECT nlis_id, breed, status, health_status, current_valuation FROM cattle LIMIT 5`;
    console.log('\nSample cattle:');
    sampleResult.forEach(row => {
      console.log(`  ${row.nlis_id} - ${row.breed} - Status: ${row.status} - Health: ${row.health_status} - Value: $${(row.current_valuation / 100).toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
    process.exit();
  }
}

testCattleCount();
