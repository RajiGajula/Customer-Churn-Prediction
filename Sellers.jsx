import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Store } from "lucide-react";

import PageHeader from "../components/PageHeader.jsx";
import SummaryStatCard from "../components/SummaryStatCard.jsx";
import { createSeller, getSellerFilters, getSellers } from "../services/sellersApi";
import "../styles/Sellers.css";

const emptySeller = {
  seller_id: "",
  seller_zip_code_prefix: "",
  seller_city: "",
  seller_state: "",
};

function generateSellerId() {
  return `SEL-${crypto.randomUUID().replaceAll("-", "").slice(0, 28)}`;
}

function Sellers() {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [filterOptions, setFilterOptions] = useState({ states: [], cities: [] });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ ...emptySeller, seller_id: generateSellerId() });
  const [isAdmin] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      return (localStorage.getItem("role") || user.role || "").toLowerCase() === "admin";
    } catch {
      return (localStorage.getItem("role") || "").toLowerCase() === "admin";
    }
  });

  const loadSellers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const result = await getSellers({ search: query, state, city, page, limit: 20 });
      setSellers(result.data || []);
      setTotal(Number(result.total) || 0);
      setTotalPages(Number(result.total_pages) || 0);
    } catch (loadError) {
      setError(loadError.message || "Unable to load sellers.");
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, [query, state, city, page]);

  useEffect(() => {
    const timeoutId = window.setTimeout(loadSellers, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSellers]);

  useEffect(() => {
    let active = true;
    getSellerFilters()
      .then((options) => {
        if (active) setFilterOptions(options);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message || "Unable to load seller filters.");
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setFormError("");
      await createSeller({
        ...form,
        seller_id: form.seller_id.trim(),
        seller_zip_code_prefix: form.seller_zip_code_prefix.trim(),
        seller_city: form.seller_city.trim(),
        seller_state: form.seller_state.trim().toUpperCase(),
      });
      setForm({ ...emptySeller, seller_id: generateSellerId() });
      setShowForm(false);
      setPage(1);
      setQuery("");
      setSearch("");
      const result = await getSellers({ page: 1, limit: 20 });
      setSellers(result.data || []);
      setTotal(Number(result.total) || 0);
      setTotalPages(Number(result.total_pages) || 0);
    } catch (saveError) {
      setFormError(saveError.message || "Unable to add seller.");
    } finally {
      setSaving(false);
    }
  };

  const firstRecord = total === 0 ? 0 : (page - 1) * 20 + 1;
  const lastRecord = Math.min(page * 20, total);

  return (
    <main className="sellers-page">
      <PageHeader
        title="Sellers"
        description="Browse and manage seller records."
        icon={<Store size={23} />}
        className="sellers-header"
        titleClassName="sellers-title"
        iconClassName="sellers-title-icon"
        actionsClassName="sellers-header-actions"
        actions={
          <>
          <button className="sellers-secondary-button" type="button" onClick={loadSellers} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          {isAdmin && (
            <button className="sellers-primary-button" type="button" onClick={() => { setFormError(""); setForm((current) => ({ ...current, seller_id: generateSellerId() })); setShowForm((open) => !open); }}>
              <Plus size={17} /> Add seller
            </button>
          )}
          </>
        }
      />

      <SummaryStatCard
        className="sellers-summary-card"
        label="Total sellers"
        value={total.toLocaleString("en-US")}
      />

      {showForm && (
        <form className="sellers-form-card" onSubmit={handleSubmit}>
          <div>
            <h2>Add seller details</h2>
            <p>The seller will be saved to the sellers catalog.</p>
          </div>
          {formError && <div className="sellers-error" role="alert">{formError}</div>}
          <div className="sellers-form-grid">
            <label>Seller ID<input readOnly value={form.seller_id} /></label>
            <label>ZIP code prefix<input required maxLength={5} value={form.seller_zip_code_prefix} onChange={(event) => setForm({ ...form, seller_zip_code_prefix: event.target.value })} /></label>
            <label>City<input required maxLength={64} value={form.seller_city} onChange={(event) => setForm({ ...form, seller_city: event.target.value })} /></label>
            <label>State code<input required minLength={2} maxLength={2} value={form.seller_state} onChange={(event) => setForm({ ...form, seller_state: event.target.value })} /></label>
          </div>
          <div className="sellers-form-actions">
            <button className="sellers-secondary-button" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="sellers-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save seller"}</button>
          </div>
        </form>
      )}

      <section className="sellers-list-card">
        <form className="sellers-search" onSubmit={handleSearch}>
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search seller ID, city, state, or ZIP..." />
          <button type="submit">Search</button>
        </form>
        <div className="sellers-filters">
          <label>
            State
            <select
              value={state}
              onChange={(event) => {
                setState(event.target.value);
                setCity("");
                setPage(1);
              }}
            >
              <option value="">All states</option>
              {filterOptions.states.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            City
            <select
              value={city}
              onChange={(event) => {
                if (!event.target.value) {
                  setCity("");
                } else {
                  const [selectedState, selectedCity] = JSON.parse(event.target.value);
                  setState(selectedState);
                  setCity(selectedCity);
                }
                setPage(1);
              }}
            >
              <option value="">All cities</option>
              {filterOptions.cities
                .filter((item) => !state || item.state === state)
                .map((item) => (
                  <option key={`${item.state}-${item.city}`} value={JSON.stringify([item.state, item.city])}>
                    {item.city} ({item.state})
                  </option>
                ))}
            </select>
          </label>
          {(state || city) && (
            <button
              className="sellers-secondary-button"
              type="button"
              onClick={() => {
                setState("");
                setCity("");
                setPage(1);
              }}
            >
              Clear filters
            </button>
          )}
        </div>
        {error && <div className="sellers-error" role="alert">{error}</div>}
        {loading ? <div className="sellers-empty">Loading sellers...</div> : sellers.length === 0 ? (
          <div className="sellers-empty"><Store size={32} /><strong>No sellers found</strong><span>Add a seller or change your search.</span></div>
        ) : (
          <>
            <div className="sellers-table-wrap">
              <table className="sellers-table">
                <thead><tr><th>Seller ID</th><th>ZIP code prefix</th><th>City</th><th>State</th></tr></thead>
                <tbody>{sellers.map((seller) => (
                  <tr key={seller.seller_id}>
                    <td><strong>{seller.seller_id}</strong>{seller.is_new && <span className="sellers-new-badge">New</span>}</td>
                    <td>{seller.seller_zip_code_prefix}</td>
                    <td>{seller.seller_city}</td>
                    <td>{seller.seller_state}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div className="sellers-pagination">
              <span>Showing {firstRecord}–{lastRecord} of {total.toLocaleString("en-US")}</span>
              <div>
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={17} /></button>
                <span>Page {page}{totalPages ? ` of ${totalPages}` : ""}</span>
                <button type="button" aria-label="Next page" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}><ChevronRight size={17} /></button>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Sellers;
