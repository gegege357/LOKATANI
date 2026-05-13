import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { HardDrive, Plus, X, Search, RefreshCcw } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Device = {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  device_type?: string;
  metric_value?: string;
  created_at: string;
};

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };
const sanitize = (str: string) => str.replace(/[<>'";()]/g, "").trim();

export function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "offline">("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ name: "", location: "", status: "online", device_type: "", metric_value: "" });

  const loadDevices = async () => {
    setIsSyncing(true);
    const { data, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
    if (!error && data) setDevices(data);
    setIsSyncing(false);
  };

  useEffect(() => {
    loadDevices();
    const channel = supabase.channel("devices_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "devices" }, () => loadDevices())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredDevices = devices.filter((device) => {
    const matchesSearch = normalizedQuery ? device.name.toLowerCase().includes(normalizedQuery) || device.location.toLowerCase().includes(normalizedQuery) : true;
    const matchesFilter = statusFilter === "all" ? true : device.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const activeDevices = devices.filter((d) => d.status === "online").length;
  const offlineCount = devices.filter((d) => d.status === "offline").length;

  const getDeviceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("suhu")) return "🌡️";
    if (lower.includes("kelembaban")) return "💧";
    if (lower.includes("pompa") || lower.includes("relay")) return "🚰";
    if (lower.includes("gateway") || lower.includes("rpi")) return "📡";
    if (lower.includes("kamera")) return "📷";
    if (lower.includes("rcwl") || lower.includes("gerak")) return "🏃";
    return "🔧";
  };

  const openEditDevice = (device: Device) => {
    setEditingDeviceId(device.id);
    setDeviceForm({ name: device.name, location: device.location, status: device.status, device_type: device.device_type || "", metric_value: device.metric_value || "" });
    setShowDeviceModal(true);
  };

  const openAddDevice = () => {
    setEditingDeviceId(null);
    setDeviceForm({ name: "", location: "", status: "online", device_type: "", metric_value: "" });
    setShowDeviceModal(true);
  };

  const saveDevice = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = sanitize(deviceForm.name);
    const location = sanitize(deviceForm.location);
    if (!name || !location) return;

    const payload = {
      name, location, status: deviceForm.status, device_type: deviceForm.device_type, metric_value: deviceForm.metric_value
    };

    if (editingDeviceId) {
      await supabase.from("devices").update(payload).eq("id", editingDeviceId);
    } else {
      await supabase.from("devices").insert([payload]);
    }

    setShowDeviceModal(false);
    setEditingDeviceId(null);
    loadDevices();
  };

  const removeDevice = async (id: string) => {
    if (!window.confirm("Hapus perangkat ini secara permanen dari database?")) return;
    await supabase.from("devices").delete().eq("id", id);
    loadDevices();
  };

  return (
    <div className="px-4 lg:px-6 py-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-3xl flex items-center justify-center" style={{ background: "rgba(50,142,110,0.15)" }}>
              <HardDrive className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold">Perangkat IoT</h1>
              <p className="text-sm text-white/50">Manajemen Perangkat terhubung ke Supabase (Tabel: devices).</p>
            </div>
          </div>
        </div>
        <button onClick={openAddDevice} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-black" style={{ background: "#5eead4" }}>
          <Plus className="w-4 h-4" /> Tambah Perangkat
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[
          { label: "Total Perangkat", value: devices.length },
          { label: "Online", value: activeDevices },
          { label: "Offline", value: offlineCount },
        ].map((stat) => (
          <div key={stat.label} className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="text-xs text-white/50 uppercase tracking-[0.12em] mb-3">{stat.label}</div>
            <div className="text-3xl text-white font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] items-center mb-6">
        <div className="relative rounded-3xl overflow-hidden bg-white/5 border border-white/10">
          <div className="absolute inset-y-0 left-4 flex items-center">
            <Search className="w-4 h-4 text-white/50" />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perangkat..."
            className="w-full rounded-3xl py-4 pl-12 pr-4 bg-transparent text-sm text-white outline-none"
            style={{ border: "none" }}
          />
        </div>
        <button onClick={loadDevices} className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold" style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)" }}>
          <RefreshCcw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Sinkronisasi..." : "Sinkronisasi"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: "all", label: "Semua" },
          { key: "online", label: "Online" },
          { key: "offline", label: "Offline" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key as typeof statusFilter)}
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              background: statusFilter === item.key ? "#1f4d3c" : "rgba(255,255,255,0.05)",
              color: statusFilter === item.key ? "#5eead4" : "rgba(255,255,255,0.65)",
              border: statusFilter === item.key ? "1px solid rgba(94,234,212,0.25)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filteredDevices.map((device) => {
          const icon = getDeviceIcon(device.name);
          return (
            <div key={device.id} className="rounded-3xl overflow-hidden p-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.08)" }}>{icon}</div>
                  <div>
                    <h2 className="text-white font-bold">{device.name}</h2>
                    <p className="text-xs text-white/50">{device.location} • {device.device_type}</p>
                  </div>
                </div>
                <div className="text-xs rounded-full px-3 py-1 font-bold" style={{ background: device.status === "online" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: device.status === "online" ? "#4ade80" : "#f87171" }}>
                  {device.status === "online" ? "ONLINE" : "OFFLINE"}
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div>
                  <div className="text-xs text-white/50 uppercase">Nilai Sensor/Status</div>
                  <div className="text-lg text-white font-bold">{device.metric_value || "-"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditDevice(device)} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/5 hover:bg-white/10">Edit</button>
                  <button onClick={() => removeDevice(device.id)} className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20">Hapus</button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredDevices.length === 0 && (
          <div className="col-span-full py-10 text-center text-white/50">Tidak ada perangkat ditemukan. Pastikan tabel `devices` di Supabase sudah dibuat.</div>
        )}
      </div>

      {showDeviceModal &&
        ReactDOM.createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", background: "rgba(13,43,31,0.98)", border: "1px solid rgba(144,198,124,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
              <div className="p-6 flex items-start justify-between gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>{editingDeviceId ? "Edit Perangkat" : "Tambah Perangkat"}</h2>
                <button onClick={() => setShowDeviceModal(false)} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5"><X className="w-4 h-4 text-white/60" /></button>
              </div>
              <form onSubmit={saveDevice} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs mb-2 text-white/60 font-semibold">Nama Perangkat</label>
                  <input required value={deviceForm.name} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none" placeholder="Contoh: Raspberry Pi Utama" />
                </div>
                <div>
                  <label className="block text-xs mb-2 text-white/60 font-semibold">Lokasi / Zona</label>
                  <input required value={deviceForm.location} onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })} className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none" placeholder="Contoh: Zona Utara" />
                </div>
                <div>
                  <label className="block text-xs mb-2 text-white/60 font-semibold">Tipe Perangkat</label>
                  <input value={deviceForm.device_type} onChange={(e) => setDeviceForm({ ...deviceForm, device_type: e.target.value })} className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none" placeholder="Contoh: Gateway, Sensor Kamera" />
                </div>
                <div>
                  <label className="block text-xs mb-2 text-white/60 font-semibold">Status</label>
                  <select value={deviceForm.status} onChange={(e) => setDeviceForm({ ...deviceForm, status: e.target.value as "online" | "offline" })} className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none">
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-2 text-white/60 font-semibold">Keterangan / Value</label>
                  <input value={deviceForm.device_type} onChange={(e) => setDeviceForm({ ...deviceForm, metric_value: e.target.value })} className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none" placeholder="Contoh: Standby, 28°C" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-3 rounded-full text-sm font-semibold text-black bg-[#5eead4]">{editingDeviceId ? "Simpan Perubahan" : "Simpan Perangkat"}</button>
                  <button type="button" onClick={() => setShowDeviceModal(false)} className="flex-1 px-4 py-3 rounded-full text-sm font-semibold text-white bg-white/10">Batal</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
