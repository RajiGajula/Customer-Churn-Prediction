import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const { pathname } = useLocation();
  const isCustomer = ["customer", "viewer", "staff", "user"].includes(role);
  const customerRestrictedPaths = [
    "/customers",
    "/payments",
    "/registered-users",
    "/reports",
    "/reviews",
    "/geography",
  ];
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (isCustomer && customerRestrictedPaths.includes(normalizedPath)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;