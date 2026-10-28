
import { useEffect, useState } from "react";

import {
  Users,
  Search,
  RefreshCw,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../components/PageHeader.jsx";
import SummaryStatCard from "../components/SummaryStatCard.jsx";
import "../styles/Customers.css";

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// AUTH HEADERS
// =========================================================

function getHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// =========================================================
// CUSTOMERS
// =========================================================

function Customers() {

  const navigate = useNavigate();

  // =======================================================
  // CUSTOMER DATA
  // =======================================================

  const [customers, setCustomers] = useState([]);

  const [totalCustomers, setTotalCustomers] =
    useState(0);

  const [page, setPage] = useState(1);

  const [limit] = useState(20);

  const [totalPages, setTotalPages] =
    useState(1);


  // =======================================================
  // SEARCH
  // =======================================================

  const [searchText, setSearchText] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");


  // =======================================================
  // UI
  // =======================================================

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =======================================================
  // LOAD CUSTOMERS FROM MYSQL
  // =======================================================

  const loadCustomers = async () => {

    try {

      setLoading(true);
      setError("");


      const params = new URLSearchParams();

      params.append(
        "page",
        page
      );

      params.append(
        "limit",
        limit
      );

      params.append(
        "search",
        searchQuery
      );


      const response = await fetch(
        `${API_URL}/customers?${params.toString()}`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data?.detail ||
          "Failed to load customers."
        );

      }


      // ===================================================
      // MYSQL DATA
      // ===================================================

      setCustomers(
        Array.isArray(data?.customers)
          ? data.customers
          : []
      );


      setTotalCustomers(
        Number(data?.total) || 0
      );


      setTotalPages(
        Number(data?.total_pages) || 1
      );


    } catch (err) {

      console.error(
        "Customer loading error:",
        err
      );

      setError(
        err?.message ||
        "Unable to load customers."
      );

      setCustomers([]);

    } finally {

      setLoading(false);

    }

  };


  // =======================================================
  // LOAD DATA
  // =======================================================

  useEffect(() => {

    loadCustomers();

  }, [
    page,
    searchQuery,
  ]);


  // =======================================================
  // SEARCH
  // =======================================================

  const handleSearch = () => {

    setPage(1);

    setSearchQuery(
      searchText.trim()
    );

  };


  // =======================================================
  // SEARCH ENTER
  // =======================================================

  const handleSearchKeyDown = (event) => {

    if (
      event.key === "Enter"
    ) {

      handleSearch();

    }

  };


  // =======================================================
  // CLEAR SEARCH
  // =======================================================

  const handleClearSearch = () => {

    setSearchText("");

    setSearchQuery("");

    setPage(1);

  };


  // =======================================================
  // PREVIOUS
  // =======================================================

  const handlePrevious = () => {

    if (page > 1) {

      setPage(
        page - 1
      );

    }

  };


  // =======================================================
  // NEXT
  // =======================================================

  const handleNext = () => {

    if (
      page < totalPages
    ) {

      setPage(
        page + 1
      );

    }

  };


  // =======================================================
  // REFRESH
  // =======================================================

  const handleRefresh = () => {

    loadCustomers();

  };

  // =======================================================
  // PAGINATION RANGE
  // =======================================================

  const startRecord =
    totalCustomers === 0
      ? 0
      : (page - 1) * limit + 1;


  const endRecord =
    Math.min(
      page * limit,
      totalCustomers
    );


  // =======================================================
  // PAGE
  // =======================================================

  return (

    <div className="customers-page">


      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <PageHeader
        title="Customers"
        description="Manage and view your customer profiles."
        icon={<Users size={22} />}
        className="customers-header"
        titleClassName="customers-title"
        iconClassName="customers-title-icon"
        actionsClassName="customers-header-actions"
        actions={
          <>
          <button
            className="customers-refresh-button"
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
          <button
            className="customers-activity-button"
            onClick={() => navigate("/consumer-profiles")}
            type="button"
          >
            <MessageSquareText size={17} />
            Activity & feedback
          </button>
          </>
        }
      />


      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="customers-summary-grid">


        <SummaryStatCard
          className="customers-summary-card"
          label="Total Customers"
          value={totalCustomers.toLocaleString("en-US")}
        />

        <SummaryStatCard
          className="customers-summary-card"
          label="Current Page"
          value={page}
        />

        <SummaryStatCard
          className="customers-summary-card"
          label="Showing"
          value={customers.length}
        />


      </div>


      {/* =================================================
          SEARCH
      ================================================= */}

      <div className="customers-search-card">


        <div className="customer-search">


          <Search size={19} />


          <input
            type="text"
            placeholder="Search customer ID or city..."
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            onKeyDown={
              handleSearchKeyDown
            }
          />


          {searchText && (

            <button
              className="clear-search"
              onClick={
                handleClearSearch
              }
            >
              ×
            </button>

          )}


          <button
            className="customer-search-button"
            onClick={
              handleSearch
            }
          >

            Search

          </button>


        </div>


      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="customers-error">

          <span>
            {error}
          </span>


          <button
            onClick={
              loadCustomers
            }
          >

            Try Again

          </button>

        </div>

      )}

      {/* =================================================
          CUSTOMER TABLE
      ================================================= */}

      {loading ? (

        <div className="customers-loading" role="status">
          <RefreshCw size={22} className="loading-icon" />
          <p>Loading customers...</p>
        </div>

      ) : customers.length === 0 ? (

        <div className="customers-empty">

          <Users size={38} />

          <h2>
            No customers found
          </h2>

          <p>
            {searchQuery
              ? "No customers match your search."
              : "There are no customer records available."
            }
          </p>

        </div>

      ) : (

        <div className="customers-card">


          <div className="customers-table-wrapper">


            <table className="customers-table">


              <thead>

                <tr>

                  <th>
                    Customer ID
                  </th>

                  <th>
                    Customer Unique ID
                  </th>

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
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {customers.map(
                  (customer) => (

                    <tr
                      key={
                        customer.customer_id
                      }
                    >


                      {/* CUSTOMER ID */}

                      <td>

                        <strong
                          className="customer-id-text"
                        >

                          {
                            customer.customer_id
                          }

                        </strong>

                      </td>


                      {/* UNIQUE ID */}

                      <td>

                        <span
                          className="customer-unique-id-text"
                        >

                          {
                            customer.customer_unique_id
                          }

                        </span>
                        {customer.is_app_created_customer && <span className="customer-new-badge">New</span>}

                      </td>

                      {/* ZIP */}

                      <td>

                        {
                          customer.customer_zip_code_prefix
                        }

                      </td>


                      {/* CITY */}

                      <td>

                        {
                          customer.customer_city
                        }

                      </td>


                      {/* STATE */}

                      <td>

                        <span
                          className="customer-state-text"
                        >

                          {
                            customer.customer_state
                          }

                        </span>

                      </td>

                      <td>
                        <button
                          type="button"
                          className="customer-open-button"
                          disabled={!customer.customer_unique_id}
                          onClick={() =>
                            navigate(
                              `/customer-details/${encodeURIComponent(
                                customer.customer_unique_id
                              )}`
                            )
                          }
                        >
                          View profile
                        </button>
                      </td>


                    </tr>

                  )
                )}

              </tbody>


            </table>


          </div>


          {/* =================================================
              PAGINATION FOOTER
          ================================================= */}

          <div className="customers-pagination">


            {/* LEFT */}

            <div className="pagination-info">

              Showing{" "}

              {startRecord}
              {"–"}
              {endRecord}

              {" "}of{" "}

              {totalCustomers.toLocaleString(
                "en-US"
              )}

            </div>


            {/* RIGHT */}

            <div className="pagination-controls">


              {/* PREVIOUS */}

              <button
                className="pagination-button"
                onClick={
                  handlePrevious
                }
                disabled={
                  page === 1
                }
              >

                <ChevronLeft
                  size={19}
                />

              </button>


              {/* PAGE */}

              <span className="pagination-page">

                Page{" "}

                <strong>
                  {page}
                </strong>

                {" "}of{" "}

                <strong>
                  {totalPages}
                </strong>

              </span>


              {/* NEXT */}

              <button
                className="pagination-button"
                onClick={
                  handleNext
                }
                disabled={
                  page === totalPages
                }
              >

                <ChevronRight
                  size={19}
                />

              </button>


            </div>


          </div>


        </div>

      )}


    </div>

  );

}


export default Customers;