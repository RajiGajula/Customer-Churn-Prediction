import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Customers = lazy(() => import("./pages/Customers"));
const ConsumerProfiles = lazy(() => import("./pages/ConsumerProfiles"));
const Orders = lazy(() => import("./pages/Orders"));
const Products = lazy(() => import("./pages/Products"));
const Sellers = lazy(() => import("./pages/Sellers"));
const Payments = lazy(() => import("./pages/Payments"));
const Geography = lazy(() => import("./pages/Geography"));
const Reviews = lazy(() => import("./pages/Reviews"));
const RegisteredUsers = lazy(() => import("./pages/RegisteredUsers"));
const ChurnPrediction = lazy(() => import("./pages/ChurnPrediction"));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails"));
const CustomerSegmentation = lazy(() => import("./pages/CustomerSegmentation"));
const Reports = lazy(() => import("./pages/Reports"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard.jsx"));
const Profile = lazy(() => import("./pages/Profile"));

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminPageLayout from "./components/AdminPageLayout.jsx";

function DashboardEntry() {
  const role = (localStorage.getItem("role") || "").toLowerCase();
  const isCustomer = ["customer", "viewer", "staff", "user"].includes(role);
  return isCustomer ? <CustomerDashboard /> : <Dashboard />;
}

function App() {

  return (

    <BrowserRouter>

      <Suspense fallback={<main className="route-loading" role="status">Loading page…</main>}>
      <Routes>

        {/* =================================================
            DEFAULT
        ================================================= */}

        <Route
          path="/"
          element={
            <Navigate to="/login" replace />
          }
        />


        {/* =================================================
            AUTH
        ================================================= */}

        <Route
          path="/login"
          element={<Login />}
        />

                <Route
                  path="/signup"
                  element={<Signup />}
                />

                <Route element={<AdminPageLayout />}>

        <Route
          path="/churn-prediction"
  element={
    <ProtectedRoute adminOnly>
      <ChurnPrediction />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer-details/:customerId"
  element={
    <ProtectedRoute adminOnly>
      <CustomerDetails />
    </ProtectedRoute>
  }
/>

<Route
  path="/customer-segmentation"
  element={
    <ProtectedRoute adminOnly>
      <CustomerSegmentation />
    </ProtectedRoute>
  }
/>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardEntry />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            CUSTOMERS
        ================================================= */}

        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consumer-profiles"
          element={
            <ProtectedRoute>
              <ConsumerProfiles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consumer-profiles/:profileId/activity"
          element={
            <ProtectedRoute>
              <ConsumerProfiles />
            </ProtectedRoute>
          }
        />

        {/* =================================================
            CONSUMER MANAGEMENT
        ================================================= */}

        <Route
          path="/registered-users"
          element={
            <ProtectedRoute>
              <RegisteredUsers />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            ORDERS
        ================================================= */}

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            PRODUCTS
        ================================================= */}

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sellers"
          element={
            <ProtectedRoute>
              <Sellers />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            PAYMENTS
        ================================================= */}

        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            GEOGRAPHY
        ================================================= */}

        <Route
          path="/geography"
          element={
            <ProtectedRoute>
              <Geography />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            REVIEWS
        ================================================= */}

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />


        {/* =================================================
            PROFILE
        ================================================= */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        </Route>

        {/* =================================================
            UNKNOWN ROUTES
        ================================================= */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>
      </Suspense>

    </BrowserRouter>

  );
}


export default App;