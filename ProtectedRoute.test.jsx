import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import ProtectedRoute from "../src/components/ProtectedRoute";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("customer route access", () => {
  it.each(["/reports", "/reviews", "/geography"])(
    "redirects customer accounts away from %s",
    (path) => {
      localStorage.setItem("access_token", "customer-token");
      localStorage.setItem("role", "customer");

      render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path={path}
              element={
                <ProtectedRoute>
                  <p>Restricted customer data</p>
                </ProtectedRoute>
              }
            />
            <Route path="/dashboard" element={<p>Customer dashboard</p>} />
          </Routes>
        </MemoryRouter>,
      );

      expect(screen.getByText("Customer dashboard")).toBeTruthy();
      expect(screen.queryByText("Restricted customer data")).toBeNull();
    },
  );

  it("redirects unauthenticated users to login", () => {
    render(
      <MemoryRouter initialEntries={["/reports"]}>
        <Routes>
          <Route
            path="/reports"
            element={<ProtectedRoute><p>Restricted content</p></ProtectedRoute>}
          />
          <Route path="/login" element={<p>Login page</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login page")).toBeTruthy();
    expect(screen.queryByText("Restricted content")).toBeNull();
  });

  it("redirects non-admin users away from admin-only routes", () => {
    localStorage.setItem("access_token", "manager-token");
    localStorage.setItem("role", "manager");

    render(
      <MemoryRouter initialEntries={["/churn-prediction"]}>
        <Routes>
          <Route
            path="/churn-prediction"
            element={<ProtectedRoute adminOnly><p>Admin analytics</p></ProtectedRoute>}
          />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard")).toBeTruthy();
    expect(screen.queryByText("Admin analytics")).toBeNull();
  });

  it("allows authenticated admins into admin-only routes", () => {
    localStorage.setItem("access_token", "admin-token");
    localStorage.setItem("role", "admin");

    render(
      <MemoryRouter initialEntries={["/churn-prediction"]}>
        <Routes>
          <Route
            path="/churn-prediction"
            element={<ProtectedRoute adminOnly><p>Admin analytics</p></ProtectedRoute>}
          />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin analytics")).toBeTruthy();
  });

  it("allows authenticated managers to view customer profiles", () => {
    localStorage.setItem("access_token", "manager-token");
    localStorage.setItem("role", "manager");

    render(
      <MemoryRouter initialEntries={["/consumer-profiles"]}>
        <Routes>
          <Route
            path="/consumer-profiles"
            element={<ProtectedRoute><p>Consumer profiles</p></ProtectedRoute>}
          />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Consumer profiles")).toBeTruthy();
  });
});
