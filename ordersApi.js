const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function getHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// Get orders
export async function getOrders({
  search = "",
  status = "",
  sortBy = "date",
  sortDirection = "desc",
  page = 1,
  limit = 20,
} = {}) {
  const params = new URLSearchParams();

  if (search) {
    params.append("search", search);
  }

  if (status) {
    params.append("status", status);
  }

  params.append("sort_by", sortBy);
  params.append("sort_direction", sortDirection);
  params.append("page", page);
  params.append("limit", limit);

  const response = await fetch(
    `${API_URL}/orders/?${params.toString()}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail || "Failed to load orders"
    );
  }

  return data;
}


// Get order statuses
export async function getOrderStatuses() {
  const response = await fetch(
    `${API_URL}/orders/statuses`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load order statuses"
    );
  }

  return data;
}


// Get single order
export async function getOrder(orderId) {
  const response = await fetch(
    `${API_URL}/orders/${orderId}`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.detail ||
      "Failed to load order"
    );
  }

  return data;
}

async function postOrderAction(orderId, action) {
  const response = await fetch(
    `${API_URL}/orders/${encodeURIComponent(orderId)}/${action}`,
    {
      method: "POST",
      headers: getHeaders(),
    }
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Failed to ${action} order`);
  }

  return data;
}

async function postJson(path, payload) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Unable to complete this request.");
  }
  return data;
}

export function cancelOrder(orderId) {
  return postOrderAction(orderId, "cancel");
}

export function markOrderDelivered(orderId) {
  return postOrderAction(orderId, "delivered");
}

export function submitOrderFeedback(profileId, feedback) {
  return postJson(
    `/api/v1/consumer-profiles/${encodeURIComponent(profileId)}/feedback`,
    feedback
  );
}

export function reorder(orderId, paymentType) {
  return postJson(
    `/orders/${encodeURIComponent(orderId)}/reorder`,
    paymentType ? { payment_type: paymentType } : null,
  );
}

export async function placeCustomerOrder(payload) {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  const response = await fetch(`${API_URL}/orders/place`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || "Unable to place your order.");
  }
  return data;
}