import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const PublicLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicLayout;
