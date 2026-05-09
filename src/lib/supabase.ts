import { createClient } from "@supabase/supabase-js";

// Menggunakan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY dari file .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://brfuwgkkvsnbpmssfbwx.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_276gBvf7bSuE8QW72fQr2w_Matt6CpN";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
