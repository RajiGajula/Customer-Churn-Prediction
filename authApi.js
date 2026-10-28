const API_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

function formatValidationErrors(errors) {
  return errors
    .map((item) => {
      const field = item?.loc?.at(-1);
      const fieldLabel = field
        ? `${String(field)
            .replaceAll("_", " ")
            .replace(/\b\w/g, (character) => character.toUpperCase())}: `
        : "";
      return `${fieldLabel}${item?.msg || "Invalid value"}`;
    })
    .join(". ");
}


// =========================================================
// HELPER: EXTRACT READABLE ERROR MESSAGE
// =========================================================

function getErrorMessage(data, fallbackMessage) {
  if (!data) {
    return fallbackMessage;
  }

  // Backend returned a plain string
  if (typeof data === "string") {
    return data;
  }

  // FastAPI detail
  if (typeof data.detail === "string") {
    return data.detail;
  }

  // Generic message
  if (typeof data.message === "string") {
    return data.message;
  }

  // Generic error
  if (typeof data.error === "string") {
    return data.error;
  }

  // FastAPI detail returned as an object
  if (
    data.detail &&
    typeof data.detail === "object"
  ) {
    if (
      typeof data.detail.message === "string"
    ) {
      return data.detail.message;
    }

    if (
      typeof data.detail.msg === "string"
    ) {
      return data.detail.msg;
    }

    // FastAPI validation errors
    if (Array.isArray(data.detail)) {
      return formatValidationErrors(data.detail);
    }

    try {
      return JSON.stringify(data.detail);
    } catch {
      return fallbackMessage;
    }
  }

  // Error object
  if (
    data.error &&
    typeof data.error === "object"
  ) {
    if (
      typeof data.error.message === "string"
    ) {
      return data.error.message;
    }

    try {
      return JSON.stringify(data.error);
    } catch {
      return fallbackMessage;
    }
  }

  // Last attempt
  try {
    const converted = JSON.stringify(data);

    if (
      converted &&
      converted !== "{}"
    ) {
      return converted;
    }
  } catch {
    // Ignore JSON conversion error
  }

  return fallbackMessage;
}


// =========================================================
// SIGNUP
// =========================================================

export async function signup(
  name,
  email,
  password,
  optionalFields = {}
) {
  try {
    const response = await fetch(
      `${API_URL}/auth/signup`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...optionalFields,
          name,
          email,
          password,
        }),
      }
    );

    const data = await response.json();

    console.log(
      "Signup API status:",
      response.status
    );

    console.log(
      "Signup API response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Signup failed"
        )
      );
    }

    return data;

  } catch (error) {

    console.error(
      "Signup API error:",
      error
    );

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the backend. Please make sure the FastAPI server is running.",
        { cause: error }
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      getErrorMessage(
        error,
        "Signup failed"
      ),
      { cause: error }
    );
  }
}


// =========================================================
// LOGIN
// =========================================================

export async function login(
  email,
  password
) {
  try {

    /*
     * IMPORTANT:
     *
     * Your backend LoginRequest expects:
     *
     * {
     *     email: str,
     *     password: str
     * }
     *
     * Your backend then searches:
     *
     * User.email == request.email
     *
     * Therefore we MUST send "email" here.
     */

    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      }
    );

    const data = await response.json();

    console.log(
      "Login API status:",
      response.status
    );

    console.log(
      "Login API response:",
      data
    );

    /*
     * Backend returned an error
     */

    if (!response.ok) {
      throw new Error(
        getErrorMessage(
          data,
          "Login failed"
        )
      );
    }

    /*
     * Successful login
     */

    return data;

  } catch (error) {

    console.error(
      "Login API error:",
      error
    );

    /*
     * Backend is not running / network problem
     */

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the backend. Please make sure the FastAPI server is running.",
        { cause: error }
      );
    }

    /*
     * Preserve readable Error
     */

    if (error instanceof Error) {
      throw error;
    }

    /*
     * Unexpected object error
     */

    throw new Error(
      getErrorMessage(
        error,
        "Login failed"
      ),
      { cause: error }
    );
  }
}


// =========================================================
// SAVE AUTHENTICATION INFORMATION
// =========================================================

export function saveAuth(data) {

  if (!data) {
    console.error(
      "saveAuth: No authentication data received."
    );

    return;
  }

  /*
   * Access token
   */

  if (data.access_token) {
    localStorage.setItem(
      "access_token",
      data.access_token
    );
  }

  /*
   * Token type
   */

  if (data.token_type) {
    localStorage.setItem(
      "token_type",
      data.token_type
    );
  }

  /*
   * User role
   */

  if (data.role) {
    localStorage.setItem(
      "role",
      data.role
    );
  }

  /*
   * User name
   */

  if (data.name) {
    localStorage.setItem(
      "name",
      data.name
    );
  }

  /*
   * Username
   */

  if (data.username) {
    localStorage.setItem(
      "username",
      data.username
    );
  }

  /*
   * Email
   */

  if (data.email) {
    localStorage.setItem(
      "email",
      data.email
    );
  }
}


// =========================================================
// LOGOUT
// =========================================================

export function logout() {

  localStorage.removeItem(
    "access_token"
  );

  localStorage.removeItem(
    "token_type"
  );

  localStorage.removeItem(
    "role"
  );

  localStorage.removeItem(
    "name"
  );

  localStorage.removeItem(
    "username"
  );

  localStorage.removeItem(
    "email"
  );

  localStorage.removeItem(
    "user"
  );

  localStorage.removeItem(
    "currentUser"
  );

  localStorage.removeItem(
    "rememberMe"
  );
}


// =========================================================
// GET TOKEN
// =========================================================

export function getToken() {

  return localStorage.getItem(
    "access_token"
  );
}


// =========================================================
// GET ROLE
// =========================================================

export function getRole() {

  return localStorage.getItem(
    "role"
  );
}


// =========================================================
// GET NAME
// =========================================================

export function getName() {

  return localStorage.getItem(
    "name"
  );
}


// =========================================================
// GET USERNAME
// =========================================================

export function getUsername() {

  return localStorage.getItem(
    "username"
  );
}


// =========================================================
// GET EMAIL
// =========================================================

export function getEmail() {

  return localStorage.getItem(
    "email"
  );
}


// =========================================================
// GET PROFILE
// =========================================================

export async function getProfile() {

  const token =
    localStorage.getItem(
      "access_token"
    );

  try {

    const response = await fetch(
      `${API_URL}/auth/profile`,
      {
        method: "GET",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    const data =
      await response.json();

    console.log(
      "Profile API status:",
      response.status
    );

    console.log(
      "Profile API response:",
      data
    );

    if (!response.ok) {

      throw new Error(
        getErrorMessage(
          data,
          "Failed to load profile"
        )
      );

    }

    return data;

  } catch (error) {

    console.error(
      "Get profile API error:",
      error
    );

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the backend. Please make sure the FastAPI server is running.",
        { cause: error }
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Failed to load profile",
      { cause: error }
    );
  }
}

export async function getCustomerProfile() {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/auth/customer-profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Failed to load customer profile"));
  }
  return data;
}


// =========================================================
// UPDATE PROFILE
// =========================================================

export async function updateProfile(
  name,
  email
) {

  const token =
    localStorage.getItem(
      "access_token"
    );

  try {

    const response = await fetch(
      `${API_URL}/auth/profile`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      }

    );

    const data =
      await response.json();

    console.log(
      "Update profile API status:",
      response.status
    );

    console.log(
      "Update profile API response:",
      data
    );

    if (!response.ok) {

      throw new Error(
        getErrorMessage(
          data,
          "Failed to update profile"
        )
      );

    }

    return data;

  } catch (error) {

    console.error(
      "Update profile API error:",
      error
    );

    if (error instanceof TypeError) {
      throw new Error(
        "Unable to connect to the backend. Please make sure the FastAPI server is running.", { cause: error }
      );
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error(
      "Failed to update profile",
      { cause: error }
    );
  }
}

export async function changePassword(currentPassword, newPassword) {
  const token = localStorage.getItem("access_token");
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Unable to change password."));
  }
  return data;
}