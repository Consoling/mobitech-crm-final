import Navbar from "@/components/protected/Navbar";
import Sidebar from "@/components/protected/Sidebar";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { SYS_VAR } from "@/constants/const";
import { useAuthStore } from "@/stores/authStore";

const ProtectedLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap(SYS_VAR.BACKEND_URL);
  }, [bootstrap]);

  if (isBootstrapping) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
          <p className="text-sm">Checking session…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Navbar />
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
