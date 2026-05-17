import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkStatus() {
  const res = await fetch(`${supabaseUrl}/rest/v1/appointments?select=status`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  if (!res.ok) {
    console.error('Error HTTP:', await res.text());
    return;
  }
  
  const data = await res.json();
  const statuses = new Set(data.map(d => d.status));
  console.log('DISTINCT STATUSES:', Array.from(statuses));
}

checkStatus();
