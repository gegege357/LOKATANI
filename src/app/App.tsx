import React, { useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { UserManagementProvider, useUserManagement } from "./context/UserManagementContext";
import { LoginPage } from "./components/login/LoginPage";
import "../styles/fonts.css";

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { syncGoogleUser } = useUserManagement();

  // Sync Google-authenticated users into UserManagementContext so they
  // appear in the admin's user list immediately after login.
  useEffect(() => {
    if (isAuthenticated && user && user.googleId) {
      syncGoogleUser(user);
    }
    // Re-run only when the logged-in user's identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

  if (!isAuthenticated) return <LoginPage />;

  return (
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      {/* UserManagementProvider is outside AppContent so it is always mounted
          and syncGoogleUser can be called inside AppContent's useEffect */}
      <UserManagementProvider>
        <AppContent />
      </UserManagementProvider>
    </AuthProvider>
  );
}
