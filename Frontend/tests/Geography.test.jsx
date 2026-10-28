import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Geography from "../src/pages/Geography";
import {
  getGeography,
  getGeographyStates,
  getGeographySummary,
} from "../src/services/geographyApi";

vi.mock("../src/services/geographyApi", () => ({
  getGeography: vi.fn(),
  getGeographyStates: vi.fn(),
  getGeographySummary: vi.fn(),
}));

const locationRows = [
  {
    zip_code: "01000",
    city: "Sao Paulo",
    state: "SP",
    latitude: -23.5,
    longitude: -46.6,
  },
  {
    zip_code: "20000",
    city: "Rio de Janeiro",
    state: "RJ",
    latitude: -22.9,
    longitude: -43.2,
  },
];

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Geography page filters", () => {
  it("loads locations and filters by selected state", async () => {
    getGeography.mockImplementation(({ state = "" } = {}) => {
      const rows = state
        ? locationRows.filter((location) => location.state === state)
        : locationRows;
      return Promise.resolve({
        data: rows,
        total: rows.length,
        total_pages: 1,
      });
    });
    getGeographyStates.mockResolvedValue([
      { state: "SP", locations: 1, cities: 1 },
      { state: "RJ", locations: 1, cities: 1 },
    ]);
    getGeographySummary.mockResolvedValue({
      total_locations: 2,
      total_states: 2,
      total_cities: 2,
    });

    render(<Geography />);

    await screen.findByText("Sao Paulo");
    await screen.findByRole("option", { name: "SP" });
    fireEvent.change(screen.getByRole("combobox", { name: "Filter by state" }), {
      target: { value: "SP" },
    });

    await waitFor(() => {
      expect(getGeography).toHaveBeenLastCalledWith(
        expect.objectContaining({ state: "SP", page: 1 }),
      );
    });
    expect(await screen.findByText("Sao Paulo")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText("Rio de Janeiro")).toBeNull();
    });
  });

  it("passes the selected ordering to the locations request", async () => {
    getGeography.mockResolvedValue({
      data: locationRows,
      total: locationRows.length,
      total_pages: 1,
    });
    getGeographyStates.mockResolvedValue([
      { state: "SP", locations: 1, cities: 1 },
      { state: "RJ", locations: 1, cities: 1 },
    ]);
    getGeographySummary.mockResolvedValue({
      total_locations: 2,
      total_states: 2,
      total_cities: 2,
    });

    render(<Geography />);
    await screen.findByText("Sao Paulo");
    fireEvent.change(screen.getByRole("combobox", { name: "Sort geographic locations" }), {
      target: { value: "city:desc" },
    });

    await waitFor(() => {
      expect(getGeography).toHaveBeenLastCalledWith(
        expect.objectContaining({
          sortBy: "city",
          sortDirection: "desc",
          page: 1,
        }),
      );
    });
  });

  it("uses state distribution cards as state filters", async () => {
    getGeography.mockResolvedValue({
      data: locationRows,
      total: locationRows.length,
      total_pages: 1,
    });
    getGeographyStates.mockResolvedValue([
      { state: "SP", locations: 1, cities: 1 },
      { state: "RJ", locations: 1, cities: 1 },
    ]);
    getGeographySummary.mockResolvedValue({
      total_locations: 2,
      total_states: 2,
      total_cities: 2,
    });

    render(<Geography />);
    const stateFilterCard = await screen.findByRole("button", {
      name: "Filter locations by state SP",
    });
    fireEvent.click(stateFilterCard);

    await waitFor(() => {
      expect(stateFilterCard.getAttribute("aria-pressed")).toBe("true");
      expect(getGeography).toHaveBeenLastCalledWith(
        expect.objectContaining({ state: "SP", page: 1 }),
      );
    });
  });
});
