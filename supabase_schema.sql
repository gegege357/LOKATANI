-- Jalankan script SQL ini di halaman "SQL Editor" pada dashboard Supabase Anda.

CREATE TABLE public.users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text DEFAULT 'user',
  avatar text,
  "googleId" text UNIQUE,
  status text DEFAULT 'active',
  "lastLogin" text,
  "createdAt" text,
  password text
);

-- Aturan Keamanan (Row Level Security)
-- Agar aplikasi dari Vercel bisa membaca dan menulis data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Buat aturan izinkan akses publik sementara (karena ini frontend yang menulis langsung tanpa Auth khusus)
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.users FOR DELETE USING (true);

-- (Opsional) Masukkan akun admin default
INSERT INTO public.users (id, name, email, role, status, "lastLogin", "createdAt", password)
VALUES ('1', 'Admin', 'admin@hydroponics.id', 'admin', 'active', 'Belum pernah', '2026-03-01', 'admin123');
