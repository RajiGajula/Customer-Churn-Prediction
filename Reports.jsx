import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getInsightsData } from "../services/insightsApi";
import "../styles/Insights.css";

const REPORT_OPTIONS = [
  { value: "risk", label: "Churn risk summary" },
  { value: "revenue", label: "Revenue summary" },
  { value: "revenueTrend", label: "Revenue trend" },
  { value: "churnTrend", label: "Churn trend" },
  { value: "cohorts", label: "Cohort retention" },
  { value: "reviews", label: "Customer feedback" },
  { value: "campaigns", label: "Campaign activity" },
  { value: "regions", label: "Customers by region" },
];

const RANGE_OPTIONS = [
  { value: "all", label: "All time" },
  { value: "year", label: "This year" },
  { value: "12months", label: "Last 12 months" },
  { value: "90days", label: "Last 90 days" },
];

const DATE_FILTERED_REPORTS = new Set([
  "revenueTrend",
  "churnTrend",
  "cohorts",
  "reviews",
]);

function rowsFrom(source, keys) {
  if (Array.isArray(source)) return source;
  for (const key of keys) {
    if (Array.isArray(source?.[key])) return source[key];
  }

  return [];
}

function formatCount(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function inRange(value, range) {
  if (range === "all") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  const start = new Date(now);
  if (range === "year") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  } else if (range === "12months") {
    start.setFullYear(start.getFullYear() - 1);
  } else {
    start.setDate(start.getDate() - 90);
  }
  return date >= start && date <= now;
}

function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadCsv(rows, filename) {
  if (rows.length === 0) return;
  const columns = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const csv = [
    columns.map(escapeCsv).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(",")),
  ].join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function normalizePeriodRows(rows, type) {
  return rows.flatMap((row) => {
    const date = row?.period_date || row?.period || row?.month || row?.date || row?.week;
    const value = type === "revenueTrend"
      ? row?.revenue ?? row?.total_revenue ?? row?.actual_revenue ?? row?.actual ?? row?.value
      : row?.churn_rate ?? row?.actual_churn_rate ?? row?.actual ?? row?.rate;
    if (!date || value === null || value === undefined || !Number.isFinite(Number(value))) return [];
    return [{
      period: date,
      [type === "revenueTrend" ? "revenue" : "churn_rate"]: Number(value),
      ...(type === "revenueTrend" ? { currency: row.currency || "BRL" } : {}),
    }];
  });
}

function buildRows(data, reportType, range, riskTier) {
  const churn = data.churn || {};
  const revenue = data.revenue || {};
  if (reportType === "risk") {
    const counts = churn.risk_tier_counts || {};
    const thresholds = churn.risk_thresholds || {};
    return ["high", "medium", "low"]
      .filter((tier) => riskTier === "all" || riskTier === tier)
      .map((tier) => ({
        risk_tier: tier,
        customers: counts[tier] ?? counts[tier[0].toUpperCase() + tier.slice(1)] ?? null,
        threshold: tier === "high"
          ? thresholds.high ?? null
          : tier === "medium"
            ? `${thresholds.medium ?? ""} to below ${thresholds.high ?? ""}`
            : thresholds.medium == null
              ? null
              : `below ${thresholds.medium}`,
        scored_customers: churn.scored_customers ?? null,
        model_version: churn.model_version ?? null,
        source: churn.source ?? null,
      }));
  }
  if (reportType === "revenue") {
    return [
      { metric: "Total revenue", value: revenue.total_revenue ?? null, currency: revenue.currency ?? null },
      { metric: "Total freight", value: revenue.total_freight ?? null, currency: revenue.currency ?? null },
      { metric: "Total orders", value: revenue.total_orders ?? null, currency: revenue.currency ?? null },
      { metric: "Average order value", value: revenue.average_order_value ?? null, currency: revenue.currency ?? null },
    ];
  }
  if (reportType === "revenueTrend" || reportType === "churnTrend") {
    const rows = rowsFrom(data[reportType], ["data", "trend", "items"]);
    return normalizePeriodRows(rows, reportType).filter((row) => inRange(row.period, range));
  }
  if (reportType === "cohorts") {
    return rowsFrom(data.cohortRetention, ["cohorts", "data", "items"])
      .filter((row) => range === "all" || inRange(row.cohort, range))
      .map((row) => ({
        cohort: row.cohort,
        cohort_size: row.cohort_size ?? null,
        retention_m0: row.retention?.[0] ?? null,
        retention_m1: row.retention?.[1] ?? null,
        retention_m2: row.retention?.[2] ?? null,
        retention_m3: row.retention?.[3] ?? null,
        retention_m4: row.retention?.[4] ?? null,
        retention_m5: row.retention?.[5] ?? null,
      }));
  }
  if (reportType === "reviews") {
    return rowsFrom(data.recentReviews, ["data", "reviews", "items"])
      .filter((row) => row.review_comment_title || row.review_comment_message)
      .filter((row) => range === "all" || inRange(row.review_creation_date, range))
      .map((row) => ({
        review_id: row.review_id ?? null,
        order_id: row.order_id ?? null,
        score: row.review_score ?? null,
        title: row.review_comment_title ?? null,
        comment: row.review_comment_message ?? null,
        created_at: row.review_creation_date ?? null,
      }));
  }
  if (reportType === "campaigns") {
    return rowsFrom(data.campaigns, ["campaigns", "data", "items"])
      .map((row) => ({
        campaign_name: row.campaign_name ?? row.name ?? null,
        customers_targeted: row.customer_count ?? null,
        average_priority: row.average_priority ?? null,
      }));
  }
  if (reportType === "regions") {
    return rowsFrom(data.regions, ["data", "regions", "items"])
      .map((row) => ({
        region: row.region ?? row.state ?? row.label ?? null,
        customers: row.customers ?? row.count ?? null,
        percentage: row.percentage ?? null,
      }));
  }
  return [];
}

function Reports() {
  const navigate = useNavigate();
  const [report, setReport] = useState({ data: {}, errors: {} });
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("risk");
  const [range, setRange] = useState("all");
  const [riskTier, setRiskTier] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let current = true;
    setLoading(true);
    getInsightsData().then((result) => {
      if (!current) return;
      setReport(result);
      setLoading(false);
    });
    return () => {
      current = false;
    };
  }, [reloadKey]);

  const rows = buildRows(report.data, reportType, range, riskTier);
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const preview = rows.slice(0, 20);
  const reportSources = {
    risk: { label: "GET /churn/summary", key: "churn" },
    revenue: { label: "GET /revenue/summary", key: "revenue" },
    revenueTrend: { label: "GET /revenue/trend", key: "revenueTrend" },
    churnTrend: { label: "GET /churn/trend", key: "churnTrend" },
    cohorts: { label: "GET /customers/cohort-retention", key: "cohortRetention" },
    reviews: { label: "GET /reviews/", key: "recentReviews" },
    campaigns: { label: "GET /campaigns/active", key: "campaigns" },
    regions: { label: "GET /customers/byregion", key: "regions" },
  };
  const sourceForReport = reportSources[reportType];
  const sourceUnavailable = Boolean(report.errors[sourceForReport.key]);

  const handleExport = () => {
    const filename = `${reportType}-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(rows, filename);
  };

  return (
    <main className="insights-page">
      <header className="insights-header">
        <div className="insights-heading">
          <button className="insights-back" type="button" onClick={() => navigate("/dashboard")} aria-label="Back to dashboard">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Reports</h1>
            <p>Build and export customer, risk, revenue, and campaign reports</p>
          </div>
        </div>
        <button className="insights-refresh" type="button" onClick={() => setReloadKey((key) => key + 1)} disabled={loading}>
          <RefreshCw size={16} className={loading ? "insights-spin" : ""} />
          Refresh data
        </button>
      </header>

      <section className="reports-builder">
        <div className="reports-filter">
          <label>
            Report
            <select value={reportType} onChange={(event) => setReportType(event.target.value)}>
              {REPORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {DATE_FILTERED_REPORTS.has(reportType) && (
            <label>
              Date range
              <select value={range} onChange={(event) => setRange(event.target.value)}>
                {RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          )}
          {reportType === "risk" && (
            <label>
              Risk tier
              <select value={riskTier} onChange={(event) => setRiskTier(event.target.value)}>
                <option value="all">All tiers</option>
                <option value="high">High risk</option>
                <option value="medium">Medium risk</option>
                <option value="low">Low risk</option>
              </select>
            </label>
          )}
          <button className="reports-export" type="button" onClick={handleExport} disabled={loading || rows.length === 0}>
            <Download size={16} /> Export CSV ({formatCount(rows.length)})
          </button>
        </div>
        <div className="reports-summary-line">
          <span><FileText size={15} /> {REPORT_OPTIONS.find((option) => option.value === reportType)?.label}</span>
          <span>{sourceForReport.label}</span>
          <span>{rows.length.toLocaleString("en-US")} rows · {RANGE_OPTIONS.find((option) => option.value === range)?.label}</span>
        </div>
      </section>

      {(loading || sourceUnavailable) ? (
        <section className="insights-panel reports-preview-empty">
          {loading ? "Loading report data..." : "This report source is unavailable."}
        </section>
      ) : rows.length ? (
        <section className="insights-panel reports-preview">
          <div className="insights-panel-heading">
            <div>
              <h2>Report preview</h2>
              <p>Showing {Math.min(preview.length, 20)} of {rows.length.toLocaleString("en-US")} rows. CSV export includes all rows shown by the selected backend source.</p>
            </div>
          </div>
          <div className="insights-table-scroll">
            <table className="insights-table">
              <thead><tr>{columns.map((column) => <th key={column}>{column.replaceAll("_", " ")}</th>)}</tr></thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={row.review_id || row.order_id || row.cohort || row.campaign_name || row.region || row.metric || row.risk_tier || row.period || index}>
                    {columns.map((column) => <td key={column}>{row[column] === null || row[column] === undefined ? "—" : String(row[column])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="insights-panel reports-preview-empty">
          No rows are available for this report and date range.
        </section>
      )}
    </main>
  );
}

export default Reports;
