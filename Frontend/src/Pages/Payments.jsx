import React, {
  useEffect,
  useState,
} from "react";

import {
  CreditCard,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Wallet,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import {
  getPayments,
  getPaymentSummary,
  getPaymentMethods,
} from "../services/paymentsApi";

import "../styles/Payments.css";


function Payments() {

  // =====================================================
  // STATE
  // =====================================================

  const [payments, setPayments] =
    useState([]);

  const [summary, setSummary] =
    useState({
      total_payments: 0,
      total_value: 0,
      average_payment: 0,
    });

  const [methods, setMethods] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [limit] =
    useState(20);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  // =====================================================
  // LOAD PAYMENTS
  // =====================================================

  const loadPayments = async () => {

    try {

      setLoading(true);

      setError("");


      const data = await getPayments({
        search,
        page,
        limit,
      });


      setPayments(
        data.data || []
      );

      setTotal(
        data.total || 0
      );

      setTotalPages(
        data.total_pages || 0
      );


    } catch (err) {

      console.error(
        "Payments error:",
        err
      );

      setError(
        err.message ||
        "Failed to load payments"
      );

    } finally {

      setLoading(false);

    }
  };


  // =====================================================
  // LOAD SUMMARY
  // =====================================================

  const loadSummary = async () => {

    try {

      const data =
        await getPaymentSummary();

      setSummary(data);

    } catch (err) {

      console.error(
        "Payment summary error:",
        err
      );

    }
  };


  // =====================================================
  // LOAD METHODS
  // =====================================================

  const loadMethods = async () => {

    try {

      const data =
        await getPaymentMethods();

      setMethods(
        data || []
      );

    } catch (err) {

      console.error(
        "Payment methods error:",
        err
      );

    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {

    loadSummary();

    loadMethods();

  }, []);


  // =====================================================
  // LOAD WHEN SEARCH/PAGE CHANGES
  // =====================================================

  useEffect(() => {

    loadPayments();

  }, [search, page]);


  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = (event) => {

    setSearch(
      event.target.value
    );

    setPage(1);

  };


  // =====================================================
  // FORMAT NUMBER
  // =====================================================

  const formatNumber = (value) => {

    return Number(value || 0)
      .toLocaleString("en-US");

  };


  // =====================================================
  // FORMAT CURRENCY
  // =====================================================

  const formatCurrency = (value) => {

    return Number(value || 0)
      .toLocaleString(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
        }
      );

  };


  // =====================================================
  // FORMAT PAYMENT TYPE
  // =====================================================

  const formatPaymentType = (value) => {

    if (!value) {
      return "Unknown";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );

  };


  // =====================================================
  // BACK TO DASHBOARD
  // =====================================================

  const goBack = () => {

    window.location.href =
      "/dashboard";

  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading && payments.length === 0) {

    return (

      <div className="payments-loading">

        <div className="payments-spinner"></div>

        <p>
          Loading payments...
        </p>

      </div>

    );

  }


  // =====================================================
  // ERROR
  // =====================================================

  if (
    error &&
    payments.length === 0
  ) {

    return (

      <div className="payments-error">

        <div className="payments-error-card">

          <h2>
            Unable to load payments
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={loadPayments}
          >
            Try Again
          </button>

        </div>

      </div>

    );

  }


  // =====================================================
  // PAGE
  // =====================================================

  return (

    <div className="payments-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="payments-header">

        <div className="payments-header-left">

          <button
            className="payments-back-button"
            onClick={goBack}
          >
            <ArrowLeft size={20} />
          </button>


          <div>

            <h1>
              Payments
            </h1>

            <p>
              Monitor payment activity
              and transaction performance.
            </p>

          </div>

        </div>


        <div className="payments-count">

          {formatNumber(total)} payments

        </div>

      </header>


      {/* =================================================
          SUMMARY CARDS
      ================================================= */}

      <section className="payment-summary-grid">

        {/* TOTAL PAYMENTS */}

        <div className="payment-summary-card">

          <div className="payment-summary-top">

            <div className="payment-summary-icon purple">

              <CreditCard size={24} />

            </div>

          </div>


          <span>
            Total Payments
          </span>


          <strong>
            {formatNumber(
              summary.total_payments
            )}
          </strong>


          <small>
            Total transactions
          </small>

        </div>


        {/* TOTAL VALUE */}

        <div className="payment-summary-card">

          <div className="payment-summary-top">

            <div className="payment-summary-icon green">

              <DollarSign size={24} />

            </div>

          </div>


          <span>
            Total Payment Value
          </span>


          <strong>
            {formatCurrency(
              summary.total_value
            )}
          </strong>


          <small>
            Total processed value
          </small>

        </div>


        {/* AVERAGE */}

        <div className="payment-summary-card">

          <div className="payment-summary-top">

            <div className="payment-summary-icon orange">

              <TrendingUp size={24} />

            </div>

          </div>


          <span>
            Average Payment
          </span>


          <strong>
            {formatCurrency(
              summary.average_payment
            )}
          </strong>


          <small>
            Average transaction value
          </small>

        </div>

      </section>


      {/* =================================================
          PAYMENT METHODS
      ================================================= */}

      <section className="payment-methods-card">

        <div className="payment-section-header">

          <div>

            <h2>
              Payment Methods
            </h2>

            <p>
              Distribution of payment
              methods used by customers.
            </p>

          </div>

        </div>


        <div className="payment-method-grid">

          {methods.map(
            (method, index) => {

              const percentage =
                summary.total_payments > 0
                  ? (
                      Number(method.total || 0) /
                      Number(
                        summary.total_payments
                      )
                    ) * 100
                  : 0;


              return (

                <div
                  className="payment-method-item"
                  key={
                    method.method ||
                    index
                  }
                >

                  <div className="payment-method-icon">

                    <Wallet size={20} />

                  </div>


                  <div className="payment-method-info">

                    <strong>
                      {formatPaymentType(
                        method.method
                      )}
                    </strong>

                    <span>
                      {formatNumber(
                        method.total
                      )} transactions
                    </span>

                  </div>


                  <div className="payment-method-value">

                    <strong>
                      {percentage.toFixed(1)}%
                    </strong>

                    <span>
                      {formatCurrency(
                        method.value
                      )}
                    </span>

                  </div>

                </div>

              );

            }
          )}

        </div>

      </section>


      {/* =================================================
          PAYMENTS TABLE
      ================================================= */}

      <section className="payments-table-card">

        <div className="payment-section-header">

          <div>

            <h2>
              Payment Transactions
            </h2>

            <p>
              Payment records from MySQL.
            </p>

          </div>


          {/* SEARCH */}

          <div className="payments-search">

            <Search size={19} />

            <input
              type="text"
              placeholder="Search order ID or payment type..."
              value={search}
              onChange={handleSearch}
            />

          </div>

        </div>


        {/* TABLE */}

        <div className="payments-table-wrapper">

          <table className="payments-table">

            <thead>

              <tr>

                <th>
                  Order ID
                </th>

                <th>
                  Payment #
                </th>

                <th>
                  Payment Type
                </th>

                <th>
                  Installments
                </th>

                <th>
                  Payment Value
                </th>

              </tr>

            </thead>


            <tbody>

              {payments.length > 0 ? (

                payments.map(
                  (payment, index) => (

                    <tr
                      key={`${payment.order_id}-${payment.payment_sequential}-${index}`}
                    >

                      <td className="payment-order-id">

                        {payment.order_id}

                      </td>


                      <td>

                        {payment.payment_sequential}

                      </td>


                      <td>

                        <span className="payment-type-badge">

                          {formatPaymentType(
                            payment.payment_type
                          )}

                        </span>

                      </td>


                      <td>

                        {payment.payment_installments}

                      </td>


                      <td className="payment-value">

                        {formatCurrency(
                          payment.payment_value
                        )}

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="no-payments"
                  >

                    No payment records found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* =================================================
            PAGINATION
        ================================================= */}

        <div className="payments-pagination">

          <span>

            Showing{" "}

            {payments.length > 0
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


          <div className="pagination-buttons">

            <button
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (previous) =>
                    previous - 1
                )
              }
            >

              <ChevronLeft size={18} />

            </button>


            <span className="page-number">

              Page {page} of{" "}
              {totalPages || 1}

            </span>


            <button
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  (previous) =>
                    previous + 1
                )
              }
            >

              <ChevronRight size={18} />

            </button>

          </div>

        </div>

      </section>

    </div>

  );

}


export default Payments;