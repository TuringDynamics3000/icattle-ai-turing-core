import 'dotenv/config';
import postgres from "postgres";

async function check() {
  const client = postgres(process.env.DATABASE_URL!, { max: 1 });
  
  try {
    const total = await client`SELECT COUNT(*) as count FROM cattle`;
    const active = await client`SELECT COUNT(*) as count FROM cattle WHERE status = 'active'`;
    const byIdRange = await client`
      SELECT 
        CASE 
          WHEN id < 6000000 THEN 'old (< 6M)'
          ELSE 'new (>= 6M)'
        END as range,
        COUNT(*) as count,
        status
      FROM cattle 
      GROUP BY range, status
      ORDER BY range, status
    `;
    
    console.log('Total cattle:', total[0].count);
    console.log('Active cattle:', active[0].count);
    console.log('\nBy ID range and status:');
    console.table(byIdRange);
  } finally {
    await client.end();
  }
}

check();
