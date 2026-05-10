import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { HardDrive, Wrench, Plus, Edit2, Trash2, X, Info, Search, RefreshCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type DeviceTool = {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "maintenance";
  notes: string;
};

type Device = {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  deviceType?: string;
  metricValue?: string;
  tools: DeviceTool[];
  createdAt: string;
};

const STORAGE_KEY = "lokatani_devices";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

const DEFAULT_DEVICES: Device[] = [
  {
    id: "device-001",
    name: "Sensor Gerak (RCWL)",
    location: "Area Tanaman",
    status: "online",
    deviceType: "Sensor",
    metricValue: "Counting Aktif",
    createdAt: "2026-05-10",
    tools: [
      { id: "tool-001", name: "RCWL-0516 Node 1", type: "Sensor", status: "active", notes: "Jalur 1" },
      { id: "tool-002", name: "RCWL-0516 Node 2", type: "Sensor", status: "active", notes: "Jalur 1" },
    ],
  },
  {
    id: "device-002",
    name: "Kamera Validasi",
    location: "Area Utama",
    status: "online",
    deviceType: "Kamera",
    metricValue: "1080p, YOLO Ready",
    createdAt: "2026-05-10",
    tools: [
      { id: "tool-003", name: "Camera Module", type: "Sensor", status: "active", notes: "Deteksi hama visual" },
    ],
  },
  {
    id: "device-003",
    name: "Relay Controller",
    location: "Panel Kontrol",
    status: "online",
    deviceType: "Actuator",
    metricValue: "Standby",
    createdAt: "2026-05-10",
    tools: [
      { id: "tool-004", name: "Relay Switch", type: "Actuator", status: "active", notes: "Kontrol penyemprotan" },
    ],
  },
];

const sanitize = (str: string) => str.replace(/[<>'";()]/g, "").trim();

export function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_DEVICES;
    } catch {
      return DEFAULT_DEVICES;
    }
  });
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "maintenance" | "offline">("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ name: "", location: "", status: "online", deviceType: "", metricValue: "" });
  const [toolForm, setToolForm] = useState({ name: "", type: "Sensor", status: "active", notes: "" });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devices));
  }, [devices]);

  const activeDevice = devices.find((device) => device.id === currentDeviceId) || null;
  const editingDevice = editingDeviceId ? devices.find((device) => device.id === editingDeviceId) : null;
  const editingTool = editingDevice?.tools.find((tool) => tool.id === editingToolId) || null;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredDevices = devices.filter((device) => {
    const matchesSearch = normalizedQuery
      ? device.name.toLowerCase().includes(normalizedQuery) || device.location.toLowerCase().includes(normalizedQuery)
      : true;

    const matchesFilter =
      statusFilter === "all"
        ? true
        : statusFilter === "maintenance"
        ? device.tools.some((tool) => tool.status === "maintenance")
        : device.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const maintenanceCount = devices.reduce((count, device) => count + device.tools.filter((tool) => tool.status === "maintenance").length, 0);
  const offlineCount = devices.filter((device) => device.status === "offline").length;

  const getDeviceIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("suhu")) return "🌡️";
    if (lower.includes("kelembaban")) return "💧";
    if (lower.includes("pompa")) return "🚰";
    if (lower.includes("gateway")) return "📡";
    if (lower.includes("kamera")) return "📷";
    if (lower.includes("nutrisi")) return "⚗️";
    return "🔧";
  };

  const getDeviceMetrics = (device: Device) => {
    const name = device.name.toLowerCase();
    if (name.includes("suhu")) return { value: "28°C", label: "Normal", color: "#4ade80" };
    if (name.includes("kelembaban")) return { value: "70%", label: "Optimal", color: "#4ade80" };
    if (name.includes("pompa")) return { value: "150 L/m", label: "Menyala", color: "#38bdf8" };
    if (name.includes("gateway")) return { value: "99.8%", label: "Kuat", color: "#4ade80" };
    if (name.includes("kamera")) return { value: "1080p", label: "Aktif", color: "#4ade80" };
    if (name.includes("nutrisi")) return { value: "6.8 pH", label: "Normal", color: "#4ade80" };
    if (device.tools.length > 0) return { value: `${device.tools.length}`, label: `Tool${device.tools.length > 1 ? 's' : ''} Aktif`, color: "#38bdf8" };
    return { value: "-", label: "Belum terpasang", color: "#f59e0b" };
  };



  const openEditDevice = (deviceId: string) => {
    const device = devices.find((item) => item.id === deviceId);
    if (!device) return;
    setEditingDeviceId(deviceId);
    setDeviceForm({ name: device.name, location: device.location, status: device.status, deviceType: device.deviceType || "", metricValue: device.metricValue || "" });
    setShowDeviceModal(true);
  };

  const saveDevice = (event: React.FormEvent) => {
    event.preventDefault();
    const name = sanitize(deviceForm.name);
    const location = sanitize(deviceForm.location);
    if (!name || !location) return;

    if (editingDeviceId) {
      setDevices((current) =>
        current.map((device) =>
          device.id === editingDeviceId
            ? { ...device, name, location, status: deviceForm.status, deviceType: deviceForm.deviceType, metricValue: deviceForm.metricValue }
            : device
        )
      );
    } else {
      setDevices((current) => [
        ...current,
        {
          id: `device-${Date.now()}`,
          name,
          location,
          status: deviceForm.status as "online" | "offline",
          deviceType: deviceForm.deviceType,
          metricValue: deviceForm.metricValue,
          tools: [],
          createdAt: new Date().toISOString().split("T")[0],
        },
      ]);
    }

    setShowDeviceModal(false);
    setEditingDeviceId(null);
  };

  const removeDevice = (deviceId: string) => {
    if (!window.confirm("Hapus perangkat ini?")) return;
    setDevices((current) => current.filter((device) => device.id !== deviceId));
    if (currentDeviceId === deviceId) setCurrentDeviceId(null);
  };

  const openAddTool = (deviceId: string) => {
    setCurrentDeviceId(deviceId);
    setEditingToolId(null);
    setToolForm({ name: "", type: "Sensor", status: "active", notes: "" });
    setShowToolModal(true);
  };

  const openEditTool = (deviceId: string, toolId: string) => {
    const device = devices.find((item) => item.id === deviceId);
    const tool = device?.tools.find((item) => item.id === toolId);
    if (!device || !tool) return;
    setCurrentDeviceId(deviceId);
    setEditingToolId(toolId);
    setToolForm({ name: tool.name, type: tool.type, status: tool.status, notes: tool.notes });
    setShowToolModal(true);
  };

  const saveTool = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeDevice) return;

    const name = sanitize(toolForm.name);
    const type = sanitize(toolForm.type);
    const notes = sanitize(toolForm.notes);
    if (!name || !type) return;

    setDevices((current) =>
      current.map((device) => {
        if (device.id !== activeDevice.id) return device;
        if (editingToolId) {
          return {
            ...device,
            tools: device.tools.map((tool) =>
              tool.id === editingToolId
                ? { ...tool, name, type, status: toolForm.status as DeviceTool["status"], notes }
                : tool
            ),
          };
        }

        return {
          ...device,
          tools: [
            ...device.tools,
            {
              id: `tool-${Date.now()}`,
              name,
              type,
              status: toolForm.status as DeviceTool["status"],
              notes,
            },
          ],
        };
      })
    );

    setShowToolModal(false);
    setEditingToolId(null);
  };

  const removeTool = (deviceId: string, toolId: string) => {
    if (!window.confirm("Hapus alat ini?")) return;
    setDevices((current) =>
      current.map((device) =>
        device.id !== deviceId
          ? device
          : { ...device, tools: device.tools.filter((tool) => tool.id !== toolId) }
      )
    );
  };

  const activeDevices = devices.filter((device) => device.status === "online").length;
  const totalTools = devices.reduce((count, device) => count + device.tools.length, 0);

  const syncDevices = () => {
    setIsSyncing(true);
    setTimeout(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setDevices(JSON.parse(saved));
      } finally {
        setIsSyncing(false);
      }
    }, 700);
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
              <h1 className="text-white text-3xl font-bold">Perangkat & Sensor</h1>
              <p className="text-sm text-white/50">Kelola dan pantau semua perangkat IoT di lahan Anda.</p>
            </div>
          </div>
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[
          { label: "Total Perangkat", value: devices.length },
          { label: "Aktif", value: activeDevices },
          { label: "Maintenance", value: maintenanceCount },
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
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Cari perangkat berdasarkan nama atau lokasi..."
            className="w-full rounded-3xl py-4 pl-12 pr-4 bg-transparent text-sm text-white outline-none"
            style={{ border: "none" }}
          />
        </div>
        <button
          onClick={syncDevices}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
          style={{ background: "rgba(255,255,255,0.06)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <RefreshCcw className="w-4 h-4" />
          {isSyncing ? "Sinkronisasi..." : "Sinkronisasi"}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: "all", label: "Semua" },
          { key: "online", label: "Aktif" },
          { key: "maintenance", label: "Maintenance" },
          { key: "offline", label: "Nonaktif" },
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
          const metrics = getDeviceMetrics(device);
          const icon = getDeviceIcon(device.name);
          return (
            <div key={device.id} className="rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="p-5 border-b border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                        <span className="text-xl">{icon}</span>
                      </div>
                      <span className="text-xs uppercase tracking-[0.16em] text-white/50">{device.location}</span>
                    </div>
                    <h2 className="text-white" style={{ fontWeight: 700, fontSize: 16 }}>{device.name}</h2>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{device.createdAt}</p>
                  </div>
                  <div className="text-xs rounded-full px-3 py-1" style={{ background: device.status === "online" ? "rgba(74,222,128,0.12)" : "rgba(248,113,113,0.12)", color: device.status === "online" ? "#4ade80" : "#f87171" }}>
                    {device.status === "online" ? "Aktif" : "Offline"}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-[0.12em] mb-2">Nilai</div>
                    <div className="text-3xl text-white font-bold">{metrics.value}</div>
                  </div>
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-[0.12em] mb-2">Keterangan</div>
                    <div className="text-sm" style={{ color: metrics.color }}>{metrics.label}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-white/50">{device.tools.length} alatan terdaftar</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditDevice(device.id)}
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeDevice(device.id)}
                      className="px-3 py-1 rounded-full text-xs"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {device.tools.length === 0 ? (
                    <div className="rounded-2xl p-4 text-xs text-white/50" style={{ background: "rgba(255,255,255,0.03)" }}>
                      Belum ada alat ditambahkan untuk perangkat ini.
                    </div>
                  ) : (
                    device.tools.map((tool) => (
                      <div key={tool.id} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm text-white font-semibold mb-1">{tool.name}</div>
                            <div className="text-xs text-white/50">{tool.type} • {tool.notes || "Tanpa catatan"}</div>
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.2em] rounded-full px-2 py-1" style={{ background: tool.status === "active" ? "rgba(74,222,128,0.12)" : tool.status === "maintenance" ? "rgba(248,113,113,0.12)" : "rgba(255,255,255,0.08)", color: tool.status === "active" ? "#4ade80" : tool.status === "maintenance" ? "#f87171" : "rgba(255,255,255,0.65)" }}>
                            {tool.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showDeviceModal &&
        ReactDOM.createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", background: "rgba(13,43,31,0.98)", border: "1px solid rgba(144,198,124,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
              <div className="p-6 flex items-start justify-between gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>
                    {editingDeviceId ? "Edit Perangkat" : "Tambah Perangkat Baru"}
                  </h2>
                </div>
                <button onClick={() => setShowDeviceModal(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <form onSubmit={saveDevice} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Nama Perangkat</label>
                  <input
                    value={deviceForm.name}
                    onChange={(event) => setDeviceForm({ ...deviceForm, name: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                    placeholder="Contoh: Sensor Suhu Baru"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Lokasi</label>
                  <input
                    value={deviceForm.location}
                    onChange={(event) => setDeviceForm({ ...deviceForm, location: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                    placeholder="Contoh: Area Utara Lahan"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Jenis Perangkat</label>
                  <select
                    value={deviceForm.deviceType}
                    onChange={(event) => setDeviceForm({ ...deviceForm, deviceType: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                  >
                    <option value="">Pilih Jenis</option>
                    <option value="Sensor Suhu">Sensor Suhu</option>
                    <option value="Sensor Kelembaban">Sensor Kelembaban</option>
                    <option value="Pompa Irigasi">Pompa Irigasi</option>
                    <option value="Gateway IoT">Gateway IoT</option>
                    <option value="Sensor Lainnya">Sensor Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</label>
                  <select
                    value={deviceForm.status}
                    onChange={(event) => setDeviceForm({ ...deviceForm, status: event.target.value as "online" | "offline" })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                  >
                    <option value="online">Aktif</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Nilai/Kondisi</label>
                  <input
                    value={deviceForm.metricValue}
                    onChange={(event) => setDeviceForm({ ...deviceForm, metricValue: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                    placeholder="Contoh: 28°C, 70%, Normal"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 px-4 py-3 rounded-full text-sm font-semibold text-black" style={{ background: "#5eead4" }}>
                    {editingDeviceId ? "Simpan Perangkat" : "Simpan Perangkat"}
                  </button>
                  <button type="button" onClick={() => setShowDeviceModal(false)} className="flex-1 px-4 py-3 rounded-full text-sm font-semibold text-white" style={{ background: "rgba(255,255,255,0.1)" }}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {showToolModal && activeDevice &&
        ReactDOM.createPortal(
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.72)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            <div style={{ width: "100%", maxWidth: 520, borderRadius: 24, overflow: "hidden", background: "rgba(13,43,31,0.98)", border: "1px solid rgba(144,198,124,0.2)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
              <div className="p-6 flex items-start justify-between gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <h2 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>
                    {editingToolId ? "Edit Alat" : "Tambah Alat"}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {editingToolId ? "Perbarui informasi alat yang terpasang." : `Tambahkan alat untuk perangkat ${activeDevice.name}.`}
                  </p>
                </div>
                <button onClick={() => setShowToolModal(false)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <form onSubmit={saveTool} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Nama Alat</label>
                  <input
                    value={toolForm.name}
                    onChange={(event) => setToolForm({ ...toolForm, name: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                    placeholder="Contoh: PH Meter"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Jenis Alat</label>
                  <input
                    value={toolForm.type}
                    onChange={(event) => setToolForm({ ...toolForm, type: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none"
                    placeholder="Contoh: Sensor"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Status</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["active", "idle", "maintenance"] as const).map((statusOption) => (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={() => setToolForm({ ...toolForm, status: statusOption })}
                        className="px-3 py-2 rounded-2xl text-sm"
                        style={{
                          background: toolForm.status === statusOption ? C.primary : "rgba(255,255,255,0.05)",
                          color: toolForm.status === statusOption ? "white" : "rgba(255,255,255,0.7)",
                          border: toolForm.status === statusOption ? "1px solid rgba(144,198,124,0.3)" : "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        {statusOption}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-2" style={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>Catatan</label>
                  <textarea
                    value={toolForm.notes}
                    onChange={(event) => setToolForm({ ...toolForm, notes: event.target.value })}
                    className="w-full rounded-2xl px-4 py-3 text-sm text-white bg-white/5 border border-white/10 outline-none min-h-[100px]"
                    placeholder="Contoh: Memantau pH larutan setiap 30 menit"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowToolModal(false)} className="px-4 py-2 rounded-2xl text-sm text-white/70" style={{ background: "rgba(255,255,255,0.05)" }}>
                    Batal
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-2xl text-sm text-white" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                    {editingToolId ? "Simpan Alat" : "Tambah Alat"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
