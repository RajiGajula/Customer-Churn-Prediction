import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Globe,
  Search,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  Map,
} from "lucide-react";

import {
  getGeography,
  getGeographyStates,
  getGeographySummary,
} from "../services/geographyApi";

import "../styles/Geography.css";


function Geography() {

  const [locations, setLocations] =
    useState([]);

  const [states, setStates] =
    useState([]);

  const [summary, setSummary] =
    useState({
      total_locations: 0,
      total_states: 0,
      total_cities: 0,
    });

  const [search, setSearch] =
    useState("");

  const [selectedState, setSelectedState] =
    useState("");

  const [sortBy, setSortBy] =
    useState("state");

  const [sortDirection, setSortDirection] =
    useState("asc");

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  const limit = 20;


  // =====================================================
  // LOAD GEOGRAPHIC LOCATIONS
  // =====================================================

  const loadLocations = useCallback(async (signal) => {

    try {

      setLoading(true);
      setError("");

      const currentSearch =
        search.trim();


      const data =
        await getGeography({
          search: currentSearch,
          state: selectedState,
          sortBy,
          sortDirection,
          page,
          limit,
          signal,
        });


      // Ignore cancelled requests
      if (signal?.aborted) {
        return;
      }


      setLocations(
        data.data || []
      );


      setTotal(
        Number(data.total) || 0
      );


      setTotalPages(
        Number(data.total_pages) || 0
      );


    } catch (err) {

      if (err?.name === "AbortError") {
        return;
      }


      console.error(
        "Geography loading error:",
        err
      );


      setError(
        err?.message ||
        "Failed to load geography"
      );


      setLocations([]);

      setTotal(0);

      setTotalPages(0);


    } finally {

      if (!signal?.aborted) {
        setLoading(false);
      }

    }

  }, [search, selectedState, sortBy, sortDirection, page]);


  // =====================================================
  // SEARCH + PAGINATION
  // =====================================================

  useEffect(() => {

    const controller =
      new AbortController();


    const timer =
      setTimeout(() => {

        loadLocations(
          controller.signal
        );

      }, 300);


    return () => {

      clearTimeout(timer);

      controller.abort();

    };

  }, [loadLocations]);


  // =====================================================
  // LOAD STATE DISTRIBUTION + SUMMARY
  // =====================================================

  useEffect(() => {

    const loadExtraData =
      async () => {

        try {

          const [
            summaryData,
            statesData,
          ] = await Promise.all([

            getGeographySummary(),

            getGeographyStates(),

          ]);


          setSummary(
            summaryData || {
              total_locations: 0,
              total_states: 0,
              total_cities: 0,
            }
          );


          setStates(
            statesData || []
          );


        } catch (err) {

          console.error(
            "Geography summary error:",
            err
          );

        }

      };


    loadExtraData();

  }, []);


  // =====================================================
  // FORMAT NUMBER
  // =====================================================

  const formatNumber = (value) => {

    return Number(value || 0)
      .toLocaleString("en-US");

  };


  // =====================================================
  // SEARCH HANDLER
  // =====================================================

  const handleSearch = (e) => {

    const value =
      e.target.value;

    setSearch(value);

    // Search always starts from page 1
    setPage(1);

  };

  const handleStateChange = (e) => {
    setSelectedState(e.target.value);
    setPage(1);
  };

  const handleSortChange = (e) => {
    const [field, direction] = e.target.value.split(":");
    setSortBy(field);
    setSortDirection(direction);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedState("");
    setSortBy("state");
    setSortDirection("asc");
    setPage(1);
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (
    loading &&
    locations.length === 0
  ) {

    return (

      <div className="geography-loading">

        <div className="geography-spinner"></div>

        <p>
          Loading geography...
        </p>

      </div>

    );

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="geography-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="geography-header">

        <div>

          <div className="geography-title">

            <Globe size={28} />

            <h1>
              Geography
            </h1>

          </div>


          <p>
            Explore customer locations
            and geographic distribution.
          </p>

        </div>


        {/* Search result count */}

        <span className="geography-count">

          {formatNumber(total)}

          {" "}locations

        </span>

      </header>


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="geography-summary">


        {/* TOTAL LOCATIONS */}

        <div className="geo-card">

          <div className="geo-icon purple">

            <MapPin size={23} />

          </div>


          <span>
            Locations
          </span>


          <strong>

            {formatNumber(
              summary.total_locations
            )}

          </strong>

        </div>


        {/* TOTAL STATES */}

        <div className="geo-card">

          <div className="geo-icon green">

            <Map size={23} />

          </div>


          <span>
            States
          </span>


          <strong>

            {formatNumber(
              summary.total_states
            )}

          </strong>

        </div>


        {/* TOTAL CITIES */}

        <div className="geo-card">

          <div className="geo-icon orange">

            <Building2 size={23} />

          </div>


          <span>
            Cities
          </span>


          <strong>

            {formatNumber(
              summary.total_cities
            )}

          </strong>

        </div>

      </div>


      {/* =================================================
          STATE DISTRIBUTION
      ================================================= */}

      <section className="states-card">


        <div className="geo-section-header">

          <div>

            <h2>
              State Distribution
            </h2>


            <p>
              Geographic locations by state.
            </p>

          </div>

        </div>


        <div className="states-grid">

          {states.map(
            (state) => (

              <button
                type="button"
                className={`state-item ${selectedState === state.state ? "active" : ""}`}
                key={state.state}
                onClick={() => {
                  setSelectedState((current) => current === state.state ? "" : state.state);
                  setPage(1);
                }}
                aria-pressed={selectedState === state.state}
                aria-label={`Filter locations by state ${state.state}`}
              >


                {/* STATE NAME + LOCATION COUNT */}

                <div className="state-name">

                  <span>
                    {state.state}
                  </span>


                  <strong>

                    {formatNumber(
                      state.locations
                    )}

                  </strong>

                </div>


                {/* STATE BAR */}

                <div className="state-bar">

                  <div
                    style={{
                      width:
                        summary.total_locations > 0
                          ? `${Math.min(
                              (
                                Number(
                                  state.locations
                                ) /
                                Number(
                                  summary.total_locations
                                )
                              ) * 100,
                              100
                            )}%`
                          : "0%",
                    }}
                  />

                </div>


                {/* CITY COUNT */}

                <small>

                  {formatNumber(
                    state.cities
                  )}

                  {" "}cities

                </small>


              </button>

            )
          )}

        </div>

      </section>


      {/* =================================================
          GEOGRAPHIC LOCATIONS
      ================================================= */}

      <section className="geography-table-card">


        {/* TABLE HEADER */}

        <div className="geo-section-header">


          <div>

            <h2>
              Geographic Locations
            </h2>


            <p>
              Location data from MySQL.
            </p>

          </div>


          {/* SEARCH */}

          <div className="geography-filters" aria-label="Geography filters">
            <label>
              State
              <select aria-label="Filter by state" value={selectedState} onChange={handleStateChange}>
                <option value="">All states</option>
                {states.map((state) => (
                  <option key={state.state} value={state.state}>{state.state}</option>
                ))}
              </select>
            </label>
            <label>
              Sort by
              <select aria-label="Sort geographic locations" value={`${sortBy}:${sortDirection}`} onChange={handleSortChange}>
                <option value="state:asc">State A–Z</option>
                <option value="city:asc">City A–Z</option>
                <option value="city:desc">City Z–A</option>
                <option value="zip:asc">ZIP code low to high</option>
                <option value="zip:desc">ZIP code high to low</option>
              </select>
            </label>
            <label className="geography-search">
              <span>Search</span>
              <span className="geography-search-input">
                <Search size={18} />
                <input
                  type="text"
                  value={search}
                  onChange={handleSearch}
                  placeholder="Search city or ZIP..."
                />
              </span>
            </label>
            {(search || selectedState || sortBy !== "state" || sortDirection !== "asc") && (
              <button type="button" className="geography-clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>


        </div>


        {/* ERROR */}

        {error && (

          <div className="geo-error">

            {error}

          </div>

        )}


        {/* =================================================
            TABLE
        ================================================= */}

        <div className="geography-table-wrapper">

          <table className="geography-table">


            <thead>

              <tr>

                <th>
                  ZIP Code
                </th>

                <th>
                  City
                </th>

                <th>
                  State
                </th>

                <th>
                  Latitude
                </th>

                <th>
                  Longitude
                </th>

              </tr>

            </thead>


            <tbody>

              {locations.length > 0 ? (

                locations.map(
                  (location, index) => (

                    <tr
                      key={
                        `${location.zip_code}-${location.latitude}-${location.longitude}-${index}`
                      }
                    >


                      {/* ZIP */}

                      <td className="zip-code">

                        {location.zip_code}

                      </td>


                      {/* CITY */}

                      <td>

                        {location.city}

                      </td>


                      {/* STATE */}

                      <td>

                        <span className="state-badge">

                          {location.state}

                        </span>

                      </td>


                      {/* LATITUDE */}

                      <td>

                        {Number(
                          location.latitude || 0
                        ).toFixed(5)}

                      </td>


                      {/* LONGITUDE */}

                      <td>

                        {Number(
                          location.longitude || 0
                        ).toFixed(5)}

                      </td>


                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="geo-no-data"
                  >

                    {search.trim() || selectedState
                      ? `No geographic records found${selectedState ? ` in ${selectedState}` : ""}${search.trim() ? ` for "${search.trim()}"` : ""}.`
                      : "No geographic records found."
                    }

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="geo-pagination">


          {/* RESULT COUNT */}

          <span>

            Showing{" "}

            {locations.length
              ? (page - 1) * limit + 1
              : 0}

            {" "}–{" "}

            {Math.min(
              page * limit,
              total
            )}

            {" "}of{" "}

            {formatNumber(total)}

          </span>


          <div>


            {/* PREVIOUS */}

            <button
              disabled={
                page <= 1
              }
              onClick={() =>
                setPage(
                  (p) => p - 1
                )
              }
            >

              <ChevronLeft size={17} />

            </button>


            {/* PAGE NUMBER */}

            <span>

              Page {page} of{" "}

              {totalPages || 1}

            </span>


            {/* NEXT */}

            <button
              disabled={
                totalPages === 0 ||
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  (p) => p + 1
                )
              }
            >

              <ChevronRight size={17} />

            </button>


          </div>

        </div>

      </section>


    </div>

  );

}


export default Geography;