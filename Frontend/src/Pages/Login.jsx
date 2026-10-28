import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, saveAuth } from "../services/authApi";

function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    // Clear previous error when user starts typing again
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Validate fields
    if (!form.email || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      /*
       * =====================================================
       * LOGIN
       * =====================================================
       */

      const data = await login(
        form.email.trim(),
        form.password
      );

      /*
       * =====================================================
       * SAVE AUTHENTICATION INFORMATION
       * =====================================================
       */

      saveAuth(data);

      /*
       * =====================================================
       * GET USER INFORMATION
       * =====================================================
       *
       * Supports different possible backend response
       * structures.
       */

      const userData =
        data?.user ||
        data?.user_data ||
        data?.data?.user ||
        data?.data ||
        data;

      /*
       * =====================================================
       * GET USER NAME
       * =====================================================
       */

      const userName =
        userData?.name ||
        userData?.full_name ||
        userData?.fullName ||
        userData?.username ||
        userData?.first_name ||
        userData?.firstName ||
        form.email.split("@")[0];

      /*
       * =====================================================
       * GET USER EMAIL
       * =====================================================
       */

      const userEmail =
        userData?.email ||
        form.email.trim();

      /*
       * =====================================================
       * GET USER ROLE
       * =====================================================
       */

      const userRole = String(
        userData?.role ||
        data?.role ||
        "customer"
      )
        .trim()
        .toLowerCase();
      const normalizedRole = ["staff", "user", "viewer"].includes(userRole)
        ? "customer"
        : userRole;

      /*
       * =====================================================
       * CREATE LOGGED-IN USER OBJECT
       * =====================================================
       */

      const loggedInUser = {
        name: userName,
        email: userEmail,
        role: normalizedRole,
      };

      /*
       * =====================================================
       * SAVE USER INFORMATION
       * =====================================================
       */

      localStorage.setItem(
        "user",
        JSON.stringify(loggedInUser)
      );

      /*
       * =====================================================
       * BACKUP COPY
       * =====================================================
       */

      localStorage.setItem(
        "currentUser",
        JSON.stringify(loggedInUser)
      );

      /*
       * =====================================================
       * IMPORTANT ROLE STORAGE
       * =====================================================
       *
       * RegisteredUsers.jsx uses:
       *
       * localStorage.getItem("role")
       *
       * Therefore we MUST store the role using
       * the "role" key.
       */

      localStorage.setItem(
        "role",
        normalizedRole
      );

      /*
       * =====================================================
       * REMEMBER ME
       * =====================================================
       *
       * If Remember Me is selected, store a small flag.
       * Authentication itself is still handled by saveAuth().
       */

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      /*
       * =====================================================
       * ROLE-BASED NAVIGATION
       * =====================================================
       */

      navigate("/dashboard");

    } catch (err) {
      /*
       * =====================================================
       * LOGIN ERROR HANDLING
       * =====================================================
       *
       * The previous code was displaying:
       *
       *     [object Object]
       *
       * This happens when the backend returns an object
       * instead of a plain string.
       *
       * We now check all common backend error structures
       * and extract the actual readable message.
       */

      console.error("Login error:", err);

      // eslint-disable-next-line no-useless-assignment
      let errorMessage = "";

      // Case 1:
      // Axios-style error:
      // err.response.data.detail
      if (typeof err?.response?.data?.detail === "string") {
        errorMessage = err.response.data.detail;
      }

      // Case 2:
      // Axios-style:
      // err.response.data.message
      else if (
        typeof err?.response?.data?.message === "string"
      ) {
        errorMessage = err.response.data.message;
      }

      // Case 3:
      // Axios-style:
      // err.response.data.error
      else if (
        typeof err?.response?.data?.error === "string"
      ) {
        errorMessage = err.response.data.error;
      }

      // Case 4:
      // Fetch/custom API:
      // err.error.detail
      else if (
        typeof err?.error?.detail === "string"
      ) {
        errorMessage = err.error.detail;
      }

      // Case 5:
      // Fetch/custom API:
      // err.error.message
      else if (
        typeof err?.error?.message === "string"
      ) {
        errorMessage = err.error.message;
      }

      // Case 6:
      // Fetch/custom API:
      // err.error.error
      else if (
        typeof err?.error?.error === "string"
      ) {
        errorMessage = err.error.error;
      }

      // Case 7:
      // Sometimes the login function throws the backend
      // response object directly.
      else if (
        typeof err?.detail === "string"
      ) {
        errorMessage = err.detail;
      }

      // Case 8:
      // Backend object containing message directly.
      else if (
        typeof err?.message === "string"
      ) {
        errorMessage = err.message;
      }

      // Case 9:
      // Sometimes err itself is a string.
      else if (
        typeof err === "string"
      ) {
        errorMessage = err;
      }

      // Final fallback
      else {
        errorMessage =
          "Login failed. Please check your email and password.";
      }

      setError(errorMessage);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* =====================================================
          LEFT BRAND PANEL
      ===================================================== */}

      <div className="auth-brand-panel">

        <div className="brand-logo-large">
          C
        </div>

        <h1>
          CUSTOMER
        </h1>

        <h1>
          SPHERE
        </h1>

        <p className="brand-description">
          Understand your customers.
          <br />
          Make smarter decisions.
        </p>

        <div className="brand-decoration">

          <div className="circle circle-one"></div>

          <div className="circle circle-two"></div>

          <div className="circle circle-three"></div>

          <div className="brand-chart">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>

        </div>

      </div>


      {/* =====================================================
          LOGIN PANEL
      ===================================================== */}

      <div className="auth-form-panel">

        <div className="auth-form-container">

          {/* =================================================
              MOBILE BRAND
          ================================================= */}

          <div className="mobile-brand">

            <div className="brand-logo-small">
              C
            </div>

            <span>
              CUSTOMER SPHERE
            </span>

          </div>


          {/* =================================================
              HEADING
          ================================================= */}

          <div className="auth-heading">

            <h2>
              Welcome Back
            </h2>

            <p>
              Sign in to continue to
              Customer Sphere.
            </p>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div className="auth-error">

              <span>
                !
              </span>

              <div>
                {error}
              </div>

            </div>
          )}


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form onSubmit={handleSubmit}>

            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="input-group">

              <label>
                Email Address
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  @
                </span>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                />

              </div>

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="input-group">

              <label>
                Password
              </label>

              <div className="input-wrapper">

                <span className="input-icon">
                  ●
                </span>

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? "◉" : "◌"}
                </button>

              </div>

            </div>


            {/* =================================================
                OPTIONS
            ================================================= */}

            <div className="login-options">

              <label className="remember-me">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) =>
                    setRememberMe(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Remember me
                </span>

              </label>

            </div>


            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span className="spinner"></span>

                  Signing In...
                </>
              ) : (
                <>
                  LOGIN

                  <span>
                    →
                  </span>
                </>
              )}

            </button>

          </form>


          {/* =================================================
              SIGNUP LINK
          ================================================= */}

          <div className="auth-switch">

            Don't have an account?

            <Link to="/signup">
              Create Account
            </Link>

          </div>


        </div>

      </div>

    </div>
  );
}

export default Login;