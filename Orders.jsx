import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  RotateCcw,
  Ban,
} from "lucide-react";

import {
  getOrders,
  getOrderStatuses,
  getOrder,
  cancelOrder,
  markOrderDelivered,
  reorder,
  submitOrderFeedback,
} from "../services/ordersApi";
import { getCustomerProfile } from "../services/authApi";

import "../styles/Orders.css";

function Orders() {
  const isAdmin = (localStorage.getItem("role") || "").toLowerCase() === "admin";
  const isManager = (localStorage.getItem("role") || "").toLowerCase() === "manager";
  const isCustomer = ["customer", "viewer", "staff", "user"].includes(
    (localStorage.getItem("role") || "").toLowerCase()
  );
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("new:desc");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [orderActionBusy, setOrderActionBusy] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const feedbackSubmissionLock = useRef(false);
  const [orderActionError, setOrderActionError] = useState("");
  const [orderActionMessage, setOrderActionMessage] = useState("");
  const [confirmationAction, setConfirmationAction] = useState("");
  const [reorderPaymentType, setReorderPaymentType] = useState("credit_card");
  const [customerProfile, setCustomerProfile] = useState(null);
  const [customerProfileError, setCustomerProfileError] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("5");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatStatus = (value) => {
    if (!value) return "Unknown";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const getStatusClass = (value) => {
    if (!value) return "status-default";

    const normalized = value.toLowerCase();

    if (normalized === "delivered") {
      return "status-delivered";
    }

    if (
      normalized.includes("cancel") ||
      normalized.includes("unavailable")
    ) {
      return "status-canceled";
    }

    if (
      normalized.includes("shipped") ||
      normalized.includes("approved")
    ) {
      return "status-shipped";
    }

    if (
      normalized.includes("processing") ||
      normalized.includes("invoiced")
    ) {
      return "status-processing";
    }

    return "status-default";
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders({
        search: searchQuery,
        status,
        sortBy: sort.split(":")[0],
        sortDirection: sort.split(":")[1],
        page,
        limit,
      });

      setOrders(data?.data || []);
      setTotal(Number(data?.total || 0));
      setTotalPages(Number(data?.total_pages || 0));
    } catch (err) {
      console.error("Orders loading error:", err);
      setError(
        err?.message ||
          "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [searchQuery, status, sort, page, limit]);

  const loadStatuses = useCallback(async () => {
    try {
      const data = await getOrderStatuses();
      setStatuses(data || []);
    } catch (err) {
      console.error(
        "Order statuses error:",
        err
      );
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadOrders, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  useEffect(() => {
    const timer = window.setTimeout(loadStatuses, 0);
    return () => window.clearTimeout(timer);
  }, [loadStatuses]);

  useEffect(() => {
    if (!isCustomer) return undefined;
    let active = true;
    getCustomerProfile()
      .then((profile) => {
        if (active) setCustomerProfile(profile);
      })
      .catch((profileError) => {
        if (active) {
          setCustomerProfileError(
            profileError.message || "Unable to load your customer profile."
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isCustomer]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(search.trim());
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleViewOrder = async (orderId) => {
    try {
      setOrderActionError("");
      setOrderActionMessage("");
      setDetailsLoading(true);

      const data = await getOrder(orderId);

      setSelectedOrder(data);
    } catch (err) {
      console.error(
        "Order details error:",
        err
      );

      alert(
        err?.message ||
          "Unable to load order details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    const order = selectedOrder?.order;
    if (!order?.order_id || !order.can_cancel) return;
    setOrderActionBusy(true);
    setOrderActionError("");
    setOrderActionMessage("");
    try {
      await cancelOrder(order.order_id);
      await Promise.all([loadOrders(), loadStatuses()]);
      await handleViewOrder(order.order_id);
      setOrderActionMessage("Order canceled. Handle any refund outside this application.");
    } catch (actionError) {
      setOrderActionError(actionError.message || "Unable to cancel this order.");
    } finally {
      setOrderActionBusy(false);
    }
  };

  const handleMarkDelivered = async () => {
    const order = selectedOrder?.order;
    if (!order?.order_id || !order.can_mark_delivered) return;
    setOrderActionBusy(true);
    setOrderActionError("");
    setOrderActionMessage("");
    try {
      await markOrderDelivered(order.order_id);
      await Promise.all([loadOrders(), loadStatuses()]);
      await handleViewOrder(order.order_id);
      setOrderActionMessage("Delivery confirmed. You can now leave feedback for this order.");
    } catch (actionError) {
      setOrderActionError(actionError.message || "Unable to confirm delivery.");
    } finally {
      setOrderActionBusy(false);
    }
  };

  const handleSubmitFeedback = async (event) => {
    event.preventDefault();
    const order = selectedOrder?.order;
    if (
      feedbackSubmissionLock.current ||
      !customerProfile?.profile_id ||
      !order?.can_leave_feedback
    ) return;
    feedbackSubmissionLock.current = true;
    setFeedbackSubmitting(true);
    setOrderActionError("");
    setOrderActionMessage("");
    try {
      const feedback = await submitOrderFeedback(customerProfile.profile_id, {
        order_id: order.order_id,
        rating: Number(feedbackRating),
        message: feedbackMessage.trim() || null,
      });
      setFeedbackMessage("");
      setSelectedOrder((current) => {
        if (current?.order?.order_id !== order.order_id) return current;
        return {
          ...current,
          order: {
            ...current.order,
            feedback_submitted: true,
            can_leave_feedback: false,
          },
        };
      });
      setOrderActionMessage(
        feedback.prediction_refresh_status === "queued"
          ? "Thank you. Your feedback was saved and the churn prediction is refreshing."
          : "Thank you. Your feedback has been saved."
      );
    } catch (feedbackError) {
      setOrderActionError(feedbackError.message || "Unable to submit feedback.");
    } finally {
      feedbackSubmissionLock.current = false;
      setFeedbackSubmitting(false);
    }
  };

  const handleReorder = async () => {
    const order = selectedOrder?.order;
    if (!order?.order_id || !order.can_reorder) return;
    setOrderActionBusy(true);
    setOrderActionError("");
    setOrderActionMessage("");
    try {
      const result = await reorder(order.order_id, reorderPaymentType);
      await Promise.all([loadOrders(), loadStatuses()]);
      await handleViewOrder(result.new_order_id);
      setOrderActionMessage(
        `Unpaid reorder created: ${result.new_order_id}. Collect payment before fulfillment.`
      );
    } catch (actionError) {
      setOrderActionError(actionError.message || "Unable to create a reorder.");
    } finally {
      setOrderActionBusy(false);
    }
  };

  const confirmOrderAction = async () => {
    const action = confirmationAction;
    setConfirmationAction("");
    if (action === "cancel") {
      await handleCancelOrder();
    } else if (action === "reorder") {
      await handleReorder();
    }
  };

  const firstRecord =
    total === 0
      ? 0
      : (page - 1) * limit + 1;

  const lastRecord = Math.min(
    page * limit,
    total
  );

  return (
    <div className="orders-page">

      {/* HEADER */}

      <div className="orders-page-header">

        <div>
          <div className="orders-title-row">

            <div className="orders-title-icon">
              <ShoppingBag size={24} />
            </div>

            <div>
              <h1>Orders</h1>

              <p>
                {isCustomer
                  ? "View your orders and delivery updates."
                  : "Manage and monitor customer orders."}
              </p>
            </div>

          </div>
        </div>

        <div className="orders-header-actions">
          <button
            className="orders-refresh-button"
            onClick={loadOrders}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "refresh-spinning"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

      </div>

      {isCustomer && (
        <section className="orders-customer-profile" aria-label="Your customer profile">
          <div>
            <span>Your profile</span>
            <strong>{customerProfile?.name || "Loading profile..."}</strong>
          </div>
          {customerProfileError ? (
            <p role="alert">{customerProfileError}</p>
          ) : customerProfile ? (
            <>
              <div><span>Email</span><strong>{customerProfile.email}</strong></div>
              <div><span>Phone</span><strong>{customerProfile.phone || "Not provided"}</strong></div>
              <div><span>Location</span><strong>{[customerProfile.city, customerProfile.state].filter(Boolean).join(", ") || "Not provided"}</strong></div>
            </>
          ) : null}
        </section>
      )}


      {/* SUMMARY */}

      <div className="orders-summary">

        <div className="orders-summary-card">

          <span>Total Orders</span>

          <strong>
            {total.toLocaleString()}
          </strong>

        </div>

        <div className="orders-summary-card">

          <span>Current Page</span>

          <strong>
            {page}
          </strong>

        </div>

        <div className="orders-summary-card">

          <span>Showing</span>

          <strong>
            {orders.length}
          </strong>

        </div>

      </div>


      {/* FILTERS */}

      <div className="orders-filter-card">

        <form
          className="orders-search"
          onSubmit={handleSearch}
        >

          <Search size={19} />

          <input
            type="text"
            placeholder="Search order ID or customer ID..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <button type="submit">
            Search
          </button>

        </form>


        <select
          className="orders-status-filter"
          value={status}
          onChange={handleStatusChange}
        >

          <option value="">
            All statuses
          </option>

          {statuses.map((item) => (
            <option
              key={item.status}
              value={item.status}
            >
              {formatStatus(
                item.status
              )}
            </option>
          ))}

        </select>

        {!isCustomer && <select
          className="orders-status-filter"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          aria-label="Sort orders"
        >
          <option value="new:desc">New customer orders first</option>
          <option value="date:desc">Newest first</option>
          <option value="date:asc">Oldest first</option>
          <option value="status:asc">Status A–Z</option>
          <option value="amount:desc">Highest amount</option>
          <option value="amount:asc">Lowest amount</option>
          <option value="customer:asc">Customer A–Z</option>
        </select>}

      </div>


      {/* ERROR */}

      {error && (
        <div className="orders-error">
          {error}

          <button
            onClick={loadOrders}
          >
            Try Again
          </button>
        </div>
      )}


      {/* TABLE */}

      <div className="orders-table-card">

        {loading ? (

          <div className="orders-loading">
            <div className="orders-spinner"></div>

            <p>
              Loading orders...
            </p>
          </div>

        ) : orders.length === 0 ? (

          <div className="orders-empty">
            <ShoppingBag size={42} />

            <h3>
              No orders found
            </h3>

            <p>
              Try changing your search
              or filter.
            </p>
          </div>

        ) : (

          <>

            <div className="orders-table-wrapper">

              <table className="orders-table">

                <thead>

                  <tr>

                    <th>Order ID</th>

                    <th>Customer ID</th>

                    <th>Date</th>

                    <th>Status</th>

                    <th>Items</th>

                    <th>Amount</th>

                    <th>Payment</th>

                    <th>Action</th>

                  </tr>

                </thead>

                <tbody>

                  {orders.map((order) => (

                    <tr
                      key={order.order_id}
                    >

                      <td>

                        <span className="order-id">
                          {order.order_id}
                        </span>
                        {order.is_app_created_customer && (
                          <span className="new-customer-order-badge">New</span>
                        )}

                      </td>

                      <td>

                        <span className="customer-id">
                          {order.customer_id}
                        </span>

                      </td>

                      <td>
                        {formatDate(
                          order.order_purchase_timestamp
                        )}
                      </td>

                      <td>

                        <span
                          className={`order-status ${getStatusClass(
                            order.order_status
                          )}`}
                        >
                          {formatStatus(
                            order.order_status
                          )}
                        </span>

                      </td>

                      <td>
                        {order.item_count || 0}
                      </td>

                      <td>

                        <strong>
                          {formatCurrency(
                            order.order_amount
                          )}
                        </strong>

                      </td>

                      <td>

                        {order.payment_method ||
                          "—"}

                      </td>

                      <td>

                        <button
                          className="order-view-button"
                          onClick={() =>
                            handleViewOrder(
                              order.order_id
                            )
                          }
                        >

                          <Eye size={16} />

                          View

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>


            {/* PAGINATION */}

            <div className="orders-pagination">

              <span>
                Showing {firstRecord}–{lastRecord}
                {" "}of{" "}
                {total.toLocaleString()}
              </span>


              <div className="pagination-controls">

                <button
                  disabled={page <= 1}
                  onClick={() =>
                    setPage(
                      (current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                    )
                  }
                >
                  <ChevronLeft size={17} />
                </button>

                <span>
                  Page {page}
                  {totalPages
                    ? ` of ${totalPages}`
                    : ""}
                </span>

                <button
                  disabled={
                    totalPages > 0 &&
                    page >= totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                >
                  <ChevronRight size={17} />
                </button>

              </div>

            </div>

          </>

        )}

        {confirmationAction && (
          <div
            className="order-confirm-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !orderActionBusy) {
                setConfirmationAction("");
              }
            }}
          >
            <section
              className="order-confirm-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="order-confirm-title"
              aria-describedby="order-confirm-description"
            >
              <h2 id="order-confirm-title">
                {confirmationAction === "cancel" ? "Cancel this order?" : "Reorder these items?"}
              </h2>
              <p id="order-confirm-description">
                {confirmationAction === "cancel"
                  ? "Any refund must be handled separately."
                  : "A new unpaid order will be created with the same items."}
              </p>
              {confirmationAction === "reorder" && (
                <label className="order-confirm-payment">
                  Payment method
                  <select
                    value={reorderPaymentType}
                    onChange={(event) => setReorderPaymentType(event.target.value)}
                    disabled={orderActionBusy}
                  >
                    <option value="credit_card">Credit card</option>
                    <option value="debit_card">Debit card</option>
                    <option value="boleto">Boleto</option>
                    <option value="voucher">Voucher</option>
                  </select>
                  <span>The order will remain unpaid until payment is collected.</span>
                </label>
              )}
              <div className="order-confirm-actions">
                <button
                  type="button"
                  className="order-confirm-dismiss"
                  onClick={() => setConfirmationAction("")}
                  disabled={orderActionBusy}
                >
                  Go back
                </button>
                <button
                  type="button"
                  className={confirmationAction === "cancel" ? "order-confirm-danger" : "order-confirm-primary"}
                  onClick={confirmOrderAction}
                  disabled={orderActionBusy}
                >
                  {orderActionBusy
                    ? "Working..."
                    : confirmationAction === "cancel"
                      ? "Cancel order"
                      : "Create reorder"}
                </button>
              </div>
            </section>
          </div>
        )}

      </div>


      {/* ORDER DETAILS MODAL */}

      {(selectedOrder ||
        detailsLoading) && (

        <div
          className="orders-modal-overlay"
          onClick={() =>
            !detailsLoading &&
            setSelectedOrder(null)
          }
        >

          <div
            className="orders-details-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              className="orders-modal-close"
              onClick={() =>
                setSelectedOrder(null)
              }
              disabled={detailsLoading}
            >
              <X size={20} />
            </button>


            {detailsLoading ? (

              <div className="orders-modal-loading">

                <div className="orders-spinner"></div>

                <p>
                  Loading order details...
                </p>

              </div>

            ) : selectedOrder ? (

              <>

                <div className="orders-modal-header">

                  <div>
                    <h2>
                      Order Details
                    </h2>

                    <p>
                      {selectedOrder.order
                        ?.order_id}
                    </p>
                  </div>

                  <span
                    className={`order-status ${getStatusClass(
                      selectedOrder.order
                        ?.order_status
                    )}`}
                  >
                    {formatStatus(
                      selectedOrder.order
                        ?.order_status
                    )}
                  </span>

                </div>


                {/* BASIC INFO */}

                <div className="order-detail-grid">

                  <div>
                    <span>
                      Customer ID
                    </span>

                    <strong>
                      {
                        selectedOrder.order
                          ?.customer_id
                      }
                    </strong>
                  </div>


                  <div>
                    <span>
                      Purchase Date
                    </span>

                    <strong>
                      {formatDate(
                        selectedOrder.order
                          ?.order_purchase_timestamp
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Approved
                    </span>

                    <strong>
                      {formatDate(
                        selectedOrder.order
                          ?.order_approved_at
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Delivered
                    </span>

                    <strong>
                      {formatDate(
                        selectedOrder.order
                          ?.order_delivered_customer_date
                      )}
                    </strong>
                  </div>

                </div>


                {/* ITEMS */}

                <div className="order-detail-section">

                  <h3>
                    Order Items
                  </h3>

                  {(
                    selectedOrder.items ||
                    []
                  ).length === 0 ? (

                    <p className="no-details">
                      No item information
                      available.
                    </p>

                  ) : (

                    <div className="details-list">

                      {selectedOrder.items.map(
                        (item) => (

                          <div
                            className="details-list-row"
                            key={
                              `${item.product_id}-${item.order_item_id}`
                            }
                          >

                            <div>
                              <span>
                                Product
                              </span>

                              <strong>
                                {item.product_id}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Price
                              </span>

                              <strong>
                                {formatCurrency(
                                  item.price
                                )}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Freight
                              </span>

                              <strong>
                                {formatCurrency(
                                  item.freight_value
                                )}
                              </strong>
                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>


                {/* PAYMENTS */}

                <div className="order-detail-section">

                  <h3>
                    Payments
                  </h3>

                  {selectedOrder.order?.payment_method_preference && (
                    <div className="order-payment-preference">
                      <div>
                        <span>Selected method</span>
                        <strong>
                          {selectedOrder.order.payment_method_preference
                            .replaceAll("_", " ")
                            .replace(/\b\w/g, (letter) => letter.toUpperCase())}
                        </strong>
                      </div>
                      <span>Payment pending</span>
                    </div>
                  )}

                  {(
                    selectedOrder.payments ||
                    []
                  ).length === 0 ? (

                    !selectedOrder.order?.payment_method_preference && (
                    <p className="no-details">
                      No payment information
                      available.
                    </p>
                    )

                  ) : (

                    <div className="details-list">

                      {selectedOrder.payments.map(
                        (payment) => (

                          <div
                            className="details-list-row"
                            key={
                              `${payment.payment_sequential}-${payment.payment_type}`
                            }
                          >

                            <div>
                              <span>
                                Method
                              </span>

                              <strong>
                                {payment.payment_type}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Installments
                              </span>

                              <strong>
                                {
                                  payment.payment_installments
                                }
                              </strong>
                            </div>

                            <div>
                              <span>
                                Amount
                              </span>

                              <strong>
                                {formatCurrency(
                                  payment.payment_value
                                )}
                              </strong>
                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

                {orderActionError && <div className="order-action-error" role="alert">{orderActionError}</div>}
                {orderActionMessage && <div className="order-action-message" role="status">{orderActionMessage}</div>}
                {(isAdmin || isCustomer || isManager) && (
                  <div className="order-actions">
                    <div className="order-actions-buttons">
                      {(isManager || isCustomer) && selectedOrder.order?.can_reorder && (
                        <button
                          type="button"
                          className="order-reorder-button"
                          onClick={() => setConfirmationAction("reorder")}
                          disabled={orderActionBusy}
                        >
                          <RotateCcw size={16} />
                          {orderActionBusy ? "Working..." : "Reorder items"}
                        </button>
                      )}
                      {(isAdmin || isCustomer) && selectedOrder.order?.can_cancel && (
                        <button
                          type="button"
                          className="order-cancel-button"
                          onClick={() => setConfirmationAction("cancel")}
                          disabled={orderActionBusy}
                        >
                          <Ban size={16} />
                          {orderActionBusy ? "Working..." : "Cancel order"}
                        </button>
                      )}
                      {isCustomer &&
                        selectedOrder.order?.can_mark_delivered && (
                        <button
                          type="button"
                          className="order-reorder-button"
                          onClick={handleMarkDelivered}
                          disabled={orderActionBusy || !selectedOrder.order?.can_mark_delivered}
                          title="Confirm delivery after you have received the order"
                        >
                          {orderActionBusy
                            ? "Updating..."
                            : "Confirm delivery"}
                        </button>
                      )}
                    </div>
                    <p className="order-actions-note">
                      {isCustomer
                        ? "Use Confirm delivery after receiving your order. The feedback form appears here once delivery is confirmed."
                        : "Reorders are unpaid until payment is collected. Cancellation does not issue a refund."}
                    </p>
                  </div>
                )}
                {isAdmin && !selectedOrder.order?.is_app_created_customer && (
                  <p className="order-actions-note">
                    Reorder and cancellation are available only for customers added through this application.
                  </p>
                )}


                {isCustomer && selectedOrder.order?.order_status?.toLowerCase() === "delivered" && (
                  <section className="order-detail-section customer-order-feedback">
                    <h3>Order feedback</h3>
                    {selectedOrder.order?.feedback_submitted ? (
                      <p className="no-details">Feedback has already been submitted for this order.</p>
                    ) : selectedOrder.order?.can_leave_feedback ? (
                      <form onSubmit={handleSubmitFeedback}>
                        <label>
                          Rating
                          <select
                            value={feedbackRating}
                            onChange={(event) => setFeedbackRating(event.target.value)}
                          >
                            <option value="5">5 - Very satisfied</option>
                            <option value="4">4 - Satisfied</option>
                            <option value="3">3 - Neutral</option>
                            <option value="2">2 - Dissatisfied</option>
                            <option value="1">1 - Very dissatisfied</option>
                          </select>
                        </label>
                        <label>
                          Comment (optional)
                          <textarea
                            value={feedbackMessage}
                            onChange={(event) => setFeedbackMessage(event.target.value)}
                            maxLength={2000}
                            rows={3}
                            placeholder="Share your experience with this order"
                          />
                        </label>
                        <button type="submit" disabled={feedbackSubmitting}>
                          {feedbackSubmitting ? "Submitting..." : "Submit feedback"}
                        </button>
                      </form>
                    ) : null}
                  </section>
                )}

                {!isCustomer && (
                <div className="order-detail-section">

                  <h3>
                    Reviews
                  </h3>

                  {(
                    selectedOrder.reviews ||
                    []
                  ).length === 0 ? (

                    <p className="no-details">
                      No review information
                      available.
                    </p>

                  ) : (

                    <div className="details-list">

                      {selectedOrder.reviews.map(
                        (review) => (

                          <div
                            className="review-detail-row"
                            key={
                              review.review_id
                            }
                          >

                            <div>

                              <strong>
                                {"★".repeat(
                                  Number(
                                    review.review_score ||
                                      0
                                  )
                                )}
                              </strong>

                              <span>
                                {review.review_comment_title ||
                                  "Customer Review"}
                              </span>

                            </div>

                            <p>
                              {review.review_comment_message ||
                                "No review comment."}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  )}

                </div>

                )}

              </>

            ) : null}

          </div>

        </div>

      )}

    </div>
  );
}

export default Orders;