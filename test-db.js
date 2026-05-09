import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://brfuwgkkvsnbpmssfbwx.supabase.co';
const supabaseKey = 'sb_publishable_276gBvf7bSuE8QW72fQr2w_Matt6CpN';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase Connection...");
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error("DB Error:", error.message, error.details, error.hint);
  } else {
    console.log("DB Success! Users count (max 1):", data.length);
  }
}

test();
