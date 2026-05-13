-- =============================================================
--  Lokatani Guard — Supabase Schema
--  Jalankan di: Supabase Dashboard > SQL Editor
-- =============================================================

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
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

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users"   ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users"        ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users"        ON public.users FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users"        ON public.users FOR DELETE USING (true);

INSERT INTO public.users (id, name, email, role, status, "lastLogin", "createdAt", password)
VALUES ('1', 'Admin', 'admin@hydroponics.id', 'admin', 'active', 'Belum pernah', '2026-03-01', 'admin123')
ON CONFLICT (id) DO NOTHING;


-- ── Pest Detection (dikirim dari Raspberry Pi) ───────────────
-- record_type: 'heartbeat' | 'detection' | 'emergency'
CREATE TABLE IF NOT EXISTS public.pest_detection (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp         timestamptz NOT NULL DEFAULT now(),
  record_type       text NOT NULL DEFAULT 'heartbeat',

  -- Status hardware
  camera_status     boolean DEFAULT false,
  rcwl_status       boolean DEFAULT false,
  relay_status      boolean DEFAULT false,
  system_state      text DEFAULT 'IDLE',   -- IDLE | ACTIVE | SPRAYING | EMERGENCY
  emergency         boolean DEFAULT false,

  -- Data deteksi
  pest_type         text,
  count             integer DEFAULT 0,
  confidence        float DEFAULT 0,
  spray_status      boolean DEFAULT false,
  spray_duration_sec integer DEFAULT 0,
  rcwl_validated    boolean DEFAULT false,

  -- Media & metadata
  image_url         text,
  camera_location   text DEFAULT 'main_zone',
  model_version     text DEFAULT 'v1.2',
  rpi_hostname      text DEFAULT 'rpi-hydro-01'
);

ALTER TABLE public.pest_detection ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all"   ON public.pest_detection FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.pest_detection FOR INSERT WITH CHECK (true);

-- Index untuk query dashboard yang sering dilakukan
CREATE INDEX IF NOT EXISTS idx_pest_detection_timestamp   ON public.pest_detection (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pest_detection_record_type ON public.pest_detection (record_type);

-- Aktifkan Realtime agar dashboard bisa subscribe
ALTER PUBLICATION supabase_realtime ADD TABLE public.pest_detection;


-- ── Device Commands (dikirim dari Web Dashboard ke Raspberry Pi) ──
-- command: emergency_stop | camera_on | camera_off |
--          rcwl_on | rcwl_off | relay_on | relay_off
-- status:  pending | executed | rejected
CREATE TABLE IF NOT EXISTS public.device_commands (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  command     text NOT NULL,
  status      text NOT NULL DEFAULT 'pending',
  issued_by   text,          -- email/id user yang mengirim
  executed_at timestamptz
);

ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all"   ON public.device_commands FOR SELECT USING (true);
CREATE POLICY "Enable insert for all" ON public.device_commands FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all" ON public.device_commands FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_device_commands_status     ON public.device_commands (status);
CREATE INDEX IF NOT EXISTS idx_device_commands_created_at ON public.device_commands (created_at DESC);
