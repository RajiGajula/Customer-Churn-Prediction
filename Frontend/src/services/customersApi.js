const API_URL = "http://127.0.0.1:8000";

export const createFirstOrderForProfile = async (profileId, payload) => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");
  const response = await fetch(
    `${API_URL}/customers/profiles/${encodeURIComponent(profileId)}/first-order`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: JSON.stringify(payload),
    }
  );
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || "Unable to create the customer's first order.");
  }
  return data;
};

export const getCustomers = async ({
  search = "",
  page = 1,
  limit = 20,
} = {}) => {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const params = new URLSearchParams({
    search,
    page: String(page),
    limit: String(limit),
  });

  const response = await fetch(
    `${API_URL}/customers?${params.toString()}`,
    {
      headers: token
        ? { Authorization: "Bearer " + token }
        : {},
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.detail || "Failed to fetch customers");
  }

  return await response.json();
};
