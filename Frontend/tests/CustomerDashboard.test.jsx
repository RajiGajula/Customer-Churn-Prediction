import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import CustomerDashboard from "../src/pages/CustomerDashboard";
import { getCustomerProfile } from "../src/services/authApi";
import { getOrders } from "../src/services/ordersApi";

vi.mock("../src/services/authApi", () => ({
  getCustomerProfile: vi.fn(),
}));

vi.mock("../src/services/ordersApi", () => ({
  getOrders: vi.fn(),
}));

vi.mock("../src/components/CustomerOrderDialog", () => ({
  default: () => null,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("CustomerDashboard loading", () => {
  it("shows profile as soon as it loads without waiting for recent orders", async () => {
    let resolveOrders;
    getCustomerProfile.mockResolvedValue({
      profile_id: 12,
      name: "Jamie Customer",
      email: "jamie@example.com",
      phone: null,
      address: null,
      city: "City",
      state: "SP",
    });
    getOrders.mockReturnValue(new Promise((resolve) => {
      resolveOrders = resolve;
    }));

    render(
      <MemoryRouter>
        <CustomerDashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Jamie Customer" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("Loading recent orders");

    resolveOrders({ data: [], total: 0 });
  });
});
