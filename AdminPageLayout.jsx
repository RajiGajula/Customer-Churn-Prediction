import { useState } from "react";
import {
  Activity,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Star,
  Store,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import "../styles/Dashboard.css";
import "../styles/AdminPageLayout.css";

const adminSidebarItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Orders", path: "/orders", icon: ShoppingBag },
  { label: "Products", path: "/products", icon: Package },
  { label: "Sellers", path: "/sellers", icon: Store },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Reviews", path: "/reviews", icon: Star },
  { label: "Geography", path: "/geography", icon: Globe },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Churn Prediction", path: "/churn-prediction", icon: Activity },
  { label: "Customer Segmentation", path: "/customer-segmentation", icon: Users },
];

const customerSidebarItems = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", path: "/orders", icon: ShoppingBag },
  { label: "Products", path: "/products", icon: Package },
  { label: "Sellers", path: "/sellers", icon: Store },
  { label: "My Account", path: "/profile", icon: User },
];

function AdminPageLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 950);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isCustomer = ["customer", "viewer", "staff", "user"].includes(role);
  const isAdmin = role === "admin";

  if (location.pathname === "/dashboard") {
    return <Outlet />;
  }

  const sidebarItems = isCustomer
    ? customerSidebarItems
    : [
      ...adminSidebarItems,
      ...(isAdmin
        ? [{ label: "Consumer Management", path: "/registered-users", icon: UserCog }]
        : []),
    ];

  const handleLogout = () => {
    [
      "user",
      "currentUser",
      "loggedInUser",
      "userData",
      "access_token",
      "token",
      "name",
      "role",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-app app-page-layout">
      <aside className={`dashboard-sidebar${sidebarOpen ? "" : " collapsed"}`}>
        <button
          className="sidebar-logo app-sidebar-toggle"
          type="button"
          onClick={() => setSidebarOpen((open) => !open)}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
        >
          <span className="logo-circle" />
          {sidebarOpen && (
            <span className="logo-text">
              <strong>CUSTOMER</strong>
              <strong>SPHERE</strong>
            </span>
          )}
          {!sidebarOpen && <Menu className="app-sidebar-menu-icon" size={18} />}
        </button>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          {sidebarItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end
              className={({ isActive }) =>
                isActive || (path === "/customers" && location.pathname.startsWith("/consumer-profiles"))
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              title={sidebarOpen ? "" : label}
            >
              <Icon size={23} strokeWidth={2} />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className="sidebar-item logout-item"
            type="button"
            onClick={() => setShowLogoutConfirmation(true)}
          >
            <LogOut size={23} />
            {sidebarOpen && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {showLogoutConfirmation && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowLogoutConfirmation(false);
            }
          }}
        >
          <div className="logout-modal" role="dialog" aria-modal="true" aria-labelledby="page-logout-title">
            <div className="logout-icon">
              <LogOut size={28} />
            </div>
            <h2 id="page-logout-title">Logout?</h2>
            <p>Are you sure you want to log out of Customer Sphere?</p>
            <div className="logout-actions">
              <button
                className="cancel-button"
                type="button"
                onClick={() => setShowLogoutConfirmation(false)}
              >
                Cancel
              </button>
              <button className="confirm-logout-button" type="button" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className={`dashboard-main app-page-main${sidebarOpen ? "" : " sidebar-collapsed"}`}>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminPageLayout;
