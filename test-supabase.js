import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://brfuwgkkvsnbpmssfbwx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_276gBvf7bSuE8QW72fQr2w_Matt6CpN';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const googleUser = {
    sub: '12345',
    email: 'test@example.com'
  };
  
  console.log('Testing .or() query with double quotes...');
  const res1 = await supabase
        .from("users")
        .select("*")
        .or(`"googleId".eq."${googleUser.sub}",email.eq."${googleUser.email}"`)
        .maybeSingle();
        
  console.log('Result 1:', res1);

  console.log('Testing standard .or() query without quotes...');
  const res2 = await supabase
        .from("users")
        .select("*")
        .or(`googleId.eq.${googleUser.sub},email.eq.${googleUser.email}`)
        .maybeSingle();
        
  console.log('Result 2:', res2);
}

test();
