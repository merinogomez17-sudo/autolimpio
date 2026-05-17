import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatus() {
  const { data, error } = await supabase
    .from('appointments')
    .select('status');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  const statuses = new Set(data.map(d => d.status));
  console.log('DISTINCT STATUSES:', Array.from(statuses));
}

checkStatus();
