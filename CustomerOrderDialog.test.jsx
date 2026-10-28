import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CustomerOrderDialog from "../src/components/CustomerOrderDialog";
import { getOrderCatalog } from "../src/services/productsApi";
import { placeCustomerOrder } from "../src/services/ordersApi";

vi.mock("../src/services/productsApi", () => ({
  getOrderCatalog: vi.fn(),
}));

vi.mock("../src/services/ordersApi", () => ({
  placeCustomerOrder: vi.fn(),
}));

const catalogProduct = {
  product_id: "product-1",
  category: "books",
  unit_price: 88,
  unit_freight: 11.95,
};

beforeEach(() => {
  getOrderCatalog.mockImplementation(({ search }) => Promise.resolve({
    products: search ? [] : [catalogProduct],
  }));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CustomerOrderDialog", () => {
  it("keeps the selected-item estimate when the catalog results change", async () => {
    render(<CustomerOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add" }));
    expect(screen.getByText("Est. $99.95")).toBeTruthy();

    fireEvent.change(screen.getByRole("textbox", { name: "Search products" }), {
      target: { value: "no matching product" },
    });

    await screen.findByText("No matching products are available.");
    expect(screen.getByText("Est. $99.95")).toBeTruthy();
  });

  it("sends only product IDs and quantities when placing the order", async () => {
    placeCustomerOrder.mockResolvedValue({ order: { order_id: "order-1" } });
    render(<CustomerOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);

    fireEvent.click(await screen.findByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Delivery ZIP code" }), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "City" }), {
      target: { value: "City" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "State code" }), {
      target: { value: "SP" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    await waitFor(() => {
      expect(placeCustomerOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          order_items: [{ product_id: "product-1", quantity: 1 }],
        }),
      );
    });
  });

  it("increments and removes selected quantities while updating the estimate", async () => {
    render(<CustomerOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Add" }));

    expect(screen.getByText("1 item")).toBeTruthy();
    expect(screen.getByText("Est. $99.95")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add one" }));
    expect(screen.getByText("2 items")).toBeTruthy();
    expect(screen.getByText("Est. $199.90")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Remove one" }));
    expect(screen.getByText("1 item")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Remove one" }));
    expect(screen.getByText("0 items")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove one" })).toBeNull();
  });

  it("shows catalog errors and prevents placing an order", async () => {
    getOrderCatalog.mockRejectedValueOnce(new Error("Catalog unavailable."));
    render(<CustomerOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);

    expect((await screen.findByRole("alert")).textContent).toContain("Catalog unavailable.");
    expect(screen.getByRole("button", { name: "Place order" }).disabled).toBe(true);
  });

  it("shows order submission errors and allows retrying", async () => {
    placeCustomerOrder.mockRejectedValueOnce(new Error("Delivery address is invalid."));
    render(<CustomerOrderDialog onClose={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.click(await screen.findByRole("button", { name: "Add" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Delivery ZIP code" }), {
      target: { value: "12345" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "City" }), {
      target: { value: "City" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "State code" }), {
      target: { value: "SP" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place order" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Delivery address is invalid.");
    expect(screen.getByRole("button", { name: "Place order" }).disabled).toBe(false);
    expect(placeCustomerOrder).toHaveBeenCalledTimes(1);
  });

  it("initializes delivery city and state from the customer profile", async () => {
    render(
      <CustomerOrderDialog
        initialProfile={{ city: "Sao Paulo", state: "SP" }}
        onClose={vi.fn()}
        onCreated={vi.fn()}
      />,
    );

    const cityInput = await screen.findByRole("textbox", { name: "City" });
    expect(cityInput.value).toBe("Sao Paulo");
    expect(screen.getByRole("textbox", { name: "State code" }).value).toBe("SP");
  });
});
