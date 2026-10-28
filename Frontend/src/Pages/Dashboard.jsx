import {
  useEffect,
  useState,
} from "react";

import {
  Activity,
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  FileText,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  ShoppingBag,
  Star,
  Sun,
  User,
  UserCog,
  Users,
  X,
  CreditCard,
  Store,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";

import {
  NavLink,
  useNavigate,
} from "react-router-dom";

import {
  getDashboardCoreData,
  getDashboardSupplementalData,
  getCustomerRisk,
  getGlobalSearchResults,
  getNotifications,
  markNotificationRead,
} from "../services/dashboardApi";

import "../styles/Dashboard.css";


/* =========================================================
   SAFE DATA HELPERS
========================================================= */

function getValue(source, keys, fallback = null) {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    if (
      source[key] !== undefined &&
      source[key] !== null
    ) {
      return source[key];
    }
  }

  return fallback;
}


function getArray(source, keys) {
  if (!source) {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(source[key])) {
      return source[key];
    }
  }

  if (Array.isArray(source)) {
    return source;
  }

  return [];
}


/* =========================================================
   TREND NORMALIZATION
   Backend trend APIs return aggregate fields such as
   period_date, churn_rate, average_churn_probability and
   revenue/value. Normalize them once so Recharts always
   receives the expected keys.
========================================================= */

function getFirstDefined(source, keys, fallback = null) {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    if (
      source[key] !== undefined &&
      source[key] !== null &&
      source[key] !== ""
    ) {
      return source[key];
    }
  }

  return fallback;
}


function formatTrendLabel(value) {
  if (!value) {
    return "";
  }

  const text = String(value);

  // 2026-03-01 / 2026-03 -> Mar 2026
  const match = text.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);

  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);

    if (month >= 1 && month <= 12) {
      return new Date(year, month - 1, 1).toLocaleDateString(
        "en-US",
        {
          month: "short",
          year: "numeric",
        }
      );
    }
  }

  return text.length > 12
    ? text.slice(0, 12)
    : text;
}


function normalizeRevenueTrend(rows) {
  return rows.flatMap((row) => {
    const actualRaw = getFirstDefined(row, [
      "actual",
      "actual_revenue",
      "revenue",
      "total_revenue",
      "value",
      "amount",
    ]);

    const actual = Number(actualRaw);

    if (actualRaw === null || !Number.isFinite(actual)) {
      return [];
    }

    const predictedRaw = getFirstDefined(row, [
      "predicted",
      "predicted_revenue",
      "forecast",
      "forecast_revenue",
    ], null);

    const periodDate = getFirstDefined(row, [
      "month",
      "period",
      "period_date",
      "date",
      "week",
    ]);

    return {
      label: formatTrendLabel(periodDate),
      periodDate,
      actual,
      predicted:
        predictedRaw === null
          ? null
          : Number.isFinite(Number(predictedRaw))
            ? Number(predictedRaw)
            : null,
    };
  });
}


/* =========================================================
   DASHBOARD
========================================================= */

function getDashboardDateRange(range) {
  if (range === "all") {
    return {};
  }

  const endDate = new Date();
  const startDate = new Date(endDate);
  if (range === "year") {
    startDate.setMonth(0, 1);
  } else if (range === "12months") {
    startDate.setFullYear(startDate.getFullYear() - 1);
  } else if (range === "90days") {
    startDate.setDate(startDate.getDate() - 90);
  } else {
    return {};
  }

  const toLocalIsoDate = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    start_date: toLocalIsoDate(startDate),
    end_date: toLocalIsoDate(endDate),
  };
}


function Dashboard() {

  const navigate = useNavigate();


  /* =======================================================
     STATE
  ======================================================= */

  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(true);

  const [
    dashboardErrors,
    setDashboardErrors,
  ] = useState({});

  const [
    error,
    setError,
  ] = useState("");

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(true);

  const [
    darkMode,
    setDarkMode,
  ] = useState(false);

  const [
    showLogoutPopup,
    setShowLogoutPopup,
  ] = useState(false);

  const [
    showNotifications,
    setShowNotifications,
  ] = useState(false);

  const [
    showProfileMenu,
    setShowProfileMenu,
  ] = useState(false);

  const [customerSearchText, setCustomerSearchText] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState({
    customers: [],
    orders: [],
    products: [],
  });
  const [customerSearchTotal, setCustomerSearchTotal] = useState(0);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const [customerSearchError, setCustomerSearchError] = useState("");
  const [showCustomerSearchResults, setShowCustomerSearchResults] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [riskSearchText, setRiskSearchText] = useState("");

  const [
    riskFilter,
    setRiskFilter,
  ] = useState("All");

  const [
    trendRange,
    setTrendRange,
  ] = useState("all");

  const [
    selectedCustomer,
    setSelectedCustomer,
  ] = useState(null);

  const [selectedRiskPrediction, setSelectedRiskPrediction] = useState(null);

  const [
    showRiskModal,
    setShowRiskModal,
  ] = useState(false);


  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = async (
    dateRange,
    isCurrent = () => true
  ) => {

    try {

      setLoading(true);
      setDetailsLoading(true);

      setError("");

      const core = await getDashboardCoreData(dateRange);
      if (!isCurrent()) return;

      setDashboardData(core.data);
      setDashboardErrors(core.errors);
      setLoading(false);

      if (Object.values(core.data).every((value) => value === null)) {
        setError("Unable to load dashboard summaries.");
        setDetailsLoading(false);
        return;
      }

      const supplemental = await getDashboardSupplementalData(dateRange);
      if (!isCurrent()) return;

      setDashboardData((current) => ({
        ...current,
        ...supplemental.data,
      }));
      setDashboardErrors((current) => ({
        ...current,
        ...supplemental.errors,
      }));

    } catch (err) {

      if (!isCurrent()) return;

      console.error(
        "Churn dashboard loading error:",
        err
      );

      setError(
        err?.message ||
        "Unable to load churn dashboard data."
      );

    } finally {

      if (isCurrent()) {
        setLoading(false);
        setDetailsLoading(false);
      }

    }

  };

  const searchCustomers = async (event) => {
    event.preventDefault();
    const query = customerSearchText.trim();

    if (!query) {
      setCustomerSearchResults({ customers: [], orders: [], products: [] });
      setCustomerSearchTotal(0);
      setCustomerSearchError("");
      setShowCustomerSearchResults(false);
      return;
    }

    setCustomerSearchLoading(true);
    setCustomerSearchError("");
    setShowCustomerSearchResults(true);

    try {
      const result = await getGlobalSearchResults(query);
      const matches = {
        customers: Array.isArray(result?.customers) ? result.customers : [],
        orders: Array.isArray(result?.orders) ? result.orders : [],
        products: Array.isArray(result?.products) ? result.products : [],
      };
      setCustomerSearchResults(matches);
      setCustomerSearchTotal(
        matches.customers.length + matches.orders.length + matches.products.length
      );
    } catch (searchError) {
      setCustomerSearchResults({ customers: [], orders: [], products: [] });
      setCustomerSearchTotal(0);
      setCustomerSearchError(
        searchError?.message || "Unable to search customers."
      );
    } finally {
      setCustomerSearchLoading(false);
    }
  };

  const viewNotificationCustomer = async (item) => {
    try {
      await markNotificationRead(item.notification_id);
      setNotificationItems((items) =>
        items.filter((notification) =>
          notification.notification_id !== item.notification_id
        )
      );
      if (!item.read) {
        setUnreadNotificationCount((count) => Math.max(count - 1, 0));
      }
      setNotificationError("");
      setShowNotifications(false);
      if (item.customer_unique_id) {
        navigate(`/customer-details/${encodeURIComponent(item.customer_unique_id)}`);
      } else if (item.profile_id) {
        navigate("/consumer-profiles");
      }
    } catch (readError) {
      setNotificationError(
        readError.message || "Unable to mark notification read."
      );
    }
  };


  useEffect(() => {
    let isMounted = true;
    loadDashboard(
      getDashboardDateRange(trendRange),
      () => isMounted
    );
    return () => {
      isMounted = false;
    };
  }, [trendRange]);

  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const result = await getNotifications();
        if (!isMounted) return;
        setNotificationItems(Array.isArray(result?.notifications) ? result.notifications : []);
        setUnreadNotificationCount(Number(result?.unread_count) || 0);
        setNotificationError("");
      } catch (loadError) {
        if (isMounted) {
          setNotificationError(loadError.message || "Unable to load notifications.");
        }
      }
    };
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);


  /* =======================================================
     USER
  ======================================================= */

  const getStoredUser = () => {

    const keys = [
      "user",
      "currentUser",
      "loggedInUser",
      "userData",
    ];

    for (const key of keys) {

      const stored =
        localStorage.getItem(key);

      if (!stored) {
        continue;
      }

      try {

        const parsed =
          JSON.parse(stored);

        if (parsed?.user) {
          return parsed.user;
        }

        return parsed;

      } catch {

        continue;

      }

    }

    return null;

  };


  const storedUser =
    getStoredUser();


  const userName =
    storedUser?.name ||
    storedUser?.full_name ||
    storedUser?.fullName ||
    storedUser?.username ||
    storedUser?.first_name ||
    storedUser?.firstName ||
    storedUser?.email?.split("@")[0] ||
    localStorage.getItem("name") ||
    "User";


  const userRole =
    storedUser?.role ||
    localStorage.getItem("role") ||
    "customer";
  const isAdmin = String(userRole).toLowerCase() === "admin";


  const userInitial =
    userName
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() ||
    "U";


  /* =======================================================
     LOGOUT
  ======================================================= */

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
    ].forEach((key) => {

      localStorage.removeItem(key);

    });

    setShowLogoutPopup(false);

    setShowProfileMenu(false);

    navigate(
      "/login",
      {
        replace: true,
      }
    );

  };


  /* =======================================================
     PROFILE
  ======================================================= */

  const handleEditProfile = () => {

    setShowProfileMenu(false);

    setShowNotifications(false);

    navigate("/profile");

  };


  /* =======================================================
     API SECTIONS
  ======================================================= */

  const customers =
    dashboardData?.customers || {};

  const campaigns =
    dashboardData?.campaigns || {};

  const churn =
    dashboardData?.churn || {};

  const riskThresholds =
    churn?.risk_thresholds || {};

  const revenue =
    dashboardData?.revenue || {};

  const revenueTrend =
    dashboardData?.revenueTrend || {};

  const atRisk =
    dashboardData?.atRisk || {};


  /* =======================================================
     KPI VALUES
  ======================================================= */

  const totalCustomers =
    getValue(
      customers,
      [
        "total_customers",
        "customer_count",
        "total",
        "count",
      ]
    );

  const churnRate =
    getValue(
      churn,
      [
        "churn_rate",
        "rate",
        "percentage",
      ]
    );


  const totalRevenue =
    getValue(
      revenue,
      [
        "total_revenue",
        "revenue",
        "total",
      ]
    );


  /* =======================================================
     ARRAYS
  ======================================================= */


  const revenueTrendData = normalizeRevenueTrend(
    getArray(
      revenueTrend,
      [
        "trend",
        "data",
        "items",
        "results",
      ]
    )
  );

  const visibleRevenueTrendData = revenueTrendData;
  const trendRangeLabel = trendRange === "all"
    ? "all time"
    : "selected range";
  const formatTrendCaption = (count) =>
    `${count} ${count === 1 ? "period" : "periods"} · ${trendRangeLabel}`;

  const tierCounts = churn?.risk_tier_counts || {};
  const countForTier = (tier) => Number(
    tierCounts[tier] ??
    tierCounts[`${tier[0].toUpperCase()}${tier.slice(1)}`] ??
    churn?.[`${tier}_risk_customers`] ??
    0
  );
  const customerSegmentData = [
    { label: "High Risk", count: countForTier("high"), color: "#cf5b52" },
    { label: "Medium Risk", count: countForTier("medium"), color: "#d28b2e" },
    { label: "Low Risk", count: countForTier("low"), color: "#32866f" },
  ];
  const segmentedCustomerTotal = customerSegmentData.reduce(
    (total, segment) => total + segment.count,
    0
  );

  const atRiskData =
    getArray(
      atRisk,
      [
        "customers",
        "at_risk",
        "data",
        "items",
        "results",
      ]
    );


  const campaignItems =
    getArray(
      campaigns,
      [
        "campaigns",
        "data",
        "items",
        "results",
      ]
    );

  const recentReviewData = getArray(
    dashboardData?.recentReviews,
    ["data", "reviews", "items", "results"]
  );
  const customerFeedback = recentReviewData
    .filter((review) =>
      String(review?.review_comment_title || "").trim() ||
      String(review?.review_comment_message || "").trim()
    )
    .slice(0, 5);

  const maxCampaignCustomers = Math.max(
    0,
    ...campaignItems.map((campaign) =>
      Number(campaign?.customer_count) || 0
    )
  );


  /* =======================================================
     FILTER AT-RISK CUSTOMERS
  ======================================================= */

  useEffect(() => {
    if (
      atRiskData.length > 0 &&
      !selectedCustomer
    ) {
      setSelectedCustomer(atRiskData[0]);
    }
  }, [atRiskData, selectedCustomer]);

  useEffect(() => {
    const customerId = selectedCustomer?.customer_unique_id ||
      selectedCustomer?.customer_id ||
      selectedCustomer?.id;
    if (!customerId) return undefined;

    let isCurrent = true;
    getCustomerRisk(customerId)
      .then((result) => {
        if (isCurrent) {
          setSelectedRiskPrediction({
            customerId,
            risk: result,
            prediction: result?.prediction || null,
            error: "",
          });
        }
      })
      .catch((riskError) => {
        if (isCurrent) {
          setSelectedRiskPrediction({
            customerId,
            prediction: null,
            error: riskError?.message || "Unable to load SHAP details.",
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [
    selectedCustomer?.customer_unique_id,
    selectedCustomer?.customer_id,
    selectedCustomer?.id,
  ]);


  /* =======================================================
     FORMATTERS
  ======================================================= */

  const formatNumber = (value) => {

    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return number.toLocaleString(
      "en-US"
    );

  };


  const formatCurrency = (value, currency = revenue?.currency) => {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      !currency
    ) {
      return "—";
    }

    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(number);

  };


  const formatPercentage = (value) => {

    if (value === null || value === undefined || value === "") {
      return "—";
    }

    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return `${number.toFixed(1)}%`;

  };


  const formatCompactCurrency = (
    value
  ) => {

    if (
      value === null ||
      value === undefined ||
      value === "" ||
      !revenue?.currency
    ) {
      return "—";
    }

    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "—";
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: revenue.currency,
        notation: "compact",
        maximumFractionDigits: 1,
      }
    ).format(number);

  };


  const formatLabel = (
    value
  ) => {

    if (!value) {
      return "";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  };


  const getCustomerId = (
    customer
  ) => {

    return (
      customer?.customer_unique_id ||
      customer?.customer_id ||
      customer?.id
    );

  };


  const getRiskScore = (
    customer
  ) => {

    const rawScore =
      customer?.churn_probability ??
      customer?.risk_score ??
      customer?.score;

    if (rawScore === null || rawScore === undefined || rawScore === "") {
      return null;
    }

    const score = Number(rawScore);

    return Number.isFinite(score)
      ? score
      : null;

  };


  const getRiskLabel = (
    customer
  ) => {

    const score =
      getRiskScore(customer);

    if (score === null) {
      return "Unknown";
    }

    if (
      customer?.risk_tier
    ) {
      return formatLabel(
        customer.risk_tier
      );
    }

    const highThreshold = Number(riskThresholds?.high);
    const mediumThreshold = Number(riskThresholds?.medium);

    if (!Number.isFinite(highThreshold) || !Number.isFinite(mediumThreshold)) {
      return "Unknown";
    }

    if (score >= highThreshold) {
      return "High";
    }

    if (score >= mediumThreshold) {
      return "Medium";
    }

    return "Low";

  };


  const filteredAtRisk =
    atRiskData.filter(
      (customer) => {

        const search =
          riskSearchText
            .toLowerCase()
            .trim();

        const id =
          String(
            customer?.customer_unique_id ||
            customer?.customer_id ||
            customer?.id ||
            ""
          ).toLowerCase();

        const name =
          String(
            customer?.name ||
            customer?.customer_name ||
            ""
          ).toLowerCase();

        const segment =
          String(
            customer?.segment ||
            customer?.risk_tier ||
            ""
          ).toLowerCase();

        const risk =
          getRiskLabel(customer).toLowerCase();

        const matchesSearch =
          !search ||
          id.includes(search) ||
          name.includes(search) ||
          segment.includes(search) ||
          risk.includes(search);

        const matchesRisk =
          riskFilter === "All" ||
          risk === riskFilter.toLowerCase();

        return (
          matchesSearch &&
          matchesRisk
        );

      }
    );

  const getValueTier = (customer) => {
    return (
      customer?.value_tier ||
      customer?.valueTier ||
      customer?.customer_value_tier ||
      customer?.value_segment ||
      "—"
    );
  };


  const getRegion = (customer) => {
    return (
      customer?.region ||
      customer?.customer_region ||
      customer?.state_region ||
      customer?.geographic_region ||
      "—"
    );
  };


  const getRiskReasons = (customer) => {
    const shapValues = customer?.shap_values;
    const shapFactors = shapValues && typeof shapValues === "object" && !Array.isArray(shapValues)
      ? Object.entries(shapValues).map(([feature, shap_value]) => ({ feature, shap_value }))
      : [];
    const raw =
      (Array.isArray(customer?.top_factors) && customer.top_factors.length
        ? customer.top_factors
        : null) ||
      (shapFactors.length ? shapFactors : null) ||
      customer?.shap_reasons ||
      customer?.reason_codes ||
      customer?.reasons ||
      customer?.top_reasons ||
      customer?.explanations ||
      customer?.features ||
      [];

    if (!Array.isArray(raw)) {
      return [];
    }

    return raw
      .map((reason) => {
        if (typeof reason === "string") {
          return {
            label: reason,
            value: null,
          };
        }

        return {
          label:
            reason?.feature ||
            reason?.reason ||
            reason?.reason_code ||
            reason?.name ||
            reason?.label ||
            "Risk factor",
          value:
            reason?.value ??
            reason?.contribution ??
            reason?.shap_value ??
            reason?.impact ??
            reason?.score ??
            null,
        };
      })
      .slice(0, 5);
  };

  const selectedCustomerId = getCustomerId(selectedCustomer);
  const selectedPrediction = selectedCustomerId &&
    selectedRiskPrediction?.customerId === selectedCustomerId
    ? selectedRiskPrediction.prediction
    : null;
  const selectedRiskDetails = {
    ...selectedCustomer,
    ...(selectedRiskPrediction?.customerId === selectedCustomerId
      ? selectedRiskPrediction?.risk?.customer || {}
      : {}),
    ...(selectedPrediction || {}),
    ...(selectedRiskPrediction?.customerId === selectedCustomerId
      ? selectedRiskPrediction?.risk?.campaign_recommendation || {}
      : {}),
    value_tier: selectedRiskPrediction?.customerId === selectedCustomerId
      ? selectedRiskPrediction?.risk?.value_tier ||
        selectedRiskPrediction?.risk?.campaign_recommendation?.value_tier ||
        selectedCustomer?.value_tier
      : selectedCustomer?.value_tier,
  };
  const selectedRiskReasons = getRiskReasons(selectedRiskDetails);


  /* =======================================================
     SIDEBAR
  ======================================================= */

  const sidebarItems = [

    {
      label: "Overview",
      path: "/dashboard",
      icon: LayoutDashboard,
    },

    {
      label: "Customers",
      path: "/customers",
      icon: Users,
    },

    {
      label: "Orders",
      path: "/orders",
      icon: ShoppingBag,
    },

    {
      label: "Products",
      path: "/products",
      icon: Package,
    },

    {
      label: "Sellers",
      path: "/sellers",
      icon: Store,
    },

    {
      label: "Payments",
      path: "/payments",
      icon: CreditCard,
    },

    {
      label: "Reviews",
      path: "/reviews",
      icon: Star,
    },

    {
      label: "Geography",
      path: "/geography",
      icon: Globe,
    },

    {
      label: "Reports",
      path: "/reports",
      icon: FileText,
    },

    {
      label: "Churn Prediction",
      path: "/churn-prediction",
      icon: Activity,
    },

    {
      label: "Customer Segmentation",
      path: "/customer-segmentation",
      icon: Users,
    },

    ...(isAdmin ? [{
      label: "Consumer Management",
      path: "/registered-users",
      icon: UserCog,
    }] : []),

  ];


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {

    return (

      <div className="dashboard-loading">

        <div className="loading-spinner"></div>

        <p>
          Loading churn dashboard...
        </p>

      </div>

    );

  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {

    return (

      <div className="dashboard-error-page">

        <div className="dashboard-error-card">

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-button"
            onClick={
              loadDashboard
            }
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  /* =======================================================
     DASHBOARD
  ======================================================= */

  return (

    <div
      className={
        darkMode
          ? "dashboard-app dark-mode"
          : "dashboard-app"
      }
    >

      {/* ===================================================
          SIDEBAR
      =================================================== */}

      <aside
        className={
          sidebarOpen
            ? "dashboard-sidebar"
            : "dashboard-sidebar collapsed"
        }
      >

        <div className="sidebar-logo">

          <div className="logo-circle"></div>

          {sidebarOpen && (

            <div className="logo-text">

              <strong>
                CUSTOMER
              </strong>

              <strong>
                SPHERE
              </strong>

            </div>

          )}

        </div>


        <nav className="sidebar-navigation">

          {sidebarItems.map(
            (item) => {

              const Icon =
                item.icon;

              return (

                <NavLink
                  key={item.path}
                  to={item.path}
                  className={
                    ({ isActive }) =>
                      isActive
                        ? "sidebar-item active"
                        : "sidebar-item"
                  }
                  title={
                    sidebarOpen
                      ? ""
                      : item.label
                  }
                >

                  <Icon
                    size={23}
                    strokeWidth={2}
                  />

                  {sidebarOpen && (

                    <span>
                      {item.label}
                    </span>

                  )}

                </NavLink>

              );

            }
          )}

        </nav>


        <div className="sidebar-bottom">

          <button
            className="sidebar-item logout-item"
            onClick={() =>
              setShowLogoutPopup(
                true
              )
            }
          >

            <LogOut
              size={23}
            />

            {sidebarOpen && (

              <span>
                Log Out
              </span>

            )}

          </button>

        </div>

      </aside>


      {/* ===================================================
          MAIN
      =================================================== */}

      <main
        className={
          sidebarOpen
            ? "dashboard-main"
            : "dashboard-main sidebar-collapsed"
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="dashboard-header">

          <div className="header-left">

            <button
              className="sidebar-toggle"
              onClick={() =>
                setSidebarOpen(
                  !sidebarOpen
                )
              }
            >

              {sidebarOpen ? (

                <ChevronLeft
                  size={22}
                />

              ) : (

                <Menu
                  size={22}
                />

              )}

            </button>


            <div className="welcome-text">

              <h1>
                Customer Sphere
              </h1>

              <p>
                Monitor customer risk,
                retention and churn
                performance.
              </p>

            </div>

          </div>


          <div className="header-right">

            <form
              className="dashboard-search"
              onSubmit={searchCustomers}
            >

              <button
                type="submit"
                className="dashboard-search-submit"
                aria-label="Search customers, orders, and products"
              >
                <Search size={19} />
              </button>

              <input
                type="search"
                aria-label="Search customers"
                placeholder="Search customers, orders, products..."
                value={customerSearchText}
                onChange={(event) => {
                  setCustomerSearchText(event.target.value);
                  setShowCustomerSearchResults(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setShowCustomerSearchResults(false);
                  }
                }}
              />

              {showCustomerSearchResults && (
                <div className="customer-search-results" role="listbox">
                  <div className="customer-search-results-header">
                    <strong>Search results</strong>
                    {!customerSearchLoading && !customerSearchError && (
                      <span>{customerSearchTotal} found</span>
                    )}
                  </div>

                  {customerSearchLoading ? (
                    <p className="customer-search-message">Searching customers, orders, and products...</p>
                  ) : customerSearchError ? (
                    <p className="customer-search-message error">{customerSearchError}</p>
                  ) : customerSearchTotal > 0 ? (
                    <>
                      {customerSearchResults.customers.length > 0 && (
                        <div className="global-search-group">
                          <strong>Customers</strong>
                          {customerSearchResults.customers.map((customer) => (
                            <button
                              type="button"
                              className="customer-search-result"
                              key={customer.customer_unique_id}
                              onClick={() => {
                                setShowCustomerSearchResults(false);
                                if (customer.customer_unique_id) {
                                  navigate(`/customer-details/${encodeURIComponent(customer.customer_unique_id)}`);
                                } else {
                                  navigate(`/consumer-profiles?search=${encodeURIComponent(customer.name || customer.customer_id)}`);
                                }
                              }}
                            >
                              <span>{customer.name || customer.customer_unique_id || customer.customer_id}{customer.is_new && <em className="global-search-new-badge">New</em>}</span>
                              <small>{[customer.customer_unique_id, customer.customer_city, customer.customer_state].filter(Boolean).join(" · ")}</small>
                            </button>
                          ))}
                        </div>
                      )}
                      {customerSearchResults.orders.length > 0 && (
                        <div className="global-search-group">
                          <strong>Orders</strong>
                          {customerSearchResults.orders.map((order) => (
                            <button
                              type="button"
                              className="customer-search-result"
                              key={order.order_id}
                              onClick={() => {
                                setShowCustomerSearchResults(false);
                                navigate(`/orders?search=${encodeURIComponent(order.order_id)}`);
                              }}
                            >
                              <span>Order {order.order_id}{order.is_new && <em className="global-search-new-badge">New</em>}</span>
                              <small>{[order.customer_name, order.order_status, order.customer_unique_id].filter(Boolean).join(" · ")}</small>
                            </button>
                          ))}
                        </div>
                      )}
                      {customerSearchResults.products.length > 0 && (
                        <div className="global-search-group">
                          <strong>Products</strong>
                          {customerSearchResults.products.map((product) => (
                            <button
                              type="button"
                              className="customer-search-result"
                              key={product.product_id}
                              onClick={() => {
                                setShowCustomerSearchResults(false);
                                navigate(`/products?search=${encodeURIComponent(product.product_id)}`);
                              }}
                            >
                              <span>{product.category}{product.is_new && <em className="global-search-new-badge">New</em>}</span>
                              <small>{product.product_id}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="customer-search-message">No customers, orders, or products match this search.</p>
                  )}
                </div>
              )}

            </form>


            <div className="date-selector">

              <Calendar size={18} />

              <select
                aria-label="Filter dashboard by date range"
                value={trendRange}
                onChange={(event) => setTrendRange(event.target.value)}
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="12months">Last 12 Months</option>
                <option value="90days">Last 90 Days</option>
              </select>

            </div>


            <button
              className="header-icon-button"
              onClick={() =>
                setDarkMode(
                  !darkMode
                )
              }
            >

              {darkMode ? (

                <Sun
                  size={20}
                />

              ) : (

                <Moon
                  size={20}
                />

              )}

            </button>


            <div className="header-dropdown">

              <button
                className="header-icon-button notification-button"
                aria-label="Notifications"
                aria-expanded={showNotifications}
                onClick={() => {
                  setShowNotifications(!showNotifications);

                  setShowProfileMenu(
                    false
                  );

                }}
              >

                <Bell
                  size={21}
                />

                {unreadNotificationCount > 0 && (
                  <span className="notification-count">
                    {unreadNotificationCount}
                  </span>
                )}

              </button>


              {showNotifications && (

                <div className="notification-dropdown">

                  <div className="notification-dropdown-header">
                    <h3>Churn predictions</h3>
                    <span>{unreadNotificationCount} unread</span>
                  </div>

                  {notificationError && (
                    <p className="notification-empty error">{notificationError}</p>
                  )}
                  {notificationItems.length > 0 ? (
                    <ul className="notification-list">
                      {notificationItems.map((item) => (
                        <li className={`notification-item ${item.notification_type}${item.read ? " read" : ""}`} key={item.notification_id}>
                          <div>
                            <strong>{item.title}</strong>
                            <p>{item.detail}</p>
                            <button type="button" onClick={() => viewNotificationCustomer(item)}>
                              View customer
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="notification-empty">
                      No churn predictions yet.
                    </p>
                  )}

                </div>

              )}

            </div>


            <div className="profile-container">

              <button
                className="profile-button"
                onClick={() => {

                  setShowProfileMenu(
                    !showProfileMenu
                  );

                  setShowNotifications(
                    false
                  );

                }}
              >

                <div className="profile-avatar">

                  {userInitial}

                </div>


                <div className="profile-info">

                  <strong>
                    {userName}
                  </strong>

                  <span>
                    {userRole}
                  </span>

                </div>


                <ChevronDown
                  size={19}
                />

              </button>


              {showProfileMenu && (

                <div className="profile-dropdown">

                  {isAdmin && <button
                    className="profile-dropdown-edit"
                    onClick={handleEditProfile}
                  >

                    <User
                      size={17}
                    />

                    <span>
                      Edit Profile
                    </span>

                  </button>}


                  <button
                    className="profile-dropdown-logout"
                    onClick={() => {

                      setShowProfileMenu(
                        false
                      );

                      setShowLogoutPopup(
                        true
                      );

                    }}
                  >

                    <LogOut
                      size={17}
                    />

                    <span>
                      Log Out
                    </span>

                  </button>

                </div>

              )}

            </div>

          </div>

        </header>


        {/* =================================================
            CONTENT
        ================================================= */}

        <section className="dashboard-content">

          {detailsLoading && (
            <div className="dashboard-secondary-loading" role="status">
              <Activity size={15} />
              Loading charts and customer details…
            </div>
          )}

          {/* ===============================================
              TITLE
          =============================================== */}

          <section className="dashboard-overview">
          <div
            className="dashboard-section-title"
            style={{
              marginBottom: "0",
            }}
          >

            <h2>
              Dashboard Overview
            </h2>



          </div>


          {/* ===============================================
              KPI CARDS
          =============================================== */}

          <div className="kpi-grid">

            {/* CUSTOMERS */}

            <div className="kpi-card kpi-customers">

              <div className="kpi-top">

                <div className="kpi-icon purple">

                  <Users
                    size={24}
                  />

                </div>

                <span className={`live-badge ${dashboardData?.customers ? "" : "unavailable"}`}>
                  {dashboardData?.customers ? "Live" : "Unavailable"}
                </span>

              </div>

              <span className="kpi-label">
                Total Customers
              </span>

              <strong className="kpi-value">

                {formatNumber(
                  totalCustomers
                )}

              </strong>

            </div>


            {/* CHURN RATE */}

            <div className="kpi-card kpi-churn">

              <div className="kpi-top">

                <div className="kpi-icon orange">

                  <Activity
                    size={24}
                  />

                </div>

                <span className={`live-badge ${dashboardData?.churn ? "" : "unavailable"}`}>
                  {dashboardData?.churn ? "Live" : "Unavailable"}
                </span>

              </div>

              <span className="kpi-label">
                Churn Rate
              </span>

              <strong className="kpi-value">

                {formatPercentage(
                  churnRate
                )}

              </strong>

            </div>


            {/* REVENUE */}

            <div className="kpi-card kpi-revenue">

              <div className="kpi-top">

                <div className="kpi-icon purple">

                  <CreditCard size={24} />

                </div>

                <span className={`live-badge ${dashboardData?.revenue ? "" : "unavailable"}`}>
                  {dashboardData?.revenue ? "Live" : "Unavailable"}
                </span>

              </div>

              <span className="kpi-label">
                Total Revenue
              </span>

              <strong className="kpi-value">

                {formatCurrency(
                  totalRevenue,
                  revenue?.currency
                )}

              </strong>

            </div>


            {/* ACTIVE CAMPAIGNS */}

            <div className="kpi-card kpi-campaigns">

              <div className="kpi-top">

                <div className="kpi-icon green">

                  <Calendar
                    size={24}
                  />

                </div>

                <span className={`live-badge ${dashboardData?.campaigns ? "" : "unavailable"}`}>
                  {dashboardData?.campaigns ? "Live" : "Unavailable"}
                </span>

              </div>

              <span className="kpi-label">
                Active Campaigns
              </span>

              <strong className="kpi-value">

                {formatNumber(
                  campaignItems.length
                )}

              </strong>

            </div>

          </div>
          </section>


          {/* ===============================================
              CUSTOMER SEGMENTS + REVENUE TREND
          =============================================== */}

          <section className="dashboard-insight-group">
          <div className="dashboard-insight-subgroup">
          <div className="dashboard-section-heading">
            <h2>Customer and revenue insights</h2>
            <p>Compare customer risk segments with revenue performance.</p>
          </div>

          <div
            className="dashboard-row equal-columns trend-row"
          >

{/* CUSTOMER SEGMENTS */}

            <div className="dashboard-card large-card">

              <div className="card-header">

                <div>

                  <h2>
                    Customer Segments
                  </h2>

                  <p>
                    Click a risk bar to view matching customers
                  </p>
                  <span className="trend-api-caption">
                    {formatNumber(segmentedCustomerTotal)} scored customers
                  </span>

                </div>

              </div>


              <div
                className="trend-chart-container"
                style={{
                  width: "100%",
                  height: "300px",
                }}
              >

                {segmentedCustomerTotal > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <BarChart
                      data={customerSegmentData}
                      layout="vertical"
                      margin={{ top: 8, right: 20, bottom: 8, left: 8 }}
                    >
                      <CartesianGrid strokeDasharray="4 4" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="label" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => [formatNumber(value), "Customers"]} />
                      <Bar
                        dataKey="count"
                        name="Customers"
                        radius={[0, 5, 5, 0]}
                        onClick={(entry) => {
                          const label = entry?.payload?.label || entry?.label;
                          const riskTier = {
                            "High Risk": "high",
                            "Medium Risk": "medium",
                            "Low Risk": "low",
                          }[label];
                          if (riskTier) {
                            navigate(`/churn-prediction?risk_tier=${riskTier}`);
                          }
                        }}
                      >
                        {customerSegmentData.map((segment) => (
                            <Cell
                              key={segment.label}
                              fill={segment.color}
                              cursor="pointer"
                            />
                        ))}
                      </Bar>
                    </BarChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="empty-chart">

                    {detailsLoading ? "Loading customer segments…" : "No customer segment data available"}

                  </div>

                )}

              </div>

            </div>

{/* REVENUE TREND */}

            <div className="dashboard-card large-card">

              <div className="card-header">

                <div>

                  <h2>
                    Revenue Trend
                  </h2>

                  <p>
                    Actual and predicted revenue
                  </p>
                  <span className="trend-api-caption">
                    {formatTrendCaption(visibleRevenueTrendData.length)}
                  </span>

                </div>

              </div>


              <div
                className="trend-chart-container"
                style={{
                  width: "100%",
                  height: "300px",
                }}
              >

                {visibleRevenueTrendData.length > 0 ? (

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <AreaChart
                      data={
                        visibleRevenueTrendData
                      }
                    >

                      <defs>

                        <linearGradient
                          id="revenueFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >

                          <stop
                            offset="0%"
                            stopColor="#6845e8"
                            stopOpacity={0.3}
                          />

                          <stop
                            offset="100%"
                            stopColor="#6845e8"
                            stopOpacity={0.05}
                          />

                        </linearGradient>

                      </defs>


                      <CartesianGrid
                        strokeDasharray="4 4"
                        vertical={false}
                      />


                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(value) =>
                          String(value).length > 10
                            ? String(value).slice(0, 10)
                            : value
                        }
                      />


                      <YAxis
                        tickFormatter={
                          formatCompactCurrency
                        }
                      />


                      <Tooltip
                        formatter={(value) =>
                          formatCurrency(
                            value
                          )
                        }
                      />


                      <Legend />


                      <Area
                        type="monotone"
                        dataKey="actual"
                        name="Actual"
                        stroke="#6845e8"
                        fill="url(#revenueFill)"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                        isAnimationActive={false}
                      />


                      {visibleRevenueTrendData.some(
                        (item) => item.predicted !== null
                      ) && (
                        <Line
                          type="monotone"
                          dataKey="predicted"
                          name="Predicted"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          strokeDasharray="6 4"
                          dot={{ r: 3 }}
                          connectNulls={false}
                          isAnimationActive={false}
                        />
                      )}

                    </AreaChart>

                  </ResponsiveContainer>

                ) : (

                  <div className="empty-chart">

                    {detailsLoading ? "Loading revenue trend…" : "No revenue trend data available"}

                  </div>

                )}

              </div>

            </div>

          </div>

            <div className="dashboard-card customer-feedback-card">
              <div className="card-header">
                <div>
                  <h2>Recent Customer Feedback</h2>
                  <p>Latest written comments from customer reviews</p>
                </div>
              </div>

              {customerFeedback.length > 0 ? (
                <div className="customer-feedback-list">
                  <div className="customer-feedback-list-header" aria-hidden="true">
                    <span>Rating</span>
                    <span>Order</span>
                    <span>Comment</span>
                    <span>Date</span>
                  </div>
                  {customerFeedback.map((review, index) => {
                    const rating = Number(review?.review_score);
                    const hasRating = Number.isInteger(rating) && rating >= 1 && rating <= 5;
                    const feedbackTone = !hasRating
                      ? "unknown"
                      : rating >= 4
                        ? "positive"
                        : rating === 3
                          ? "neutral"
                          : "critical";
                    const reviewDate = review?.review_creation_date
                      ? new Date(review.review_creation_date)
                      : null;
                    const orderLabel = review?.order_id
                      ? `Order ${review.order_id}`
                      : `Review ${review?.review_id || index + 1}`;

                    return (
                      <article
                        className={`customer-feedback-item ${feedbackTone}`}
                        key={review?.review_id || review?.order_id || index}
                      >
                        <span className={`customer-feedback-rating ${feedbackTone}`}>
                          <Star size={13} fill="currentColor" />
                          {hasRating ? `${rating}/5` : "—"}
                        </span>
                        <span className="customer-feedback-order">{orderLabel}</span>
                        <div className="customer-feedback-comment">
                          {review?.review_comment_title && (
                            <h3>{review.review_comment_title}</h3>
                          )}
                          {review?.review_comment_message && (
                            <p>{review.review_comment_message}</p>
                          )}
                        </div>
                        <time className="customer-feedback-date">
                          {reviewDate && !Number.isNaN(reviewDate.getTime())
                            ? reviewDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Date unavailable"}
                        </time>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  {detailsLoading
                    ? "Loading customer feedback…"
                    : dashboardData?.recentReviews
                      ? "No written customer comments are available."
                      : "Customer feedback is unavailable."}
                </div>
              )}
            </div>

            </div>

            </section>

          {/* ===============================================
              AT-RISK CUSTOMERS + ACTIVE CAMPAIGNS
          =============================================== */}

          <section className="dashboard-insight-group">
          <div className="dashboard-insight-subgroup">
          <div className="dashboard-section-heading">
            <h2>Churn and retention insights</h2>
            <p>Focus on customers at risk and the campaigns available to retain them.</p>
          </div>

          </div>


          {/* ===============================================
              AT-RISK CUSTOMERS
          =============================================== */}

          <div className="dashboard-insight-subgroup retention-insight-subgroup">
          <div className="dashboard-card at-risk-card">

            <div className="at-risk-layout">

              {/* LEFT: CUSTOMER LIST */}
              <div className="at-risk-list-panel">

                <div className="at-risk-panel-header">

                  <div>
                    <h2>At-Risk Customers</h2>
                    <p>
                      Customers with the highest churn risk
                    </p>
                  </div>

                  <button
                    className="at-risk-view-all"
                    onClick={() =>
                      navigate("/churn-prediction")
                    }
                  >
                    View all
                  </button>

                </div>

                <div className="at-risk-toolbar">

                  <div className="at-risk-search">

                    <Search size={14} />

                    <input
                      type="text"
                      value={riskSearchText}
                      onChange={(event) =>
                        setRiskSearchText(event.target.value)
                      }
                      placeholder="Search by member ID (e.g. CU-10432)"
                    />

                  </div>

                  <select
                    value={riskFilter}
                    onChange={(event) =>
                      setRiskFilter(event.target.value)
                    }
                    className="at-risk-filter"
                  >
                    <option value="All">All tiers</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>

                </div>

                <div className="at-risk-list-wrapper">

                  <table className="at-risk-list-table">

                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Region</th>
                        <th>Risk</th>
                        <th>Tier</th>
                      </tr>
                    </thead>

                    <tbody>

                      {filteredAtRisk
                        .slice(0, 10)
                        .map((customer, index) => {

                          const customerId =
                            getCustomerId(customer);

                          const score =
                            getRiskScore(customer);

                          const risk =
                            getRiskLabel(customer);

                          const isSelected =
                            selectedCustomer === customer;

                          const riskClass =
                            risk
                              .toLowerCase()
                              .replace(/\s+/g, "-");

                          const riskWidth =
                            score === null
                              ? 0
                              : Math.max(
                                  8,
                                  Math.min(
                                    100,
                                    score <= 1
                                      ? score * 100
                                      : score
                                  )
                                );

                          return (
                            <tr
                              key={
                                customerId ||
                                index
                              }
                              className={
                                isSelected
                                  ? "selected-risk-row"
                                  : ""
                              }
                              onClick={() =>
                                setSelectedCustomer(customer)
                              }
                            >

                              <td>
                                <strong>
                                  {customer?.name ||
                                    customer?.customer_name ||
                                    customerId ||
                                    "Customer"}
                                </strong>

                                <small>
                                  {customerId || "—"}
                                </small>
                              </td>

                              <td>
                                {formatLabel(
                                  getRegion(customer)
                                )}
                              </td>

                              <td>
                                <div className="risk-meter">

                                  <div className="risk-meter-track">
                                    <div
                                      className={`risk-meter-fill ${riskClass}`}
                                      style={{
                                        width: `${riskWidth}%`,
                                      }}
                                    />
                                  </div>

                                </div>
                              </td>

                              <td>
                                <span
                                  className={`risk-tier-badge ${riskClass}`}
                                >
                                  {risk}
                                </span>
                              </td>

                            </tr>
                          );

                        })}

                      {filteredAtRisk.length === 0 && (
                        <tr>
                          <td
                            colSpan="4"
                            className="at-risk-empty"
                          >
                            {detailsLoading ? "Loading at-risk customers…" : "No at-risk customers found."}
                          </td>
                        </tr>
                      )}

                    </tbody>

                  </table>

                </div>

              </div>


              {/* RIGHT: SELECTED CUSTOMER DETAIL */}
              <div className="at-risk-detail-panel">

                {selectedCustomer ? (

                  <>
                    <div className="at-risk-detail-header">

                      <div>
                        <h3>
                          {getCustomerId(
                            selectedRiskDetails
                          ) || "Customer"}
                        </h3>

                        <p>
                          GET /members/{getCustomerId(
                            selectedCustomer
                          ) || "id"}/risk
                        </p>
                      </div>

                      <span
                        className={`risk-detail-badge ${getRiskLabel(
                          selectedCustomer
                        )
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {getRiskLabel(
                          selectedCustomer
                        )}
                      </span>

                      <button
                        className="details-button"
                        onClick={() =>
                          setShowRiskModal(true)
                        }
                      >
                        Risk details
                      </button>

                    </div>


                    <div className="risk-detail-summary">

                      <div>
                        <span>Risk score</span>
                        <strong>
                          {getRiskScore(selectedCustomer) === null
                            ? "—"
                            : getRiskScore(selectedCustomer) <= 1
                              ? getRiskScore(selectedCustomer).toFixed(2)
                              : getRiskScore(selectedCustomer).toFixed(1)}
                        </strong>
                      </div>

                      <div>
                        <span>Segment</span>
                        <strong>
                          {formatLabel(
                            selectedCustomer?.segment ||
                            selectedCustomer?.risk_tier ||
                            "—"
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Value tier</span>
                        <strong>
                          {formatLabel(
                            getValueTier(
                              selectedRiskDetails
                            )
                          )}
                        </strong>
                      </div>

                    </div>


                    <div className="risk-reasons-header">
                      Customer risk endpoint · SHAP contributions
                    </div>

                    <div className="risk-reasons">

                      {selectedRiskReasons.length > 0 ? (

                        selectedRiskReasons.map(
                          (reason, index) => {

                            const numericValue =
                              Number(
                                reason.value
                              );

                            const width =
                              Number.isFinite(
                                numericValue
                              )
                                ? Math.min(
                                    100,
                                    Math.max(
                                      8,
                                      Math.abs(
                                        numericValue
                                      ) * 100
                                    )
                                  )
                                : 45;

                            const positive =
                              !Number.isFinite(
                                numericValue
                              ) ||
                              numericValue >= 0;

                            return (
                              <div
                                className="risk-reason-row"
                                key={`${reason.label}-${index}`}
                              >

                                <span>
                                  {formatLabel(
                                    reason.label
                                  )}
                                </span>

                                <div className="risk-reason-track">
                                  <div
                                    className={
                                      positive
                                        ? "risk-reason-fill positive"
                                        : "risk-reason-fill negative"
                                    }
                                    style={{
                                      width: `${width}%`,
                                    }}
                                  />
                                </div>

                                <strong>
                                  {Number.isFinite(
                                    numericValue
                                  )
                                    ? numericValue > 0
                                      ? `+${numericValue.toFixed(2)}`
                                      : numericValue.toFixed(2)
                                    : "—"}
                                </strong>

                              </div>
                            );

                          }
                        )

                      ) : (

                        <div className="risk-no-reasons">
                          {selectedRiskPrediction?.customerId === selectedCustomerId
                            ? selectedRiskPrediction.error || "The risk endpoint returned no SHAP values for this customer."
                            : "Loading SHAP contributions…"}
                        </div>

                      )}

                    </div>

                  </>

                ) : (

                  <div className="risk-no-selection">
                    Select a customer to view risk details.
                  </div>

                )}

              </div>

            </div>

          </div>


          {/* ===============================================
              CAMPAIGN RECOMMENDATIONS
          =============================================== */}

          <div className="dashboard-card">

            <div className="card-header">

              <div>

                <h2>
                  Campaign Recommendations
                </h2>

                <p>
                  Churn prevention campaign
                  activity
                </p>

              </div>

              <button
                className="details-button"
                onClick={() =>
                  navigate(
                    "/churn-prediction"
                  )
                }
              >
                Manage
              </button>

            </div>


            <div className="campaign-summary">

              {campaignItems.length > 0 ? (
                campaignItems.map((campaign, index) => (
                  <div
                    className="campaign-summary-item"
                    key={campaign?.campaign_name || campaign?.name || index}
                  >
                    <span>
                      {campaign?.campaign_name || campaign?.name || "—"}
                    </span>
                    <strong>
                      {formatNumber(campaign?.customer_count)} customers
                    </strong>
                    <div className="campaign-summary-track">
                      <div
                        className="campaign-summary-fill"
                        style={{
                          width: maxCampaignCustomers > 0
                            ? `${(Number(campaign?.customer_count || 0) / maxCampaignCustomers) * 100}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  {dashboardData?.campaigns
                    ? "No active campaign data returned."
                    : "Campaign data unavailable."}
                </div>
              )}

            </div>

          </div>


          </div>

          </section>

        </section>

      </main>


      {/* ===================================================
          CUSTOMER RISK MODAL
      =================================================== */}

      {showRiskModal && selectedCustomer && (

        <div className="modal-overlay">

          <div className="chart-details-modal">

            <button
              className="modal-close"
              onClick={() =>
                setShowRiskModal(false)
              }
            >

              <X
                size={20}
              />

            </button>


            <h2>
              Customer Risk
            </h2>


            <p>
              Customer risk information
              from the churn model.
            </p>


            <div className="chart-detail-stat">

              <span>
                Customer ID
              </span>

              <strong>

                {getCustomerId(
                  selectedCustomer
                ) || "—"}

              </strong>

            </div>


            <div className="chart-detail-stat">

              <span>
                Segment
              </span>

              <strong>

                {formatLabel(
                  selectedCustomer?.segment ||
                  selectedCustomer?.risk_tier ||
                  "—"
                )}

              </strong>

            </div>


            <div className="chart-detail-stat">

              <span>
                Risk Level
              </span>

              <strong>

                {getRiskLabel(
                  selectedCustomer
                )}

              </strong>

            </div>


            <div className="chart-detail-stat">

              <span>
                Churn Score
              </span>

              <strong>

                {getRiskScore(selectedCustomer) === null
                  ? "—"
                  : getRiskScore(selectedCustomer).toFixed(3)}

              </strong>

            </div>


            <div
              style={{
                marginTop: "20px",
              }}
            >

              <button
                className="details-button"
                onClick={() => {

                  const customerId =
                    getCustomerId(
                      selectedCustomer
                    );

                  if (!customerId) {
                    return;
                  }

                  navigate(
                    `/customer-details/${encodeURIComponent(
                      customerId
                    )}`
                  );

                }}
              >

                Open Customer Details

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ===================================================
          LOGOUT MODAL
      =================================================== */}

      {showLogoutPopup && (

        <div className="modal-overlay">

          <div className="logout-modal">

            <button
              className="modal-close"
              onClick={() =>
                setShowLogoutPopup(
                  false
                )
              }
            >

              <X
                size={20}
              />

            </button>


            <div className="logout-icon">

              <LogOut
                size={28}
              />

            </div>


            <h2>
              Logout?
            </h2>


            <p>
              Are you sure you want to
              logout from Customer Sphere?
            </p>


            <div className="logout-actions">

              <button
                className="cancel-button"
                onClick={() =>
                  setShowLogoutPopup(
                    false
                  )
                }
              >

                Cancel

              </button>


              <button
                className="confirm-logout-button"
                onClick={
                  handleLogout
                }
              >

                Log Out

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default Dashboard;
