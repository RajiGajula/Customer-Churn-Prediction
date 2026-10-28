const API_URL = "http://127.0.0.1:8000";

function getHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// Get products
export async function getProducts({
  search = "",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.append("search", search);
  }

  params.append("page", page);
  params.append("limit", limit);

  const response = await fetch(
    `${API_URL}/products/?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load products"
    );
  }

  return data;
}

export async function createProduct(product) {
  const response = await fetch(`${API_URL}/products/`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(product),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to add product");
  }
  return data;
}


// Get product categories
export async function getProductCategories() {
  const response = await fetch(
    `${API_URL}/products/categories`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load product categories"
    );
  }

  return data;
}

export async function getOrderCatalog({ search = "", limit = 50 } = {}) {
  const params = new URLSearchParams({ search, limit: String(limit) });
  const response = await fetch(
    `${API_URL}/products/order-catalog?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to load order catalog");
  }
  return data;
}