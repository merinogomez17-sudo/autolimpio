import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: 'c:/Users/meno0/OneDrive/Documentos/d4moments github/autolimpio/.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkSchema() {
  const tables = ['services', 'promotions', 'users', 'memberships'];
  for (const table of tables) {
    console.log(`\n--- ${table} ---`);
    // Usamos rest query pidiendo un registro con select '*' para ver los nombres de columnas
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log('Error:', error.message);
    } else {
      if (data.length > 0) {
        console.log(Object.keys(data[0]).join(', '));
      } else {
        console.log('Empty table, trying to get columns from definition might require a real SQL query...');
        // Workaround to get columns even if empty: use the 'limit 0' trick with single() to get the shape, but single errors out.
        // If data is empty array, we can't get keys via PostgREST easily. We'll use another approach if needed.
        console.log('Empty table returned 0 rows.');
      }
    }
  }
}

checkSchema();
