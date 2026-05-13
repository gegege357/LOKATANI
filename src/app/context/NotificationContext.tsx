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
  imageUrl?: string;
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

const INITIAL_NOTIFICATIONS: Notification[] = [];

// Generate HTML template email yang cantik
// Generate HTML template email yang cantik
function buildEmailHtml(n: Omit<Notification, "id" | "timestamp" | "read">, userEmail: string): string {
  const severityColor = n.severity === "critical" ? "#ef4444" : n.severity === "warning" ? "#f59e0b" : "#90C67C";
  const severityLabel = n.severity === "critical" ? "🚨 KRITIS" : n.severity === "warning" ? "⚠️ PERINGATAN" : "ℹ️ INFO";
  const typeIcon = n.type === "pest_detected" ? "🐛" : n.type === "sprayer_activated" ? "💧" : n.type === "motion_detected" ? "📡" : "⚙️";
  const now = new Date().toLocaleString("id-ID", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${n.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#05140d;font-family:'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#05140d;padding:40px 10px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#0d2b1f;border-radius:32px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);box-shadow:0 30px 60px rgba(0,0,0,0.6);">
          
          <!-- Header Accent Bar -->
          <tr>
            <td style="height:6px;background:linear-gradient(90deg,${severityColor},#90C67C);"></td>
          </tr>

          <!-- Header Logo Section -->
          <tr>
            <td style="padding:40px 40px 20px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="width:56px;height:56px;background:rgba(144,198,124,0.1);border-radius:18px;display:inline-block;line-height:56px;text-align:center;font-size:28px;border:1px solid rgba(144,198,124,0.2);">🌿</div>
                    <div style="margin-top:16px;font-size:24px;font-weight:800;color:#90C67C;letter-spacing:-1px;text-transform:uppercase;">LOKATANI <span style="color:white;opacity:0.4;font-weight:400;">GUARD</span></div>
                    <div style="margin-top:4px;font-size:11px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:2px;font-weight:700;">Automatic Pest Control System</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Severity Badge -->
          <tr>
            <td style="padding:0 40px 30px;text-align:center;">
              <span style="background:${severityColor}15;color:${severityColor};padding:6px 16px;border-radius:100px;font-size:11px;font-weight:800;letter-spacing:1.5px;border:1px solid ${severityColor}30;display:inline-block;">
                ${severityLabel}
              </span>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:0 40px 40px;">
              <div style="background:rgba(255,255,255,0.03);border-radius:24px;padding:32px;border:1px solid rgba(255,255,255,0.05);">
                <div style="font-size:36px;margin-bottom:16px;">${typeIcon}</div>
                <h2 style="margin:0;font-size:22px;font-weight:800;color:white;line-height:1.2;">${n.title}</h2>
                <p style="margin:16px 0 0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">${n.message}</p>
                
                ${n.imageUrl ? `
                <div style="margin-top:24px;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
                  <img src="${n.imageUrl}" alt="Pest Snapshot" style="width:100%;height:auto;display:block;background-color:#000;">
                  <div style="padding:10px;background:rgba(0,0,0,0.4);text-align:center;font-size:11px;color:rgba(255,255,255,0.4);font-weight:600;text-transform:uppercase;">Snapshot dari Kamera Raspberry Pi</div>
                </div>
                ` : ''}

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background:rgba(0,0,0,0.2);border-radius:16px;">
                  <tr>
                    <td style="padding:20px;">
                      <div style="font-size:10px;color:rgba(255,255,255,0.3);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:4px;">Waktu Kejadian</div>
                      <div style="font-size:14px;color:white;font-weight:600;">${now}</div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top:32px;text-align:center;">
                  <a href="https://lokataniguard.vercel.app" style="display:inline-block;background:linear-gradient(135deg,#328E6E,#67AE6E);color:white;text-decoration:none;padding:16px 40px;border-radius:16px;font-size:15px;font-weight:700;box-shadow:0 10px 20px rgba(50,142,110,0.3);">
                    BUKA DASHBOARD UTAMA
                  </a>
                </div>
              </div>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="padding:30px 40px;background-color:rgba(0,0,0,0.2);text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);line-height:1.5;">
                Email ini dikirim otomatis ke <span style="color:#90C67C;font-weight:600;">${userEmail}</span><br>
                karena Anda mengaktifkan notifikasi kritis di sistem LOKATANI.<br><br>
                LOKATANI GUARD v5.0 • Smart Hydroponic Monitoring
              </p>
            </td>
          </tr>

        </table>

        <!-- Copyright & Unsubscribe -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:24px;">
          <tr>
            <td align="center">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.15);font-weight:500;">
                © 2026 LOKATANI Indonesia. All rights reserved.
              </p>
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

  // ── INTEGRASI REAL-TIME & HISTORY NOTIFIKASI ──
  useEffect(() => {
    // 1. Fetch history notifications from Supabase
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("pest_detection")
          .select("*")
          .in("record_type", ["detection", "emergency"])
          .neq("rpi_hostname", "USEP")
          .neq("pest_type", "Grasshopper")
          .neq("pest_type", "Whitefly")
          .neq("pest_type", "Aphid")
          .order("timestamp", { ascending: false })
          .limit(20);

        if (data) {
          const historyNotifs: Notification[] = data.map((row) => {
            const translatedPest = row.pest_type === "Caterpillar" ? "Ulat" : row.pest_type;
            const isEmergency = row.record_type === "emergency" && row.emergency;
            
            return {
              id: row.id,
              type: isEmergency ? "system_alert" : "pest_detected",
              title: isEmergency ? "🛑 EMERGENCY STOP AKTIF" : `🚨 Hama Terdeteksi: ${translatedPest}`,
              message: isEmergency 
                ? `Sistem dihentikan secara darurat pada ${row.rpi_hostname}.`
                : `Ditemukan ${row.count} ekor ${translatedPest} di ${row.camera_location} dengan tingkat keyakinan ${Math.round(row.confidence * 100)}%.`,
              severity: "critical",
              timestamp: new Date(row.timestamp),
              read: true, // History is marked as read by default to avoid clutter
              imageUrl: row.image_url || undefined,
            };
          });
          setNotifications(historyNotifs);
        }
      } catch (err) {
        console.error("Failed to fetch notification history:", err);
      }
    };

    fetchHistory();

    // 2. Real-time listener
    const channel = supabase
      .channel("realtime_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pest_detection" },
        (payload) => {
          const row = payload.new as any;
          
          // Filter out dummy data
          if (row.rpi_hostname === "USEP" || row.pest_type === "Grasshopper" || row.pest_type === "Whitefly" || row.pest_type === "Aphid") return;

          if (row.record_type === "detection") {
            const translatedPest = row.pest_type === "Caterpillar" ? "Ulat" : row.pest_type;
            addNotification({
              type: "pest_detected",
              title: `🚨 Hama Terdeteksi: ${translatedPest}`,
              message: `Ditemukan ${row.count} ekor ${translatedPest} di ${row.camera_location} dengan tingkat keyakinan ${Math.round(row.confidence * 100)}%.`,
              severity: "critical",
              imageUrl: row.image_url || undefined,
            });
          } else if (row.record_type === "emergency" && row.emergency) {
            addNotification({
              type: "system_alert",
              title: "🛑 EMERGENCY STOP AKTIF",
              message: `Sistem dihentikan secara darurat pada ${row.rpi_hostname}.`,
              severity: "critical",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addNotification]);

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
