const API_URL = "http://127.0.0.1:8000";

function getHeaders() {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getSellers({
  search = "",
  state = "",
  city = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams({
    search,
    state,
    city,
    page: String(page),
    limit: String(limit),
  });
  const response = await fetch(`${API_URL}/sellers/?${params}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load sellers");
  }
  return data;
}

export async function getSellerFilters() {
  const response = await fetch(`${API_URL}/sellers/filters`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load seller filters");
  }
  return data;
}

export async function createSeller(seller) {
  const response = await fetch(`${API_URL}/sellers/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(seller),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to add seller");
  }
  return data;
}
