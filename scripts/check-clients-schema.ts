import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL!);

async function checkClientsSchema() {
  try {
    console.log('🔍 Checking clients table schema...\n');
    
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'clients'
      ORDER BY ordinal_position
    `;
    
    console.log('📊 Clients table columns:');
    columns.forEach(c => console.log(`  - ${c.column_name} (${c.data_type})`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
    process.exit();
  }
}

checkClientsSchema();
