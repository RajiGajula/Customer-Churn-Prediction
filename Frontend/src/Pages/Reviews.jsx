import React, {
  useEffect,
  useState,
} from "react";

import {
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";

import {
  getReviews,
  getReviewSummary,
} from "../services/reviewsApi";

import "../styles/Reviews.css";


function Reviews() {

  const [reviews, setReviews] =
    useState([]);

  const [summary, setSummary] =
    useState({
      total_reviews: 0,
      average_score: 0,
      distribution: [],
    });

  const [search, setSearch] =
    useState("");

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
  // LOAD REVIEWS
  // =====================================================

  const loadReviews = async () => {

    try {

      setLoading(true);
      setError("");

      const data =
        await getReviews({
          search,
          page,
          limit,
        });

      setReviews(
        data.data || []
      );

      setTotal(
        data.total || 0
      );

      setTotalPages(
        data.total_pages || 0
      );

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Failed to load reviews"
      );

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {

    loadReviews();

  }, [search, page]);


  useEffect(() => {

    const loadSummary =
      async () => {

        try {

          const data =
            await getReviewSummary();

          setSummary(data);

        } catch (err) {

          console.error(err);

        }

      };


    loadSummary();

  }, []);


  const formatNumber = (value) =>
    Number(value || 0)
      .toLocaleString("en-US");


  const formatDate = (date) => {

    if (!date) return "—";

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

  };


  const handleSearch = (e) => {

    setSearch(
      e.target.value
    );

    setPage(1);

  };


  const renderStars = (score) => {

    const rating =
      Number(score || 0);

    return (
      <div className="review-table-stars">

        {[1, 2, 3, 4, 5].map(
          (star) => (

            <Star
              key={star}
              size={14}
              fill={
                star <= rating
                  ? "#f59e0b"
                  : "none"
              }
              color={
                star <= rating
                  ? "#f59e0b"
                  : "#d8d5e5"
              }
            />

          )
        )}

      </div>
    );

  };


  if (
    loading &&
    reviews.length === 0
  ) {

    return (

      <div className="reviews-loading">

        <div className="reviews-spinner"></div>

        <p>
          Loading reviews...
        </p>

      </div>

    );

  }


  return (

    <div className="reviews-page">

      {/* HEADER */}

      <header className="reviews-header">

        <div>

          <div className="reviews-title">

            <Star size={28} />

            <h1>
              Customer Reviews
            </h1>

          </div>

          <p>
            Monitor customer feedback
            and satisfaction.
          </p>

        </div>


        <span className="reviews-count">

          {formatNumber(total)}
          {" "}reviews

        </span>

      </header>


      {/* SUMMARY */}

      <section className="review-summary-grid">

        <div className="review-summary-card">

          <div className="review-summary-icon purple">
            <MessageSquare size={23} />
          </div>

          <span>
            Total Reviews
          </span>

          <strong>
            {formatNumber(
              summary.total_reviews
            )}
          </strong>

        </div>


        <div className="review-summary-card">

          <div className="review-summary-icon orange">
            <Star size={23} />
          </div>

          <span>
            Average Rating
          </span>

          <strong>
            {Number(
              summary.average_score || 0
            ).toFixed(2)}
            {" / 5"}
          </strong>

        </div>


        <div className="review-summary-card">

          <div className="review-summary-icon green">
            <Star size={23} />
          </div>

          <span>
            Five Star Reviews
          </span>

          <strong>

            {formatNumber(
              summary.distribution?.find(
                (item) =>
                  item.score === 5
              )?.total || 0
            )}

          </strong>

        </div>

      </section>


      {/* DISTRIBUTION */}

      <section className="review-distribution-card">

        <div className="reviews-section-header">

          <div>

            <h2>
              Rating Distribution
            </h2>

            <p>
              Breakdown of customer ratings.
            </p>

          </div>

        </div>


        <div className="rating-distribution">

          {summary.distribution?.map(
            (item) => (

              <div
                className="rating-row"
                key={item.score}
              >

                <span>
                  {item.score} Stars
                </span>

                <div className="rating-bar">

                  <div
                    style={{
                      width: `${
                        Number(
                          item.percentage || 0
                        )
                      }%`,
                    }}
                  />

                </div>

                <strong>
                  {item.percentage}%
                </strong>

              </div>

            )
          )}

        </div>

      </section>


      {/* TABLE */}

      <section className="reviews-table-card">

        <div className="reviews-section-header">

          <div>

            <h2>
              Customer Feedback
            </h2>

            <p>
              Reviews stored in MySQL.
            </p>

          </div>


          <div className="reviews-search">

            <Search size={18} />

            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search review ID, order ID or score..."
            />

          </div>

        </div>


        {error && (
          <div className="reviews-error">
            {error}
          </div>
        )}


        <div className="reviews-table-wrapper">

          <table className="reviews-table">

            <thead>

              <tr>

                <th>
                  Review ID
                </th>

                <th>
                  Order ID
                </th>

                <th>
                  Rating
                </th>

                <th>
                  Comment
                </th>

                <th>
                  Date
                </th>

              </tr>

            </thead>


            <tbody>

              {reviews.length > 0 ? (

                reviews.map(
                  (review, index) => (

                    <tr
                      key={`${review.review_id}-${index}`}
                    >

                      <td className="review-id">

                        {review.review_id}

                      </td>


                      <td className="review-order-id">

                        {review.order_id}

                      </td>


                      <td>

                        {renderStars(
                          review.review_score
                        )}

                      </td>


                      <td className="review-comment">

                        {review.review_comment_message ||
                          review.review_comment_title ||
                          "No comment"}

                      </td>


                      <td>

                        {formatDate(
                          review.review_creation_date
                        )}

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    className="reviews-no-data"
                  >

                    No reviews found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>


        {/* PAGINATION */}

        <div className="reviews-pagination">

          <span>

            Showing{" "}

            {reviews.length
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

            <button
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  (p) => p - 1
                )
              }
            >
              <ChevronLeft size={17} />
            </button>


            <span>
              Page {page} of{" "}
              {totalPages || 1}
            </span>


            <button
              disabled={
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


export default Reviews;