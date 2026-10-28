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
// GEOGRAPHY
// =========================================================

export async function getGeography({
  search = "",
  state = "",
  sortBy = "state",
  sortDirection = "asc",
  page = 1,
  limit = 20,
  signal,
} = {}) {

  const params = new URLSearchParams();

  const cleanSearch = search.trim();

  if (cleanSearch) {
    params.append(
      "search",
      cleanSearch
    );
  }

  if (state) {
    params.append("state", state);
  }

  params.append("sort_by", sortBy);
  params.append("sort_direction", sortDirection);
  params.append("page", page);
  params.append("limit", limit);


  const url =
    `${API_URL}/geography/?${params.toString()}`;

  console.log(
    "GEOGRAPHY REQUEST:",
    url
  );


  const response = await fetch(
    url,
    {
      method: "GET",
      headers: getHeaders(),
      signal,
    }
  );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to load geography"
    );

  }


  console.log(
    "GEOGRAPHY RESPONSE:",
    data
  );


  return data;
}


// =========================================================
// STATES
// =========================================================

export async function getGeographyStates() {

  const response = await fetch(
    `${API_URL}/geography/states`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to load states"
    );

  }


  return data;
}


// =========================================================
// SUMMARY
// =========================================================

export async function getGeographySummary() {

  const response = await fetch(
    `${API_URL}/geography/summary`,
    {
      method: "GET",
      headers: getHeaders(),
    }
  );


  const data =
    await response.json();


  if (!response.ok) {

    throw new Error(
      data.detail ||
      "Failed to load geography summary"
    );

  }


  return data;
}