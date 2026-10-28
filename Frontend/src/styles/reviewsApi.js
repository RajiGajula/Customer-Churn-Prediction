 const API_URL = "http://127.0.0.1:8000";


function getHeaders() {

  const token =
    localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// =========================================================
// REVIEWS
// =========================================================

export async function getReviews({
  search = "",
  page = 1,
  limit = 20,
} = {}) {

  const params =
    new URLSearchParams();

  if (search.trim()) {
    params.append(
      "search",
      search.trim()
    );
  }

  params.append("page", page);
  params.append("limit", limit);


  const response = await fetch(
    `${API_URL}/reviews/?${params.toString()}`,
    {
      headers: getHeaders(),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load reviews"
    );
  }


  return data;
}


// =========================================================
// REVIEW SUMMARY
// =========================================================

export async function getReviewSummary() {

  const response = await fetch(
    `${API_URL}/reviews/summary`,
    {
      headers: getHeaders(),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load review summary"
    );
  }


  return data;
}
