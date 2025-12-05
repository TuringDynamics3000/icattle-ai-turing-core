import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!);

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...\n');
    
    // Check tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Tables in database:');
    tables.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check cattle table columns
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'cattle'
      ORDER BY ordinal_position
    `;
    console.log('\n📊 Cattle table columns:');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    
    // Check cattle count
    const count = await sql`SELECT COUNT(*) as count FROM cattle`;
    console.log(`\n🐄 Total cattle: ${count[0].count}`);
    
    // Check clients count
    const clientCount = await sql`SELECT COUNT(*) as count FROM clients`;
    console.log(`🏢 Total clients: ${clientCount[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
    process.exit();
  }
}

checkSchema();
