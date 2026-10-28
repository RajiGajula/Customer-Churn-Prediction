import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import Orders from "../src/pages/Orders";
import {
  getOrder,
  getOrderStatuses,
  getOrders,
  submitOrderFeedback,
} from "../src/services/ordersApi";
import { getCustomerProfile } from "../src/services/authApi";

vi.mock("../src/services/ordersApi", () => ({
  getOrder: vi.fn(),
  getOrderStatuses: vi.fn(),
  getOrders: vi.fn(),
  cancelOrder: vi.fn(),
  markOrderDelivered: vi.fn(),
  reorder: vi.fn(),
  submitOrderFeedback: vi.fn(),
}));

vi.mock("../src/services/authApi", () => ({
  getCustomerProfile: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Orders feedback submission", () => {
  it("shows loading only on feedback and skips the redundant order reload", async () => {
    localStorage.setItem("role", "customer");
    getOrders.mockResolvedValue({
      data: [{ order_id: "delivered-order", customer_id: "customer-1" }],
      total: 1,
      total_pages: 1,
    });
    getOrderStatuses.mockResolvedValue([]);
    getCustomerProfile.mockResolvedValue({ profile_id: 7, name: "Jamie" });
    getOrder.mockResolvedValue({
      order: {
        order_id: "delivered-order",
        order_status: "delivered",
        can_leave_feedback: true,
        can_reorder: true,
        is_app_created_customer: true,
      },
      items: [],
      payments: [],
      reviews: [],
    });

    let resolveFeedback;
    submitOrderFeedback.mockReturnValue(new Promise((resolve) => {
      resolveFeedback = resolve;
    }));

    render(
      <MemoryRouter>
        <Orders />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "View" }));
    const feedbackButton = await screen.findByRole("button", { name: "Submit feedback" });
    fireEvent.click(feedbackButton);
    fireEvent.click(feedbackButton);

    expect(await screen.findByRole("button", { name: "Submitting..." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reorder items" }).textContent).toContain("Reorder items");
    expect(screen.queryByRole("button", { name: "Working..." })).toBeNull();
    expect(submitOrderFeedback).toHaveBeenCalledTimes(1);

    resolveFeedback({ prediction_refresh_status: "queued" });
    expect((await screen.findByRole("status")).textContent).toContain(
      "churn prediction is refreshing",
    );
    await waitFor(() => expect(screen.getByText("Feedback has already been submitted for this order.")).toBeTruthy());
    expect(getOrder).toHaveBeenCalledTimes(1);
  });
});
