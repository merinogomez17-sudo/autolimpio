import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../apps/admin/.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
  console.log('--- CHECKING PAGOS ---');
  const { data: pagos, error: pagosErr } = await supabase
    .from('pagos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
    
  if (pagosErr) console.error('Error pagps:', pagosErr);
  else console.log('Ultimo pago:', pagos);

  console.log('--- CHECKING APPOINTMENTS ---');
  const { data: apps, error: appsErr } = await supabase
    .from('appointments')
    .select('*, user:users!user_id(id, full_name, nivel, total_points, avatar_url), service:services(id, name, price)')
    .limit(3);
    
  if (appsErr) console.error('Error appointments:', appsErr);
  else console.log('Citas:', apps);
}

checkDb();
