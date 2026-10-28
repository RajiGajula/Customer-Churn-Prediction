import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";

import ConsumerProfiles from "../src/pages/ConsumerProfiles";
import { reorder } from "../src/services/ordersApi";

vi.mock("../src/services/ordersApi", () => ({
  reorder: vi.fn(),
}));

const baseProfile = {
  profile_id: 7,
  consumer_id: "CNS-7",
  name: "Jamie Customer",
  email: "jamie@example.com",
  phone: "555-0100",
  address: "1 Main Street",
  city: "Sao Paulo",
  state: "SP",
  interests: ["books", "travel"],
  notes: "Prefers email",
  order_count: 2,
  lifetime_spend: 240,
  segments: ["repeat"],
};

function response(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

function configureFetch({ profiles = [baseProfile], activityCustomer = null, overrides = {} } = {}) {
  vi.stubGlobal("fetch", vi.fn(async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/feedback-sentiment/summary")) {
      return response({ totals: [], daily_trend: [] });
    }
    if (path.endsWith("/activity")) {
      return response({
        customer: activityCustomer,
        orders: [],
        predictions: [],
      });
    }
    if (path.endsWith("/interactions")) return response({ interactions: [] });
    if (path.endsWith("/feedback")) return response({ feedback: [] });
    if (path.endsWith("/timeline")) return response({ timeline: [], total_pages: 1 });
    if (path.endsWith("/consumer-profiles") && options.method === "POST") {
      return response(overrides.createdProfile || baseProfile, 201);
    }
    if (path.endsWith("/consumer-profiles/7") && options.method === "PATCH") {
      return response({ ...baseProfile, ...JSON.parse(options.body) });
    }
    if (path.endsWith("/consumer-profiles/7") && options.method === "DELETE") {
      return response(null, 204);
    }
    if (path.endsWith("/consumer-profiles")) {
      if (overrides.listError) return response({ detail: overrides.listError }, 500);
      const requestUrl = new URL(url);
      const filteredProfiles = requestUrl.searchParams.get("search")
        ? []
        : profiles;
      return response({
        profiles: filteredProfiles,
        total: filteredProfiles.length,
        total_pages: 1,
      });
    }
    return response({});
  }));
}

function renderProfiles() {
  return render(
    <MemoryRouter>
      <ConsumerProfiles />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.setItem("role", "admin");
  configureFetch();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("ConsumerProfiles page", () => {
  it("shows the loading state while the profile list request is pending", async () => {
    let resolveList;
    vi.stubGlobal("fetch", vi.fn((url) => {
      const path = new URL(url).pathname;
      if (path.endsWith("/feedback-sentiment/summary")) {
        return Promise.resolve(response({ totals: [], daily_trend: [] }));
      }
      return new Promise((resolve) => {
        resolveList = () => resolve(response({ profiles: [], total: 0, total_pages: 0 }));
      });
    }));

    renderProfiles();
    expect(screen.getByText("Loading profiles…")).toBeTruthy();
    resolveList();
    expect(await screen.findByText("No consumer profiles yet")).toBeTruthy();
  });

  it("renders list contact details, location, spend, and segments", async () => {
    renderProfiles();

    expect(await screen.findByText("Jamie Customer")).toBeTruthy();
    expect(screen.getByText("Sao Paulo, SP")).toBeTruthy();
    expect(screen.getByRole("row", { name: /Jamie Customer/ }).textContent).toContain("240,00");
    expect(screen.getByText("repeat")).toBeTruthy();
    expect(screen.getByText("books, travel")).toBeTruthy();
  });

  it("shows an empty state when there are no profiles", async () => {
    configureFetch({ profiles: [] });
    renderProfiles();

    expect(await screen.findByText("No consumer profiles yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create first profile" })).toBeTruthy();
  });

  it("shows the API error if the profile list cannot be loaded", async () => {
    configureFetch({ overrides: { listError: "The profile service is unavailable." } });
    renderProfiles();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("The profile service is unavailable.")).toBeTruthy();
  });

  it("submits trimmed search terms and renders the no-match message", async () => {
    renderProfiles();
    await screen.findByText("Jamie Customer");
    const searchInput = screen.getByRole("textbox", {
      name: "Search consumer profiles",
    });
    fireEvent.change(searchInput, { target: { value: "  nobody  " } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => {
      const matchingRequest = globalThis.fetch.mock.calls
        .map(([url]) => new URL(url))
        .some((url) => url.pathname.endsWith("/consumer-profiles") && url.searchParams.get("search") === "nobody");
      expect(matchingRequest).toBe(true);
    });
    expect(await screen.findByText("No profiles match this search")).toBeTruthy();
  });

  it("displays activity-provided location alongside the same profile in the list", async () => {
    const matchingLocationProfile = { ...baseProfile, city: "Rio de Janeiro", state: "RJ" };
    configureFetch({
      profiles: [matchingLocationProfile],
      activityCustomer: matchingLocationProfile,
    });
    renderProfiles();

    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));

    await waitFor(() => expect(screen.getAllByText("Rio de Janeiro, RJ")).toHaveLength(2));
    expect(screen.getAllByText("Rio de Janeiro, RJ")).toHaveLength(2);
  });

  it("allows admins to create profiles and sends normalized fields", async () => {
    const createdProfile = { ...baseProfile, profile_id: 8, name: "New Customer" };
    configureFetch({ overrides: { createdProfile } });
    renderProfiles();
    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "New profile" }));

    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "  New Customer  " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: " new@example.com " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "City" }), {
      target: { value: " Sao Paulo " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "State" }), {
      target: { value: " SP " },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Interests / preferences" }), {
      target: { value: " books, travel " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create profile" }));

    await waitFor(() => {
      const createRequest = globalThis.fetch.mock.calls.find(
        ([url, options]) => new URL(url).pathname.endsWith("/consumer-profiles") && options.method === "POST",
      );
      expect(createRequest).toBeTruthy();
      expect(JSON.parse(createRequest[1].body)).toEqual(expect.objectContaining({
        name: "New Customer",
        email: "new@example.com",
        city: "Sao Paulo",
        state: "SP",
        interests: ["books", "travel"],
      }));
    });
  });

  it("limits profile phone numbers to 10 digits", async () => {
    renderProfiles();
    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "New profile" }));

    const phoneInput = screen.getByRole("textbox", { name: "Phone" });
    expect(phoneInput.getAttribute("maxLength")).toBe("10");
    fireEvent.change(phoneInput, { target: { value: "12345678901234" } });
    expect(phoneInput.value).toBe("1234567890");
  });

  it("allows admins to edit a profile and sends the changed fields", async () => {
    renderProfiles();
    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "Edit Jamie Customer" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Full name" }), {
      target: { value: "Jamie Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      const updateRequest = globalThis.fetch.mock.calls.find(
        ([url, options]) => new URL(url).pathname.endsWith("/consumer-profiles/7") && options.method === "PATCH",
      );
      expect(updateRequest).toBeTruthy();
      expect(JSON.parse(updateRequest[1].body).name).toBe("Jamie Updated");
    });
  });

  it("deletes a profile after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    renderProfiles();
    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "Delete Jamie Customer" }));

    await waitFor(() => {
      expect(globalThis.fetch.mock.calls.some(
        ([url, options]) => new URL(url).pathname.endsWith("/consumer-profiles/7") && options.method === "DELETE",
      )).toBe(true);
    });
  });

  it("does not delete a profile when confirmation is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    renderProfiles();
    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "Delete Jamie Customer" }));

    expect(globalThis.fetch.mock.calls.some(([, options]) => options.method === "DELETE")).toBe(false);
  });

  it("allows admins to record a customer interaction", async () => {
    renderProfiles();
    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    await screen.findByRole("heading", { name: "Log interaction" });
    fireEvent.change(screen.getByRole("textbox", { name: "Subject" }), {
      target: { value: "Delivery follow-up" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Details" }), {
      target: { value: "Confirmed delivery with the customer." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      const interactionRequest = globalThis.fetch.mock.calls.find(
        ([url, options]) => new URL(url).pathname.endsWith("/consumer-profiles/7/interactions") && options.method === "POST",
      );
      expect(interactionRequest).toBeTruthy();
      expect(JSON.parse(interactionRequest[1].body)).toEqual(expect.objectContaining({
        subject: "Delivery follow-up",
        details: "Confirmed delivery with the customer.",
        interaction_type: "support_request",
        channel: "phone",
      }));
    });
  });

  it("does not show admin-only profile actions to a manager", async () => {
    localStorage.setItem("role", "manager");
    renderProfiles();

    await screen.findByText("Jamie Customer");
    expect(screen.queryByRole("button", { name: "New profile" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Edit Jamie Customer" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete Jamie Customer" })).toBeNull();
  });

  it("reorders eligible customer orders for managers", async () => {
    localStorage.setItem("role", "manager");
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      const path = new URL(url).pathname;
      if (path.endsWith("/feedback-sentiment/summary")) return response({ totals: [], daily_trend: [] });
      if (path.endsWith("/activity")) {
        return response({
          orders: [{
            order_id: "order-1",
            order_amount: 85,
            order_purchase_timestamp: "2026-01-05T10:00:00Z",
            order_status: "delivered",
            can_reorder: true,
          }],
          predictions: [],
        });
      }
      if (path.endsWith("/interactions")) return response({ interactions: [] });
      if (path.endsWith("/feedback")) return response({ feedback: [] });
      if (path.endsWith("/timeline")) return response({ timeline: [], total_pages: 1 });
      return response({ profiles: [baseProfile], total: 1, total_pages: 1 });
    }));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    reorder.mockResolvedValue({ new_order_id: "order-2" });
    renderProfiles();

    await screen.findByText("Jamie Customer");
    fireEvent.click(screen.getByRole("button", { name: "Activity" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reorder items" }));

    await waitFor(() => expect(reorder).toHaveBeenCalledWith("order-1"));
    expect(await screen.findByText(/Reorder created: order-2/)).toBeTruthy();
  });
});
