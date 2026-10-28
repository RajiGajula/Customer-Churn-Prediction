import { useEffect, useState } from "react";
import {
  User,
  Lock,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

import "../styles/Profile.css";

const API_URL = "http://127.0.0.1:8000";

function getHeaders() {
  const token = localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function Profile() {
  /* =====================================================
     PROFILE STATE
  ===================================================== */

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileError, setProfileError] =
    useState("");


  /* =====================================================
     PASSWORD STATE
  ===================================================== */

  const [password, setPassword] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [changingPassword, setChangingPassword] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");


  /* =====================================================
     PASSWORD VISIBILITY
  ===================================================== */

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);


  /* =====================================================
     LOAD PROFILE
  ===================================================== */

  const loadProfile = async () => {
    try {
      setLoading(true);
      setProfileError("");

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load profile"
        );
      }

      setProfile({
        name: data.name || "",
        email: data.email || "",
        role: data.role || "customer",
      });

      /*
       * Keep localStorage synchronized
       */

      const storedUser = {
        name: data.name || "",
        email: data.email || "",
        role: data.role || "customer",
      };

      localStorage.setItem(
        "user",
        JSON.stringify(storedUser)
      );

      localStorage.setItem(
        "currentUser",
        JSON.stringify(storedUser)
      );

      localStorage.setItem(
        "name",
        data.name || ""
      );

      localStorage.setItem(
        "role",
        data.role || "customer"
      );

    } catch (error) {
      console.error(
        "Profile loading error:",
        error
      );

      /*
       * Fallback to localStorage
       */

      try {
        const stored =
          localStorage.getItem("user");

        if (stored) {
          const user =
            JSON.parse(stored);

          setProfile({
            name: user.name || "",
            email: user.email || "",
            role: user.role || "customer",
          });
        }

      } catch {
        // Ignore localStorage errors
      }

      setProfileError(
        error.message ||
        "Unable to load profile."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const timeoutId = window.setTimeout(loadProfile, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);


  /* =====================================================
     PROFILE INPUT
  ===================================================== */

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setProfileMessage("");
    setProfileError("");
  };


  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setProfileMessage("");
    setProfileError("");

    if (!profile.name.trim()) {
      setProfileError(
        "Name cannot be empty."
      );
      return;
    }

    if (profile.name.trim().length < 2) {
      setProfileError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/auth/profile`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            name: profile.name.trim(),
            email: profile.email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to update profile"
        );
      }

      const updatedUser = {
        name:
          data.name ||
          profile.name.trim(),

        email:
          data.email ||
          profile.email.trim(),

        role:
          data.role ||
          profile.role ||
          "user",
      };

      setProfile(updatedUser);

      /*
       * Update localStorage
       */

      localStorage.setItem(
        "name",
        updatedUser.name
      );

      localStorage.setItem(
        "email",
        updatedUser.email
      );

      localStorage.setItem(
        "role",
        updatedUser.role
      );

      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      localStorage.setItem(
        "currentUser",
        JSON.stringify(updatedUser)
      );

      setProfileMessage(
        "Profile updated successfully."
      );

    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setProfileError(
        error.message ||
        "Failed to update profile."
      );

    } finally {
      setSaving(false);
    }
  };


  /* =====================================================
     PASSWORD INPUT
  ===================================================== */

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPassword((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPasswordMessage("");
    setPasswordError("");
  };


  /* =====================================================
     CHANGE PASSWORD
  ===================================================== */

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    if (
      !password.current_password ||
      !password.new_password ||
      !password.confirm_password
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );
      return;
    }

    if (password.new_password.length < 8) {
      setPasswordError(
        "New password must be at least 8 characters long."
      );
      return;
    }

    if (
      password.new_password !==
      password.confirm_password
    ) {
      setPasswordError(
        "New password and confirmation password do not match."
      );
      return;
    }

    if (
      password.current_password ===
      password.new_password
    ) {
      setPasswordError(
        "New password must be different from your current password."
      );
      return;
    }

    try {
      setChangingPassword(true);

      const response = await fetch(
        `${API_URL}/auth/change-password`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            current_password:
              password.current_password,

            new_password:
              password.new_password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Failed to change password"
        );
      }

      setPassword({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setPasswordMessage(
        "Password changed successfully."
      );

    } catch (error) {
      console.error(
        "Password change error:",
        error
      );

      setPasswordError(
        error.message ||
        "Failed to change password."
      );

    } finally {
      setChangingPassword(false);
    }
  };


  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-spinner"></div>

        <p>
          Loading profile...
        </p>
      </div>
    );
  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="profile-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="profile-page-header">

        <div className="profile-page-icon">
          <User size={30} />
        </div>

        <div>
          <h1>
            Edit Profile
          </h1>

          <p>
            Update your personal information
            and change your password.
          </p>
        </div>

      </div>


      {/* =================================================
          PROFILE INFORMATION
      ================================================= */}

      <section className="profile-card">

        <div className="profile-section-header">

          <div className="profile-section-icon">
            <User size={25} />
          </div>

          <div>
            <h2>
              Profile Information
            </h2>

            <p>
              Update your name and email address.
            </p>
          </div>

        </div>


        <form onSubmit={handleSaveProfile}>

          <div className="profile-form-grid">

            {/* NAME */}

            <div className="profile-field">

              <label>
                Name
              </label>

              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Enter your name"
              />

            </div>


            {/* EMAIL */}

            <div className="profile-field">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                placeholder="Enter your email"
              />

            </div>


            {/* ROLE */}

            <div className="profile-field role-field">

              <label>
                Role
              </label>

              <input
                type="text"
                value={profile.role}
                disabled
              />

            </div>

          </div>


          {/* PROFILE ERROR */}

          {profileError && (
            <div className="profile-message error">
              {profileError}
            </div>
          )}


          {/* PROFILE SUCCESS */}

          {profileMessage && (
            <div className="profile-message success">
              {profileMessage}
            </div>
          )}


          {/* SAVE */}

          <button
            type="submit"
            className="profile-save-button"
            disabled={saving}
          >

            <Save size={19} />

            {saving
              ? "Saving..."
              : "Save Changes"}

          </button>

        </form>

      </section>


      {/* =================================================
          CHANGE PASSWORD
      ================================================= */}

      <section className="profile-card password-card">

        <div className="profile-section-header">

          <div className="profile-section-icon">
            <Lock size={25} />
          </div>

          <div>
            <h2>
              Change Password
            </h2>

            <p>
              Update your password to keep your
              account secure.
            </p>
          </div>

        </div>


        <form onSubmit={handleChangePassword}>

          <div className="password-form-grid">

            {/* CURRENT PASSWORD */}

            <div className="profile-field">

              <label>
                Current Password
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showCurrentPassword
                      ? "text"
                      : "password"
                  }
                  name="current_password"
                  value={
                    password.current_password
                  }
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() =>
                    setShowCurrentPassword(
                      !showCurrentPassword
                    )
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>


            {/* NEW PASSWORD */}

            <div className="profile-field">

              <label>
                New Password
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showNewPassword
                      ? "text"
                      : "password"
                  }
                  name="new_password"
                  value={
                    password.new_password
                  }
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() =>
                    setShowNewPassword(
                      !showNewPassword
                    )
                  }
                >
                  {showNewPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

            <div className="profile-field">

              <label>
                Confirm New Password
              </label>

              <div className="password-input-wrapper">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  value={
                    password.confirm_password
                  }
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                />

                <button
                  type="button"
                  className="password-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>

            </div>

          </div>


          <p className="password-hint">
            Password must be at least 8 characters long.
          </p>


          {/* PASSWORD ERROR */}

          {passwordError && (
            <div className="profile-message error">
              {passwordError}
            </div>
          )}


          {/* PASSWORD SUCCESS */}

          {passwordMessage && (
            <div className="profile-message success">
              {passwordMessage}
            </div>
          )}


          {/* CHANGE PASSWORD BUTTON */}

          <button
            type="submit"
            className="profile-save-button"
            disabled={changingPassword}
          >

            <Lock size={19} />

            {changingPassword
              ? "Changing..."
              : "Change Password"}

          </button>

        </form>

      </section>

    </div>
  );
}

export default Profile;