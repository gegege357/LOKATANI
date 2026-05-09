import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Cpu, Camera, Bell, Shield, Wifi, Save, RotateCcw, AlertTriangle, Mail, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

const C = { primary: "#328E6E", secondary: "#67AE6E", accent: "#90C67C" };

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative flex-shrink-0 rounded-full transition-all"
      style={{ width: 36, height: 20, background: checked ? C.primary : "rgba(255,255,255,0.15)", boxShadow: checked ? `0 0 10px ${C.primary}60` : "none" }}
    >
      <motion.div
        animate={{ x: checked ? 18 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
      />
    </button>
  );
}

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white" style={{ fontWeight: 500, fontSize: 13 }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{sub}</div>}
      </div>
      <div className="flex-shrink-0 flex items-center pt-0.5">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const { emailNotifEnabled, setEmailNotifEnabled, emailSending } = useNotifications();
  const [settings, setSettings] = useState({
    autoSpray: true,
    notifications: true,
    pirSensor: true,
    nightMode: false,
    multiCamera: false,
    aiThreshold: 75,
    cooldownTime: 5,
    sprayDuration: 10,
  });

  const toggle = (key: keyof typeof settings) =>
    setSettings((s) => ({ ...s, [key]: !s[key] }));

  if (user?.role !== "admin") {
    return (
      <div className="px-4 lg:px-6 py-5 flex items-center justify-center h-full" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: "#f59e0b" }} />
          <h2 className="text-white mb-2" style={{ fontWeight: 700, fontSize: 20 }}>Akses Ditolak</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>Halaman ini hanya dapat diakses oleh Administrator</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      icon: Cpu,
      title: "AI Detection",
      items: [
        {
          label: "Auto Spray Pest Detection",
          sub: "Aktifkan spray otomatis saat hama terdeteksi",
          control: <ToggleSwitch checked={settings.autoSpray} onChange={() => toggle("autoSpray")} />,
        },
        {
          label: "AI Confidence Threshold",
          sub: `Minimum kepercayaan AI untuk trigger: ${settings.aiThreshold}%`,
          control: (
            <input
              type="range" min={50} max={99} value={settings.aiThreshold}
              onChange={(e) => setSettings((s) => ({ ...s, aiThreshold: Number(e.target.value) }))}
              className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${C.primary} 0%, ${C.primary} ${((settings.aiThreshold - 50) / 49) * 100}%, rgba(255,255,255,0.1) ${((settings.aiThreshold - 50) / 49) * 100}%, rgba(255,255,255,0.1) 100%)` }}
            />
          ),
        },
      ],
    },
    {
      icon: Camera,
      title: "Kamera & Sensor",
      items: [
        {
          label: "PIR Motion Sensor",
          sub: "Aktifkan sensor gerak PIR untuk deteksi awal",
          control: <ToggleSwitch checked={settings.pirSensor} onChange={() => toggle("pirSensor")} />,
        },
        {
          label: "Multi-Camera Mode",
          sub: "Monitoring dari beberapa kamera sekaligus",
          control: <ToggleSwitch checked={settings.multiCamera} onChange={() => toggle("multiCamera")} />,
        },
        {
          label: "Night Vision Mode",
          sub: "Aktifkan mode malam untuk kamera infrared",
          control: <ToggleSwitch checked={settings.nightMode} onChange={() => toggle("nightMode")} />,
        },
      ],
    },
    {
      icon: Bell,
      title: "Notifikasi",
      items: [
        {
          label: "Push Notification",
          sub: "Notifikasi real-time saat hama terdeteksi",
          control: <ToggleSwitch checked={settings.notifications} onChange={() => toggle("notifications")} />,
        },
        {
          label: "Email Alert ke Gmail",
          sub: emailNotifEnabled
            ? `Aktif — mengirim ke ${user?.email ?? "email Anda"}`
            : "Nonaktif — tidak ada email yang dikirim",
          control: (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!user?.email) {
                    alert("Email user tidak ditemukan di sesi Anda!");
                    return;
                  }
                  alert(`Mencoba kirim test email ke: ${user.email} ... Cek console untuk progress`);
                  // Use a small timeout to let the alert close before triggering context
                  setTimeout(() => {
                    const time = new Date().toLocaleTimeString('id-ID');
                    addNotification({
                      title: `Test Email Notifikasi (${time})`,
                      message: "Ini adalah email tes dari sistem LOKATANI. Jika Anda menerima ini, sistem berjalan normal.",
                      severity: "info",
                      type: "system_alert"
                    });
                  }, 500);
                }}
                className="px-3 py-1.5 rounded-lg text-xs mr-2 transition-all"
                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Kirim Tes
              </button>
              {emailSending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#90C67C" }} />
              )}
              {emailNotifEnabled && !emailSending && (
                <CheckCircle className="w-3.5 h-3.5" style={{ color: "#90C67C" }} />
              )}
              <ToggleSwitch
                checked={emailNotifEnabled}
                onChange={() => setEmailNotifEnabled(!emailNotifEnabled)}
              />
            </div>
          ),
        },
      ],
    },
    {
      icon: Shield,
      title: "Sprayer Control",
      items: [
        {
          label: "Durasi Spray Default",
          sub: `Durasi spray saat ini: ${settings.sprayDuration} detik`,
          control: (
            <input
              type="range" min={5} max={60} value={settings.sprayDuration}
              onChange={(e) => setSettings((s) => ({ ...s, sprayDuration: Number(e.target.value) }))}
              className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${C.primary} 0%, ${C.primary} ${((settings.sprayDuration - 5) / 55) * 100}%, rgba(255,255,255,0.1) ${((settings.sprayDuration - 5) / 55) * 100}%, rgba(255,255,255,0.1) 100%)` }}
            />
          ),
        },
        {
          label: "Cooldown Waktu",
          sub: `Jeda antar spray: ${settings.cooldownTime} menit`,
          control: (
            <input
              type="range" min={1} max={30} value={settings.cooldownTime}
              onChange={(e) => setSettings((s) => ({ ...s, cooldownTime: Number(e.target.value) }))}
              className="w-24 h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${C.primary} 0%, ${C.primary} ${((settings.cooldownTime - 1) / 29) * 100}%, rgba(255,255,255,0.1) ${((settings.cooldownTime - 1) / 29) * 100}%, rgba(255,255,255,0.1) 100%)` }}
            />
          ),
        },
      ],
    },
  ];

  return (
    <div className="px-4 lg:px-6 py-5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-white truncate" style={{ fontWeight: 700, fontSize: 18 }}>System Settings</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Konfigurasi sistem deteksi hama</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-sm text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, fontWeight: 600 }}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sections.map((section, si) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.1 }}
              className="rounded-2xl p-5"
              style={{ background: "rgba(13,43,31,0.8)", border: "1px solid rgba(144,198,124,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${C.primary}30` }}>
                  <Icon className="w-4 h-4" style={{ color: C.accent }} />
                </div>
                <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>{section.title}</h3>
              </div>
              {section.items.map((item) => (
                <SettingRow key={item.label} label={item.label} sub={item.sub}>
                  {item.control}
                </SettingRow>
              ))}
            </motion.div>
          );
        })}
      </div>

      {/* System info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-4 rounded-2xl p-5"
        style={{ background: "rgba(13,43,31,0.8)", border: "1px solid rgba(144,198,124,0.15)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${C.primary}30` }}>
            <Wifi className="w-4 h-4" style={{ color: C.accent }} />
          </div>
          <h3 className="text-sm text-white" style={{ fontWeight: 600 }}>Informasi Sistem</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Versi Firmware", value: "v2.1.3" },
            { label: "Model AI", value: "YOLOv8-Nano" },
            { label: "Dataset", value: "2450 gambar" },
            { label: "Akurasi Model", value: "96.8%" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>{label}</div>
              <div className="text-sm text-white mt-0.5" style={{ fontWeight: 600, fontSize: 12 }}>{value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
