import {
  getActiveCampaigns,
  getChurnSummary,
  getChurnTrend,
  getCohortRetention,
  getCustomerSummary,
  getCustomersByRegion,
  getRecentReviews,
  getRevenueSummary,
  getRevenueTrend,
  getReviewSentiment,
} from "./dashboardApi";

export async function getInsightsData() {
  const requests = {
    customers: getCustomerSummary(),
    churn: getChurnSummary(),
    revenue: getRevenueSummary(),
    churnTrend: getChurnTrend(),
    revenueTrend: getRevenueTrend("month"),
    regions: getCustomersByRegion(),
    cohortRetention: getCohortRetention(12),
    reviewSentiment: getReviewSentiment(),
    campaigns: getActiveCampaigns(),
    recentReviews: getRecentReviews(100),
  };

  const entries = Object.entries(requests);
  const results = await Promise.allSettled(Object.values(requests));
  const data = {};
  const errors = {};

  entries.forEach(([key], index) => {
    const result = results[index];
    if (result.status === "fulfilled") {
      data[key] = result.value;
    } else {
      data[key] = null;
      errors[key] = result.reason?.message || "Request failed";
    }
  });

  return { data, errors };
}