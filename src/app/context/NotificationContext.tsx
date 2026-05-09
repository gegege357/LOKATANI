import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../../lib/supabase";

export interface Notification {
  id: string;
  type: "pest_detected" | "motion_detected" | "sprayer_activated" | "system_alert";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  severity: "critical" | "warning" | "info";
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  sendDigestEmail: () => Promise<void>;
  emailNotifEnabled: boolean;
  setEmailNotifEnabled: (val: boolean) => void;
  emailSending: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

const STORAGE_EMAIL_PREF = "lokatani_email_notif";

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "pest_detected",
    title: "Pest Detected: Caterpillar",
    message: "Camera 1 detected Caterpillar with 94.2% confidence at Zone A",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    severity: "critical",
  },
  {
    id: "n2",
    type: "sprayer_activated",
    title: "Sprayer Activated",
    message: "Auto-spray triggered for Zone A after pest detection",
    timestamp: new Date(Date.now() - 2.5 * 60 * 1000),
    read: false,
    severity: "warning",
  },
  {
    id: "n3",
    type: "motion_detected",
    title: "Motion Detected",
    message: "PIR sensor triggered in Zone B – no pest confirmed",
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    severity: "info",
  },
  {
    id: "n4",
    type: "pest_detected",
    title: "Pest Detected: Grasshopper",
    message: "Camera 2 detected Grasshopper with 88.7% confidence at Zone C",
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: true,
    severity: "critical",
  },
  {
    id: "n5",
    type: "system_alert",
    title: "High CPU Usage",
    message: "Raspberry Pi CPU usage exceeded 85% – consider restarting",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    severity: "warning",
  },
];

// Generate HTML template email yang cantik
function buildEmailHtml(n: Omit<Notification, "id" | "timestamp" | "read">, userEmail: string): string {
  const severityColor = n.severity === "critical" ? "#ef4444" : n.severity === "warning" ? "#f59e0b" : "#90C67C";
  const severityLabel = n.severity === "critical" ? "KRITIS" : n.severity === "warning" ? "PERINGATAN" : "INFO";
  const typeIcon = n.type === "pest_detected" ? "🐛" : n.type === "sprayer_activated" ? "💧" : n.type === "motion_detected" ? "📡" : "⚙️";
  const now = new Date().toLocaleString("id-ID", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit"
  });

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${n.title}</title>
</head>
<body style="margin:0;padding:0;background:#0a2818;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a2818;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header Logo -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,#328E6E,#67AE6E);display:inline-block;line-height:40px;text-align:center;font-size:20px;">🌿</div>
                <span style="font-size:22px;font-weight:700;color:#90C67C;letter-spacing:-0.5px;">LOKATANI</span>
              </div>
              <p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Sistem Monitoring Hama Otomatis</p>
            </td>
          </tr>

          <!-- Alert Badge -->
          <tr>
            <td style="padding-bottom:16px;text-align:center;">
              <span style="display:inline-block;background:${severityColor}22;border:1px solid ${severityColor}55;color:${severityColor};padding:4px 14px;border-radius:99px;font-size:11px;font-weight:700;letter-spacing:1px;">
                ${severityLabel}
              </span>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <div style="background:rgba(13,43,31,0.95);border:1px solid rgba(144,198,124,0.2);border-radius:20px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">

                <!-- Card Header -->
                <div style="background:linear-gradient(135deg,${severityColor}22,${severityColor}11);border-bottom:1px solid ${severityColor}33;padding:24px 28px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <div style="font-size:32px;margin-bottom:8px;">${typeIcon}</div>
                        <h1 style="margin:0;font-size:20px;font-weight:700;color:white;line-height:1.3;">${n.title}</h1>
                        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.5;">${n.message}</p>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Card Body -->
                <div style="padding:24px 28px;">
                  <!-- Detail Rows -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding-bottom:12px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:50%;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px;">Tipe Notifikasi</div>
                              <div style="font-size:13px;color:white;font-weight:600;">${n.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                            </td>
                            <td style="width:4px;"></td>
                            <td style="width:50%;padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px;">Tingkat Urgensi</div>
                              <div style="font-size:13px;color:${severityColor};font-weight:600;">${severityLabel}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:10px 12px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
                              <div style="font-size:10px;color:rgba(255,255,255,0.35);margin-bottom:3px;text-transform:uppercase;letter-spacing:0.5px;">Waktu Deteksi</div>
                              <div style="font-size:13px;color:white;font-weight:600;">${now}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- CTA Button -->
                  <div style="text-align:center;">
                    <a href="https://lokatani.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#328E6E,#67AE6E);color:white;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                      Lihat Dashboard →
                    </a>
                  </div>
                </div>

                <!-- Footer -->
                <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);">
                  <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;">
                    Email ini dikirim ke <strong style="color:rgba(255,255,255,0.4);">${userEmail}</strong> karena Anda mengaktifkan Email Notifikasi di LOKATANI.<br>
                    Untuk menonaktifkan, pergi ke <strong style="color:#90C67C;">Settings → Notifikasi → Email Alert</strong>
                  </p>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);">© 2026 LOKATANI · Sistem Deteksi Hama Otomatis</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [emailNotifEnabled, setEmailNotifEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_EMAIL_PREF);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [emailSending, setEmailSending] = useState(false);

  const setEmailNotifEnabled = useCallback((val: boolean) => {
    setEmailNotifEnabledState(val);
    try {
      localStorage.setItem(STORAGE_EMAIL_PREF, JSON.stringify(val));
    } catch {}
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const addNotification = useCallback(
    async (n: Omit<Notification, "id" | "timestamp" | "read">) => {
      // 1. Tambah ke state lokal
      setNotifications((prev) => [
        { ...n, id: Date.now().toString(), timestamp: new Date(), read: false },
        ...prev,
      ]);

      // 2. Kirim email jika preferensi aktif
      if (!emailNotifEnabled) return;

      try {
        // Ambil user dari localStorage (session)
        const sessionRaw = localStorage.getItem("auth_user");
        if (!sessionRaw) return;

        const sessionData = JSON.parse(decodeURIComponent(atob(sessionRaw)));
        let userEmail = sessionData?.email;
        if (!userEmail) return; // Tidak ada email tujuan
        const userName = sessionData?.name;

        setEmailSending(true);

        const emailSubject =
          n.severity === "critical"
            ? `🚨 [LOKATANI] ${n.title}`
            : n.severity === "warning"
            ? `⚠️ [LOKATANI] ${n.title}`
            : `ℹ️ [LOKATANI] ${n.title}`;

        const html = buildEmailHtml(n, userEmail);

        console.log("Mencoba mengirim email ke:", userEmail);
        let result = await supabase.functions.invoke("send-email", {
          body: {
            to: userEmail,
            subject: emailSubject,
            html,
            type: n.type,
            severity: n.severity,
          },
        });

        if (result.error) {
          console.error("Failed to send email notification:", result.error);
          // Tambahkan notif error sementara agar user tahu
          alert(`Gagal mengirim email. Pastikan Edge Function "send-email" sudah di-deploy dengan kredensial GMAIL_USER dan GMAIL_APP_PASSWORD yang benar. Detail: ${result.error.message}`);
        } else {
          console.log("Email berhasil dikirim!");
        }
      } catch (err) {
        console.error("Email notification error:", err);
      } finally {
        setEmailSending(false);
      }
    },
    [emailNotifEnabled]
  );

  const sendDigestEmail = useCallback(async () => {
    try {
      const sessionRaw = localStorage.getItem("auth_user");
      if (!sessionRaw) {
        alert("Sesi tidak ditemukan. Silakan login kembali.");
        return;
      }

      const sessionData = JSON.parse(decodeURIComponent(atob(sessionRaw)));
      let userEmail = sessionData?.email;
      if (!userEmail) {
        alert("Sesi tidak memiliki email valid.");
        return;
      }

      setEmailSending(true);

      const emailSubject = `📋 [LOKATANI] Ringkasan ${notifications.length} Notifikasi`;
      
      let itemsHtml = notifications.map(n => {
        const color = n.severity === "critical" ? "#ef4444" : n.severity === "warning" ? "#f59e0b" : "#90C67C";
        return `
          <div style="margin-bottom: 16px; padding: 12px; border-left: 4px solid ${color}; background: rgba(255,255,255,0.04); border-radius: 4px;">
            <div style="font-weight: bold; color: white; font-size: 14px;">${n.title}</div>
            <div style="color: rgba(255,255,255,0.7); font-size: 13px; margin-top: 4px;">${n.message}</div>
            <div style="color: rgba(255,255,255,0.4); font-size: 11px; margin-top: 6px;">${new Date(n.timestamp).toLocaleString("id-ID")}</div>
          </div>
        `;
      }).join("");

      const html = `
      <!DOCTYPE html>
      <html lang="id">
      <body style="margin:0;padding:0;background:#0a2818;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="padding: 32px 16px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #90C67C; text-align: center;">Ringkasan Notifikasi LOKATANI</h2>
          <p style="color: white; text-align: center;">Berikut adalah ${notifications.length} notifikasi terakhir dari sistem Anda:</p>
          <div style="margin-top: 24px;">
            ${itemsHtml}
          </div>
          <div style="text-align:center; margin-top: 32px;">
            <a href="https://lokataniguard.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#328E6E,#67AE6E);color:white;text-decoration:none;padding:12px 32px;border-radius:12px;font-size:14px;font-weight:600;">Buka Dashboard</a>
          </div>
        </div>
      </body>
      </html>
      `;

      console.log("Mengirim digest email ke:", userEmail);
      let result = await supabase.functions.invoke("send-email", {
        body: {
          to: userEmail,
          subject: emailSubject,
          html,
          type: "system_alert",
          severity: "info",
        },
      });

      if (result.error) {
        alert(`Gagal mengirim email. Pastikan rahasia GMAIL di Supabase sudah dikonfigurasi. Detail: ${result.error.message}`);
      } else {
        alert("Semua notifikasi berhasil dikirim ke email Anda!");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengirim digest.");
    } finally {
      setEmailSending(false);
    }
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllRead,
        markRead,
        addNotification,
        sendDigestEmail,
        emailNotifEnabled,
        setEmailNotifEnabled,
        emailSending,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
