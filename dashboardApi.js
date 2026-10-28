// =========================================================
// CustomerSphere - Churn Dashboard_backup API Service
// =========================================================

const API_URL = "http://127.0.0.1:8000";


const API_V1_URL = `${API_URL}/api/v1`;
const pendingGetRequests = new Map();

function withDateRange(endpoint, dateRange = {}) {
  const query = new URLSearchParams();
  if (dateRange.start_date) query.set("start_date", dateRange.start_date);
  if (dateRange.end_date) query.set("end_date", dateRange.end_date);
  const suffix = query.toString();
  return `${endpoint}${suffix ? `?${suffix}` : ""}`;
}

// =========================================================
// HEADERS
// =========================================================

function getHeaders() {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// =========================================================
// GENERIC GET
// =========================================================

async function getRequest(endpoint, baseUrl = API_URL) {
  const url = `${baseUrl}${endpoint}`;
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    "";
  const requestKey = `${url}:${token}`;

  if (pendingGetRequests.has(requestKey)) {
    return pendingGetRequests.get(requestKey);
  }

  const request = (async () => {
    console.log("[API GET]", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      const message =
        data?.detail ||
        data?.message ||
        `Request failed: ${response.status} ${response.statusText}`;

      console.error("[API ERROR]", url, message);

      throw new Error(message);
    }

    console.log("[API SUCCESS]", url, data);

    return data;
  })();

  pendingGetRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    pendingGetRequests.delete(requestKey);
  }
}

// =========================================================
// GENERIC POST
// =========================================================

async function postRequest(endpoint, body, baseUrl = API_URL) {
  const url = `${baseUrl}${endpoint}`;

  console.log("[API POST]", url, body);

  const response = await fetch(url, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      `Request failed: ${response.status} ${response.statusText}`;

    console.error("[API ERROR]", url, message);

    throw new Error(message);
  }

  console.log("[API SUCCESS]", url, data);

  return data;
}

// =========================================================
// CUSTOMER SUMMARY
// GET /api/v1/customers/summary
// =========================================================

export async function getCustomerSummary(dateRange) {
  return getRequest(withDateRange("/customers/summary", dateRange), API_V1_URL);
}

export async function getGlobalSearchResults(query) {
  return getRequest(
    `/dashboard/global-search?q=${encodeURIComponent(query)}`,
    API_URL
  );
}

export async function getNotifications() {
  return getRequest("/dashboard/notifications", API_URL);
}

export async function markNotificationsRead() {
  return postRequest("/dashboard/notifications/read", {}, API_URL);
}

export async function markNotificationRead(notificationId) {
  return postRequest(
    `/dashboard/notifications/${encodeURIComponent(notificationId)}/read`,
    {},
    API_URL
  );
}

// =========================================================
// CHURN SUMMARY
// GET /api/v1/churn/summary
// =========================================================

export async function getChurnSummary(dateRange) {
  return getRequest(withDateRange("/churn/summary", dateRange), API_V1_URL);
}

// =========================================================
// REVENUE SUMMARY
// GET /api/v1/revenue/summary
// =========================================================

export async function getRevenueSummary(dateRange) {
  return getRequest(withDateRange("/revenue/summary", dateRange), API_V1_URL);
}

// =========================================================
// ACTIVE CAMPAIGNS
// GET /api/v1/campaigns/active
// =========================================================

export async function getActiveCampaigns(dateRange) {
  return getRequest(withDateRange("/campaigns/active", dateRange), API_V1_URL);
}

// =========================================================
// CHURN TREND
// GET /api/v1/churn/trend
// =========================================================

export async function getChurnTrend(dateRange) {
  return getRequest(withDateRange("/churn/trend", dateRange), API_V1_URL);
}

// =========================================================
// REVENUE TREND
// GET /api/v1/revenue/trend
// =========================================================

export async function getRevenueTrend(granularity = "month", dateRange) {
  const query = new URLSearchParams({ granularity });
  if (dateRange?.start_date) query.set("start_date", dateRange.start_date);
  if (dateRange?.end_date) query.set("end_date", dateRange.end_date);
  return getRequest(
    `/revenue/trend?${query.toString()}`,
    API_V1_URL
  );
}

// =========================================================
// CUSTOMERS BY REGION
// GET /api/v1/customers/byregion
// =========================================================

export async function getCustomersByRegion(dateRange) {
  return getRequest(withDateRange("/customers/byregion", dateRange), API_V1_URL);
}

// =========================================================
// ORDERS BY TYPE
// GET /api/v1/orders/by-type
// =========================================================

export async function getOrdersByType(dateRange) {
  return getRequest(withDateRange("/orders/by-type", dateRange), API_V1_URL);
}

// =========================================================
// REVIEW SENTIMENT
// GET /api/v1/reviews/sentiment
// =========================================================

export async function getReviewSentiment(dateRange) {
  return getRequest(withDateRange("/reviews/sentiment", dateRange), API_V1_URL);
}

// =========================================================
// TOP CHURN FEATURES
// GET /api/v1/churn/top-features
// =========================================================

export async function getTopChurnFeatures(dateRange) {
  return getRequest(withDateRange("/churn/top-features", dateRange), API_V1_URL);
}

// =========================================================
// CATEGORY CHURN CORRELATION
// GET /api/v1/products/category-churn-correlation
// =========================================================

export async function getCategoryChurnCorrelation(dateRange) {
  return getRequest(
    withDateRange("/products/category-churn-correlation", dateRange),
    API_V1_URL
  );
}

// =========================================================
// PAYMENT METHODS
// GET /api/v1/payments/methods
// =========================================================

export async function getPaymentMethods(dateRange) {
  return getRequest(withDateRange("/payments/methods", dateRange), API_V1_URL);
}

// =========================================================
// AT-RISK CUSTOMERS
// GET /api/v1/atrisk
// =========================================================

export async function getAtRiskCustomers(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.append(key, value);
    }
  });

  const queryString = query.toString();

  return getRequest(
    `/atrisk${queryString ? `?${queryString}` : ""}`,
    API_V1_URL
  );
}

// =========================================================
// CUSTOMER RISK
// GET /api/v1/members/{customer_unique_id}/risk
// =========================================================

export async function getCustomerRisk(customerId) {
  const encodedId = encodeURIComponent(customerId);

  return getRequest(
    `/members/${encodedId}/risk`,
    API_V1_URL
  );
}

// =========================================================
// CHURN PREDICTION
// POST /api/v1/predict
// =========================================================

export async function predictChurn(customerData) {
  return postRequest(
    "/predict",
    customerData,
    API_V1_URL
  );
}

// =========================================================
// CAMPAIGN EVALUATION
// POST /api/v1/campaigns/evaluate
// =========================================================

export async function evaluateCampaign(customerData) {
  return postRequest(
    "/campaigns/evaluate",
    customerData,
    API_V1_URL
  );
}

// =========================================================
// COHORT RETENTION
// GET /api/v1/customers/cohort-retention
// =========================================================

export async function getCohortRetention(months = 12, dateRange) {
  const query = new URLSearchParams({ months: String(months) });
  if (dateRange?.start_date) query.set("start_date", dateRange.start_date);
  if (dateRange?.end_date) query.set("end_date", dateRange.end_date);
  return getRequest(
    `/customers/cohort-retention?${query.toString()}`,
    API_V1_URL
  );
}

export async function getRecentReviews(limit = 100, dateRange) {
  const query = new URLSearchParams({ page: "1", limit: String(limit) });
  if (dateRange?.start_date) query.set("start_date", dateRange.start_date);
  if (dateRange?.end_date) query.set("end_date", dateRange.end_date);
  return getRequest(`/reviews/?${query.toString()}`);
}

// =========================================================
// COMPLETE CHURN DASHBOARD DATA
// =========================================================

async function getSettledDashboardData(requests) {
  const entries = Object.entries(requests);
  const results = await Promise.allSettled(
    Object.values(requests)
  );

  const data = {};
  const errors = {};

  entries.forEach(([key], index) => {
    const result = results[index];

    if (result.status === "fulfilled") {
      data[key] = result.value;
    } else {
      data[key] = null;
      errors[key] = result.reason?.message || "Request failed";
      console.error(`[DASHBOARD API FAILED] ${key}:`, result.reason);
    }
  });

  return { data, errors };
}

export async function getDashboardCoreData(dateRange) {
  return getSettledDashboardData({
    customers: getCustomerSummary(dateRange),
    revenue: getRevenueSummary(dateRange),
    campaigns: getActiveCampaigns(dateRange),
  });
}

export async function getDashboardSupplementalData(dateRange) {
  return getSettledDashboardData({
    churn: getChurnSummary(dateRange),
    revenueTrend: getRevenueTrend("month", dateRange),
    recentReviews: getRecentReviews(100, dateRange),
    atRisk: getAtRiskCustomers(dateRange || {}),
  });
}

export async function getChurnDashboardData() {
  const [core, supplemental] = await Promise.all([
    getDashboardCoreData(),
    getDashboardSupplementalData(),
  ]);
  return { ...core.data, ...supplemental.data };
}

// =========================================================
// OLD DASHBOARD API
// Kept for backward compatibility
// GET /dashboard/data
// =========================================================

export async function getDashboardData() {
  return getRequest("/dashboard/data", API_URL);
}

// =========================================================
// DEFAULT EXPORT
// =========================================================

export default {
  getCustomerSummary,
  getChurnSummary,
  getRevenueSummary,
  getActiveCampaigns,
  getChurnTrend,
  getRevenueTrend,
  getCustomersByRegion,
  getOrdersByType,
  getReviewSentiment,
  getTopChurnFeatures,
  getCategoryChurnCorrelation,
  getPaymentMethods,
  getAtRiskCustomers,
  getCustomerRisk,
  predictChurn,
  evaluateCampaign,
  getCohortRetention,
  getRecentReviews,
  getChurnDashboardData,
  getDashboardData,
};