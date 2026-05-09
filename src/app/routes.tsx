import React from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { DevicesPage } from "./pages/DevicesPage";
import { HistoryPage } from "./pages/HistoryPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { UsersPage } from "./pages/UsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", Component: DashboardPage },
      { path: "devices", Component: DevicesPage },
      { path: "history", Component: HistoryPage },
      { path: "analytics", Component: AnalyticsPage },
      { path: "settings", Component: SettingsPage },
      { path: "users", Component: UsersPage },
    ],
  },
]);
