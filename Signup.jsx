import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Loader2,
  AlertCircle,
} from "lucide-react";

import { signup } from "../services/authApi";
import "../styles/Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    if (!form.password) {
      setError("Password is required.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await signup(
        form.name.trim(),
        form.email.trim(),
        form.password,
        {
          phone: form.phone.trim(),
          address: form.address.trim(),
        }
      );

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      console.error("Signup error:", err);

      setError(
        err.message || "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      <div className="signup-container">

        <div className="signup-card">

          {/* HEADER */}

          <div className="signup-header">

            <div className="signup-icon">
              <UserPlus size={24} />
            </div>

            <h1>Create Account</h1>

            <p>
              Sign up to get started with Customer Sphere.
            </p>

          </div>


          {/* ERROR */}

          {error && (
            <div className="signup-message signup-error">

              <AlertCircle size={18} />

              <span>{error}</span>

            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div className="signup-message signup-success">

              <span>{success}</span>

            </div>
          )}


          {/* FORM */}

          <form
            className="signup-form"
            onSubmit={handleSignup}
          >

            {/* NAME */}

            <div className="signup-field">

              <label>
                Full Name
              </label>

              <div className="signup-input-wrapper">

                <User size={18} />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className="signup-field">

              <label>
                Email
              </label>

              <div className="signup-input-wrapper">

                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />

              </div>

            </div>


            {/* PHONE */}

            <div className="signup-field">

              <label>
                Phone Number
              </label>

              <div className="signup-input-wrapper">

                <Phone size={18} />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  required
                />

              </div>

            </div>


            {/* ADDRESS */}

            <div className="signup-field">

              <label>
                Address <span>(Optional)</span>
              </label>

              <div className="signup-input-wrapper signup-textarea-wrapper">

                <MapPin size={18} />

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="2"
                  autoComplete="street-address"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="signup-field">

              <label>
                Password
              </label>

              <div className="signup-input-wrapper">

                <Lock size={18} />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

              <small>
                Password must be at least 8 characters.
              </small>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="signup-field">

              <label>
                Confirm Password
              </label>

              <div className="signup-input-wrapper">

                <Lock size={18} />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >

                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>


            {/* BUTTON */}

            <button
              type="submit"
              className="signup-button"
              disabled={loading}
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="signup-spinner"
                  />

                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />

                  Create Account
                </>
              )}

            </button>

          </form>


          {/* LOGIN */}

          <div className="signup-login-link">

            Already have an account?{" "}

            <Link to="/login">
              Sign In
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Signup;