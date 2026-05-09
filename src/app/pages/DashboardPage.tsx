import React from "react";
import { StatusCards } from "../components/dashboard/StatusCards";
import { DeviceAlerts } from "../components/dashboard/DeviceAlerts";
import { EmergencyStop } from "../components/dashboard/EmergencyStop";
import { AIConfidenceMeter } from "../components/dashboard/AIConfidenceMeter";
import { SystemHealth } from "../components/dashboard/SystemHealth";
import { SprayerControl } from "../components/dashboard/SprayerControl";
import { ActivityTimeline } from "../components/dashboard/ActivityTimeline";
import { DetectionHistory } from "../components/dashboard/DetectionHistory";
import { AnalyticsPanel } from "../components/dashboard/AnalyticsPanel";
import { SnapshotGallery } from "../components/dashboard/SnapshotGallery";
import { motion } from "framer-motion";
import { Leaf, LayoutDashboard } from "lucide-react";

const C = {
  primary: "#328E6E",
  secondary: "#67AE6E",
  accent: "#90C67C",
};

export function DashboardPage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Page Header */}
      <div className="px-4 lg:px-6 pt-5 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, boxShadow: `0 0 20px ${C.primary}40` }}
            >
              <LayoutDashboard className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white" style={{ fontWeight: 700, fontSize: 18 }}>Farm Monitoring Dashboard</h1>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Smart Hydroponic Pest Detection • Realtime AI Monitoring
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Leaf className="w-4 h-4" style={{ color: C.accent }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Greenhouse Zone A-D</span>
          </div>
        </motion.div>
      </div>

      {/* Emergency Stop Button */}
      <EmergencyStop />

      {/* Device Alerts */}
      <DeviceAlerts />

      {/* Status Cards Row */}
      <StatusCards />

      {/* Main Grid */}
      <div className="px-4 lg:px-6 mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* AI Confidence Meter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <AIConfidenceMeter />
        </motion.div>

        {/* System Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SystemHealth />
        </motion.div>
      </div>

      {/* Second Row */}
      <div className="px-4 lg:px-6 mt-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sprayer Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <SprayerControl />
        </motion.div>

        {/* Activity Timeline - spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <ActivityTimeline />
        </motion.div>

        {/* Snapshot Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <SnapshotGallery />
        </motion.div>
      </div>

      {/* Third Row - Detection History full width */}
      <div className="px-4 lg:px-6 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DetectionHistory />
        </motion.div>
      </div>

      {/* Analytics Row */}
      <div className="px-4 lg:px-6 mt-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <AnalyticsPanel />
        </motion.div>
      </div>
    </div>
  );
}
