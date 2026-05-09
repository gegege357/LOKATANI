import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, HardDrive, Wrench, X, WifiOff, Settings } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

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
  tools: DeviceTool[];
  createdAt: string;
};

const STORAGE_KEY = "lokatani_devices";

export function DeviceAlerts() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const { addNotification } = useNotifications();
  // Track which alert IDs have already triggered an email (avoid duplicates)
  const sentEmailsRef = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  useEffect(() => {
    const loadDevices = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setDevices(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Error loading devices:", error);
      }
    };

    loadDevices();

    // Listen for storage changes (in case devices are updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadDevices();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Trigger email notification when new alerts appear
  useEffect(() => {
    const activeAlerts = devices.flatMap((device) => {
      const deviceAlerts: Array<{ id: string; title: string; message: string; severity: "critical" | "warning" | "info"; type: "system_alert" | "pest_detected" }> = [];

      if (device.status === "offline") {
        deviceAlerts.push({
          id: `device-${device.id}-offline`,
          title: "Perangkat Terputus",
          message: `Perangkat ${device.name} di ${device.location} tidak dapat dihubungi`,
          severity: "critical",
          type: "system_alert",
        });
      }

      device.tools.forEach((tool) => {
        if (tool.status === "maintenance") {
          deviceAlerts.push({
            id: `tool-${tool.id}-maintenance`,
            title: "Alat Perlu Perbaikan",
            message: `${tool.name} (${tool.type}) di ${device.name} memerlukan perawatan`,
            severity: "warning",
            type: "system_alert",
          });
        }
      });

      return deviceAlerts;
    });

    // Prevent sending emails on initial page load
    if (isFirstRender.current) {
      activeAlerts.forEach((a) => sentEmailsRef.current.add(a.id));
      isFirstRender.current = false;
      return;
    }

    // Only send email for NEW alerts not yet sent
    activeAlerts.forEach((alert) => {
      if (!sentEmailsRef.current.has(alert.id)) {
        sentEmailsRef.current.add(alert.id);
        addNotification({
          type: alert.type,
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
        });
      }
    });
  }, [devices, addNotification]);

  // Generate alerts
  const alerts = React.useMemo(() => {
    const alertList: Array<{
      id: string;
      type: "device_offline" | "tool_maintenance";
      title: string;
      message: string;
      deviceName: string;
      location: string;
      severity: "high" | "medium";
      icon: React.ElementType;
    }> = [];

    devices.forEach((device) => {
      // Device offline alert
      if (device.status === "offline") {
        alertList.push({
          id: `device-${device.id}-offline`,
          type: "device_offline",
          title: "Perangkat Terputus",
          message: `Perangkat ${device.name} tidak dapat dihubungi`,
          deviceName: device.name,
          location: device.location,
          severity: "high",
          icon: WifiOff,
        });
      }

      // Tool maintenance alerts
      device.tools.forEach((tool) => {
        if (tool.status === "maintenance") {
          alertList.push({
            id: `tool-${tool.id}-maintenance`,
            type: "tool_maintenance",
            title: "Alat Perlu Perbaikan",
            message: `${tool.name} (${tool.type}) memerlukan perawatan`,
            deviceName: device.name,
            location: device.location,
            severity: "medium",
            icon: Settings,
          });
        }
      });
    });

    return alertList.filter((alert) => !dismissedAlerts.has(alert.id));
  }, [devices, dismissedAlerts]);

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
  };

  const dismissAll = () => {
    setDismissedAlerts(new Set(alerts.map((alert) => alert.id)));
  };

  if (alerts.length === 0) {
    return null;
  }

  const highPriorityAlerts = alerts.filter((alert) => alert.severity === "high");
  const mediumPriorityAlerts = alerts.filter((alert) => alert.severity === "medium");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 lg:px-6 mt-6"
    >
      <div
        className="rounded-[2rem] overflow-hidden relative"
        style={{
          background: "rgba(13, 43, 31, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)" }}
            >
              <AlertTriangle className="w-5 h-5 text-[#fbbf24]" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide uppercase">
                System Alerts ({alerts.length})
              </h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-tighter mt-0.5">
                {highPriorityAlerts.length} Critical • {mediumPriorityAlerts.length} Warning
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alerts.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-4 py-2 rounded-xl text-[11px] font-bold text-white/70 bg-white/5 border border-white/5 transition-all hover:bg-white/10"
              >
                {isExpanded ? "Hide All" : "Show All"}
              </button>
            )}
            <button
              onClick={dismissAll}
              className="px-4 py-2 rounded-xl text-[11px] font-bold text-white/70 bg-white/5 border border-white/5 transition-all hover:bg-white/10"
            >
              Dismiss All
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-5 space-y-4">
          <AnimatePresence mode="popLayout">
            {(isExpanded ? alerts : alerts.slice(0, 3)).map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl p-5 flex items-start gap-5 relative group transition-all duration-300 hover:bg-white/5"
                style={{
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                }}
              >
                {/* Severity Indicator Bar */}
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 rounded-r-full"
                  style={{ background: alert.severity === "high" ? "#ef4444" : "#fbbf24" }}
                />

                {/* Icon Container */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: alert.severity === "high"
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(251, 191, 36, 0.1)",
                    border: `1px solid ${alert.severity === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(251, 191, 36, 0.2)"}`
                  }}
                >
                  <alert.icon
                    className="w-6 h-6"
                    style={{
                      color: alert.severity === "high" ? "#ef4444" : "#fbbf24",
                    }}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-sm tracking-tight">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-white/50 leading-relaxed max-w-2xl">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                          <HardDrive className="w-3 h-3 text-white/30" />
                          <span className="text-[10px] text-white/40 font-black uppercase tracking-tight">
                            {alert.deviceName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/5">
                          <span className="text-[10px] text-white/40 font-black uppercase tracking-tight">
                            {alert.location}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/5 border border-white/5 text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Show more indicator */}
          {!isExpanded && alerts.length > 3 && (
            <div className="text-center pt-2">
              <button
                onClick={() => setIsExpanded(true)}
                className="text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[#fbbf24] hover:bg-[#fbbf24]/10 transition-all"
              >
                +{alerts.length - 3} More Alerts
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
