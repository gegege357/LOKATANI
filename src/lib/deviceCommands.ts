/**
 * sendDeviceCommand — kirim perintah ke Raspberry Pi via tabel device_commands.
 * Raspberry Pi polling tabel ini setiap COMMAND_POLL_INTERVAL detik (default 3s).
 *
 * command: "emergency_stop" | "camera_on" | "camera_off"
 *        | "rcwl_on" | "rcwl_off" | "relay_on" | "relay_off"
 */

import { supabase } from "./supabase";

export type DeviceCommand =
  | "emergency_stop"
  | "camera_on"
  | "camera_off"
  | "rcwl_on"
  | "rcwl_off"
  | "relay_on"
  | "relay_off";

export async function sendDeviceCommand(
  command: DeviceCommand,
  issuedBy?: string
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("device_commands").insert({
    command,
    status: "pending",
    issued_by: issuedBy ?? "web_dashboard",
  });

  if (error) {
    console.error("[sendDeviceCommand] Error:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** Ambil status terakhir dari heartbeat Raspberry Pi */
export async function fetchLatestHeartbeat() {
  const { data, error } = await supabase
    .from("pest_detection")
    .select("*")
    .eq("record_type", "heartbeat")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}

/** Ambil deteksi terbaru (record_type = 'detection') */
export async function fetchLatestDetection() {
  const { data, error } = await supabase
    .from("pest_detection")
    .select("*")
    .eq("record_type", "detection")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data;
}
