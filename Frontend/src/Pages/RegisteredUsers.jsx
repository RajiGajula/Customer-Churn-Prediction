import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Shield,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Lock,
  User,
} from "lucide-react";

import "../styles/RegisteredUsers.css";


// =========================================================
// API
// =========================================================

const API_URL = "http://127.0.0.1:8000";


// =========================================================
// AUTH HEADERS
// =========================================================

function getHeaders() {

  const token =
    localStorage.getItem("access_token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// =========================================================
// REGISTERED USERS
// =========================================================

function RegisteredUsers() {

  // =======================================================
  // ROLE
  // =======================================================

  const [userRole, setUserRole] =
    useState(
      localStorage.getItem("role") || "customer"
    );


  const isAdmin =
    userRole.toLowerCase() === "admin";


  // =======================================================
  // USERS
  // =======================================================

  const [users, setUsers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchText, setSearchText] =
    useState("");


  // =======================================================
  // MODALS
  // =======================================================

  const [showViewModal, setShowViewModal] =
    useState(false);

  const [showFormModal, setShowFormModal] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);


  const [selectedUser, setSelectedUser] =
    useState(null);

  const [editingUser, setEditingUser] =
    useState(null);


  // =======================================================
  // FORM
  // =======================================================

  const [form, setForm] =
    useState({

      role: "customer",

      name: "",

      email: "",

      phone: "",

      address: "",

      password: "",

      confirm_password: "",

    });


  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [formError, setFormError] =
    useState("");


  // =======================================================
  // UPDATE ROLE
  // =======================================================

  useEffect(() => {

    const updateRole = () => {

      setUserRole(
        localStorage.getItem("role") ||
        "customer"
      );

    };


    updateRole();


    window.addEventListener(
      "storage",
      updateRole
    );


    return () => {

      window.removeEventListener(
        "storage",
        updateRole
      );

    };

  }, []);


  // =======================================================
  // LOAD USERS
  // =======================================================

  const loadUsers = async () => {

    try {

      setLoading(true);

      setError("");


      const response =
        await fetch(
          `${API_URL}/registered-users`,
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
          "Failed to load registered users."
        );

      }


      setUsers(
        Array.isArray(data.users)
          ? data.users
          : []
      );


    } catch (err) {

      console.error(
        "Registered users loading error:",
        err
      );


      setError(
        err?.message ||
        "Unable to load registered users."
      );


    } finally {

      setLoading(false);

    }

  };


  // =======================================================
  // INITIAL LOAD
  // =======================================================

  useEffect(() => {

    loadUsers();

  }, []);


  // =======================================================
  // SEARCH
  // =======================================================

  const filteredUsers =
    useMemo(() => {

      const search =
        searchText
          .trim()
          .toLowerCase();


      if (!search) {

        return users;

      }


      return users.filter(
        (user) => {

          const name =
            String(
              user?.name ||
              `${user?.first_name || ""} ${user?.last_name || ""}`
            ).toLowerCase();


          const email =
            String(
              user?.email || ""
            ).toLowerCase();


          const phone =
            String(
              user?.phone || ""
            ).toLowerCase();


          const role =
            String(
              user?.role || ""
            ).toLowerCase();


          const id =
            String(
              user?.id || ""
            ).toLowerCase();


          return (

            name.includes(search) ||

            email.includes(search) ||

            phone.includes(search) ||

            role.includes(search) ||

            id.includes(search)

          );

        }
      );

    }, [
      users,
      searchText,
    ]);


  // =======================================================
  // FORM CHANGE
  // =======================================================

  const handleFormChange =
    (event) => {

      const {
        name,
        value,
      } = event.target;


      setForm(
        (previous) => ({

          ...previous,

          [name]: value,

        })
      );


      setFormError("");

    };


  // =======================================================
  // RESET FORM
  // =======================================================

  const resetForm = () => {

    setForm({

      role: "customer",

      name: "",

      email: "",

      phone: "",

      address: "",

      password: "",

      confirm_password: "",

    });


    setFormError("");

  };


  // =======================================================
  // OPEN ADD CONSUMER
  // =======================================================

  const openAddUser = () => {

    if (!isAdmin) {

      return;

    }


    setEditingUser(null);

    resetForm();

    setShowFormModal(true);

  };


  // =======================================================
  // GET FULL NAME
  // =======================================================

  const getFullName =
    (user) => {

      if (user?.name) {

        return user.name;

      }


      const first =
        user?.first_name || "";


      const last =
        user?.last_name || "";


      const fullName =
        `${first} ${last}`.trim();


      return (
        fullName ||
        "Unknown Consumer"
      );

    };


  // =======================================================
  // OPEN EDIT
  // =======================================================

  const openEditUser =
    (user) => {

      if (!isAdmin) {

        return;

      }


      setEditingUser(user);


      setForm({

        role: ["user", "staff", "viewer"].includes(user?.role?.toLowerCase())
          ? "customer"
          : user?.role || "customer",

        name:
          getFullName(user) ===
          "Unknown Consumer"
            ? ""
            : getFullName(user),

        email:
          user?.email || "",

        phone:
          user?.phone || "",

        address:
          user?.address || "",

        password: "",

        confirm_password: "",

      });


      setFormError("");

      setShowFormModal(true);

    };


  // =======================================================
  // OPEN VIEW
  // =======================================================

  const openViewUser =
    (user) => {

      setSelectedUser(user);

      setShowViewModal(true);

    };


  // =======================================================
  // OPEN DELETE
  // =======================================================

  const openDeleteUser =
    (user) => {

      if (!isAdmin) {

        return;

      }


      setSelectedUser(user);

      setShowDeleteModal(true);

    };


  // =======================================================
  // SAVE USER
  // =======================================================

  const handleSaveUser =
    async (event) => {

      event.preventDefault();


      if (!isAdmin) {

        return;

      }


      setFormError("");


      // ---------------------------------------------------
      // NAME
      // ---------------------------------------------------

      if (!form.name.trim()) {

        setFormError(
          "Full name is required."
        );

        return;

      }


      // ---------------------------------------------------
      // EMAIL
      // ---------------------------------------------------

      if (!form.email.trim()) {

        setFormError(
          "Email is required."
        );

        return;

      }


      // ---------------------------------------------------
      // PHONE
      // ---------------------------------------------------

      if (!form.phone.trim()) {

        setFormError(
          "Phone number is required."
        );

        return;

      }

      if (!/^\d{10}$/.test(form.phone.trim())) {

        setFormError(
          "Phone number must contain exactly 10 digits."
        );

        return;

      }


      // ---------------------------------------------------
      // PASSWORD
      // ---------------------------------------------------

      if (!editingUser) {

        if (!form.password.trim()) {

          setFormError(
            "Password is required."
          );

          return;

        }

      }


      if (
        form.password &&
        form.password.length < 8
      ) {

        setFormError(
          "Password must be at least 8 characters."
        );

        return;

      }


      // ---------------------------------------------------
      // CONFIRM PASSWORD
      // ---------------------------------------------------

      if (
        form.password !==
        form.confirm_password
      ) {

        setFormError(
          "Passwords do not match."
        );

        return;

      }


      // ---------------------------------------------------
      // SAVE
      // ---------------------------------------------------

      try {

        setSaving(true);


        const isEditing =
          Boolean(editingUser);


        const url =
          isEditing

            ? `${API_URL}/registered-users/${editingUser.id}`

            : `${API_URL}/registered-users`;


        const method =
          isEditing
            ? "PUT"
            : "POST";


        // -------------------------------------------------
        // FORM DATA
        // -------------------------------------------------

        const formData =
          new URLSearchParams();


        formData.append(
          "role",
          form.role
        );


        formData.append(
          "name",
          form.name.trim()
        );


        formData.append(
          "email",
          form.email.trim()
        );


        formData.append(
          "phone",
          form.phone.trim()
        );


        formData.append(
          "address",
          form.address.trim()
        );


        formData.append(
          "password",
          form.password
        );


        formData.append(
          "confirm_password",
          form.confirm_password
        );


        // -------------------------------------------------
        // REQUEST
        // -------------------------------------------------

        const response =
          await fetch(
            url,
            {

              method,

              headers: {

                Authorization:
                  `Bearer ${
                    localStorage.getItem(
                      "access_token"
                    )
                  }`,

                "Content-Type":
                  "application/x-www-form-urlencoded",

              },

              body: formData,

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Failed to save consumer."
          );

        }


        // -------------------------------------------------
        // SUCCESS
        // -------------------------------------------------

        setShowFormModal(false);

        setEditingUser(null);

        resetForm();

        await loadUsers();


      } catch (err) {

        console.error(
          "Consumer save error:",
          err
        );


        setFormError(
          err?.message ||
          "Failed to save consumer."
        );


      } finally {

        setSaving(false);

      }

    };


  // =======================================================
  // DELETE USER
  // =======================================================

  const handleDeleteUser =
    async () => {

      if (!isAdmin) {

        return;

      }


      if (!selectedUser) {

        return;

      }


      try {

        setDeleting(true);


        const response =
          await fetch(
            `${API_URL}/registered-users/${selectedUser.id}`,
            {

              method: "DELETE",

              headers: getHeaders(),

            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.detail ||
            "Failed to delete consumer."
          );

        }


        setShowDeleteModal(false);

        setSelectedUser(null);

        await loadUsers();


      } catch (err) {

        console.error(
          "Delete consumer error:",
          err
        );


        setError(
          err?.message ||
          "Failed to delete consumer."
        );


      } finally {

        setDeleting(false);

      }

    };


  // =======================================================
  // FORMAT DATE
  // =======================================================

  const formatDate =
    (date) => {

      if (!date) {

        return "—";

      }


      const parsed =
        new Date(date);


      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {

        return "—";

      }


      return parsed.toLocaleDateString(
        "en-US",
        {

          month: "short",

          day: "numeric",

          year: "numeric",

        }
      );

    };


  // =======================================================
  // LOADING
  // =======================================================

  if (loading) {

    return (

      <div className="registered-users-page">

        <div className="registered-users-loading">

          <RefreshCw
            size={26}
            className="loading-icon"
          />

          <p>
            Loading consumers...
          </p>

        </div>

      </div>

    );

  }


  // =======================================================
  // PAGE
  // =======================================================

  return (

    <div className="registered-users-page">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="registered-users-header">

        <div className="registered-users-title">

          <div className="registered-users-title-icon">

            <Users size={23} />

          </div>


          <div>

            <h1>
              Consumer Management
            </h1>

            <p>
              Manage users registered on Customer Sphere.
            </p>

          </div>

        </div>


        {/* ADMIN ADD */}

        {isAdmin && (

          <button
            className="consumer-add-button"
            onClick={openAddUser}
          >

            <Plus size={17} />

            Add Consumer

          </button>

        )}

      </div>


      {/* =================================================
          ROLE BANNER
      ================================================= */}

      <div className="consumer-role-banner">

        <Shield size={17} />

        <span>

          Signed in as{" "}

          <strong>
            {userRole}
          </strong>

          {" — "}

          {isAdmin

            ? "You have full consumer management permissions."

            : "You can view and search registered consumers."

          }

        </span>

      </div>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="consumer-error">

          <span>
            {error}
          </span>


          <button
            onClick={loadUsers}
          >
            Try Again
          </button>

        </div>

      )}


      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="consumer-toolbar">

        <div className="consumer-search">

          <Search size={17} />

          <input
            type="text"
            placeholder="Search by name, email, phone or role..."
            value={searchText}
            onChange={
              (event) =>
                setSearchText(
                  event.target.value
                )
            }
          />


          {searchText && (

            <button
              className="consumer-clear-search"
              onClick={() =>
                setSearchText("")
              }
            >

              <X size={15} />

            </button>

          )}

        </div>


        <span className="consumer-count">

          {filteredUsers.length}{" "}

          {filteredUsers.length === 1
            ? "Consumer"
            : "Consumers"}

        </span>

      </div>


      {/* =================================================
          EMPTY
      ================================================= */}

      {filteredUsers.length === 0 ? (

        <div className="consumer-empty">

          <Users size={40} />

          <h2>
            No registered consumers found
          </h2>

          <p>
            Users who create accounts on
            Customer Sphere will appear here.
          </p>

        </div>

      ) : (

        <div className="consumer-card">

          <div className="consumer-table-wrapper">

            <table className="consumer-table">

              <thead>

                <tr>

                  <th>
                    Consumer
                  </th>

                  <th>
                    Email
                  </th>

                  <th>
                    Phone
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Registered
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody>

                {filteredUsers.map(
                  (user) => (

                    <tr key={user.id}>

                      {/* CONSUMER */}

                      <td>

                        <div className="consumer-name-cell">

                          <div className="consumer-avatar">

                            {getFullName(user)
                              .charAt(0)
                              .toUpperCase()}

                          </div>


                          <div>

                            <strong>
                              {getFullName(user)}
                            </strong>

                            <span>
                              ID: {user.id}
                            </span>

                          </div>

                        </div>

                      </td>


                      {/* EMAIL */}

                      <td>

                        <div className="consumer-info">

                          <Mail size={14} />

                          {user.email}

                        </div>

                      </td>


                      {/* PHONE */}

                      <td>

                        <div className="consumer-info">

                          <Phone size={14} />

                          {user.phone || "—"}

                        </div>

                      </td>


                      {/* ROLE */}

                      <td>

                        <span
                          className={
                            user.role
                              ?.toLowerCase() ===
                            "admin"

                              ? "role-badge admin"

                              : "role-badge user"
                          }
                        >

                          {["customer", "viewer", "staff", "user"].includes(user.role?.toLowerCase())
                            ? "Viewer / Customer"
                            : user.role}

                        </span>

                      </td>


                      {/* DATE */}

                      <td>

                        <div className="consumer-info">

                          <Calendar size={14} />

                          {formatDate(
                            user.created_at
                          )}

                        </div>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="consumer-actions">

                          {/* VIEW */}

                          <button
                            className="consumer-action view"
                            title="View consumer"
                            onClick={() =>
                              openViewUser(user)
                            }
                          >

                            <Eye size={15} />

                          </button>


                          {/* EDIT */}

                          {isAdmin && (

                            <button
                              className="consumer-action edit"
                              title="Edit consumer"
                              onClick={() =>
                                openEditUser(user)
                              }
                            >

                              <Edit size={15} />

                            </button>

                          )}


                          {/* DELETE */}

                          {isAdmin && (

                            <button
                              className="consumer-action delete"
                              title="Delete consumer"
                              onClick={() =>
                                openDeleteUser(user)
                              }
                            >

                              <Trash2 size={15} />

                            </button>

                          )}

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      )}


      {/* =================================================
          VIEW MODAL
      ================================================= */}

      {showViewModal &&
        selectedUser && (

          <div className="consumer-modal-overlay">

            <div className="consumer-modal">

              <button
                className="consumer-modal-close"
                onClick={() =>
                  setShowViewModal(false)
                }
              >

                <X size={18} />

              </button>


              <div className="consumer-modal-header">

                <div className="consumer-modal-avatar">

                  {getFullName(
                    selectedUser
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>


                <div>

                  <h2>
                    {getFullName(
                      selectedUser
                    )}
                  </h2>

                  <p>
                    Consumer ID:{" "}
                    {selectedUser.id}
                  </p>

                </div>

              </div>


              <div className="consumer-details">

                <div className="consumer-detail-item">

                  <Mail size={17} />

                  <div>

                    <span>
                      Email
                    </span>

                    <strong>
                      {selectedUser.email}
                    </strong>

                  </div>

                </div>


                <div className="consumer-detail-item">

                  <Phone size={17} />

                  <div>

                    <span>
                      Phone
                    </span>

                    <strong>
                      {selectedUser.phone || "—"}
                    </strong>

                  </div>

                </div>


                <div className="consumer-detail-item">

                  <MapPin size={17} />

                  <div>

                    <span>
                      Address
                    </span>

                    <strong>
                      {selectedUser.address || "—"}
                    </strong>

                  </div>

                </div>


                <div className="consumer-detail-item">

                  <Shield size={17} />

                  <div>

                    <span>
                      Role
                    </span>

                    <strong>
                      {["customer", "viewer", "staff", "user"].includes(selectedUser.role?.toLowerCase())
                        ? "Viewer / Customer"
                        : selectedUser.role}
                    </strong>

                  </div>

                </div>


                <div className="consumer-detail-item">

                  <Calendar size={17} />

                  <div>

                    <span>
                      Registered
                    </span>

                    <strong>
                      {formatDate(
                        selectedUser.created_at
                      )}
                    </strong>

                  </div>

                </div>

              </div>


              <button
                className="consumer-close-button"
                onClick={() =>
                  setShowViewModal(false)
                }
              >
                Close
              </button>

            </div>

          </div>

        )}


      {/* =================================================
          CREATE / EDIT MODAL
      ================================================= */}

      {showFormModal && (

        <div className="consumer-modal-overlay">

          <div className="consumer-modal form-modal">

            <button
              className="consumer-modal-close"
              disabled={saving}
              onClick={() => {

                if (!saving) {

                  setShowFormModal(false);

                  setEditingUser(null);

                  resetForm();

                }

              }}
            >

              <X size={18} />

            </button>


            <div className="consumer-form-header">

              <div className="consumer-form-title-icon">

                {editingUser ? (

                  <Edit size={20} />

                ) : (

                  <User size={20} />

                )}

              </div>


              <div>

                <h2>

                  {editingUser

                    ? "Edit Consumer"

                    : "Create Consumer Account"

                  }

                </h2>


                <p>

                  {editingUser

                    ? "Update consumer information."

                    : "Create a new Customer Sphere account."

                  }

                </p>

              </div>

            </div>


            {/* FORM ERROR */}

            {formError && (

              <div className="consumer-form-error">

                {formError}

              </div>

            )}


            <form
              onSubmit={handleSaveUser}
            >

              {/* =================================================
                  ROLE
              ================================================= */}

              <div className="consumer-form-field">

                <label>
                  Role
                </label>

                <select
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  required
                >

                  <option value="customer">
                    Viewer / Customer
                  </option>

                  <option value="manager">
                    Manager
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                </select>

              </div>


              {/* =================================================
                  FULL NAME
              ================================================= */}

              <div className="consumer-form-field">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Enter full name"
                  required
                />

              </div>


              {/* =================================================
                  EMAIL
              ================================================= */}

              <div className="consumer-form-field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="Enter email address"
                  required
                />

              </div>


              {/* =================================================
                  PHONE
              ================================================= */}

              <div className="consumer-form-field">

                <label>
                  Phone Number
                </label>

                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  name="phone"
                  value={form.phone}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 10);
                    setForm((previous) => ({ ...previous, phone: digits }));
                    setFormError("");
                  }}
                  placeholder="Enter phone number"
                  required
                />

              </div>


              {/* =================================================
                  ADDRESS
              ================================================= */}

              <div className="consumer-form-field">

                <label>

                  Address{" "}

                  <span>
                    (Optional)
                  </span>

                </label>

                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="Enter address"
                  rows="2"
                />

              </div>


              {/* =================================================
                  PASSWORD
              ================================================= */}

              <div className="consumer-form-field">

                <label>

                  Password

                  {editingUser && (

                    <span>
                      {" "}(Optional)
                    </span>

                  )}

                </label>

                <div className="consumer-password-input">

                  <Lock size={15} />

                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder={
                      editingUser
                        ? "Enter new password"
                        : "Enter password"
                    }
                    required={!editingUser}
                  />

                </div>

              </div>


              {/* =================================================
                  CONFIRM PASSWORD
              ================================================= */}

              <div className="consumer-form-field">

                <label>

                  Confirm Password

                  {editingUser && (

                    <span>
                      {" "}(Optional)
                    </span>

                  )}

                </label>

                <div className="consumer-password-input">

                  <Lock size={15} />

                  <input
                    type="password"
                    name="confirm_password"
                    value={
                      form.confirm_password
                    }
                    onChange={handleFormChange}
                    placeholder="Confirm password"
                    required={!editingUser}
                  />

                </div>

              </div>


              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="consumer-form-actions">

                <button
                  type="button"
                  className="consumer-cancel-button"
                  disabled={saving}
                  onClick={() => {

                    setShowFormModal(false);

                    setEditingUser(null);

                    resetForm();

                  }}
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="consumer-save-button"
                  disabled={saving}
                >

                  {saving

                    ? "Saving..."

                    : editingUser

                      ? "Update Consumer"

                      : "Create Account"

                  }

                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =================================================
          DELETE MODAL
      ================================================= */}

      {showDeleteModal &&
        selectedUser && (

          <div className="consumer-modal-overlay">

            <div className="consumer-modal delete-modal">

              <button
                className="consumer-modal-close"
                onClick={() =>
                  setShowDeleteModal(false)
                }
              >

                <X size={18} />

              </button>


              <div className="delete-warning-icon">

                <Trash2 size={24} />

              </div>


              <h2>
                Delete Consumer?
              </h2>


              <p>

                Are you sure you want to
                delete{" "}

                <strong>
                  {getFullName(
                    selectedUser
                  )}
                </strong>

                ?

              </p>


              <div className="consumer-form-actions">

                <button
                  type="button"
                  className="consumer-cancel-button"
                  disabled={deleting}
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="button"
                  className="consumer-delete-confirm"
                  disabled={deleting}
                  onClick={
                    handleDeleteUser
                  }
                >

                  {deleting
                    ? "Deleting..."
                    : "Delete Consumer"}

                </button>

              </div>

            </div>

          </div>

        )}

    </div>

  );

}


export default RegisteredUsers;
