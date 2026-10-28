const API_URL = "http://127.0.0.1:8000";


function getHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// =========================================================
// GET PAYMENTS
// =========================================================

export async function getPayments({
  search = "",
  page = 1,
  limit = 20,
} = {}) {

  const params = new URLSearchParams();

  if (search.trim()) {
    params.append("search", search.trim());
  }

  params.append("page", page);
  params.append("limit", limit);


  const response = await fetch(
    `${API_URL}/payments/?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );


  const data = await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load payments"
    );
  }


  return data;
}


// =========================================================
// GET PAYMENT SUMMARY
// =========================================================

export async function getPaymentSummary() {

  const response = await fetch(
    `${API_URL}/payments/summary`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );


  const data = await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load payment summary"
    );
  }


  return data;
}


// =========================================================
// GET PAYMENT METHODS
// =========================================================

export async function getPaymentMethods() {

  const response = await fetch(
    `${API_URL}/payments/methods`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );


  const data = await response.json();


  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load payment methods"
    );
  }


  return data;
}