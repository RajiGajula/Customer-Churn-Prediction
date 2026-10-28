import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import Signup from "../src/pages/Signup";
import { signup } from "../src/services/authApi";

vi.mock("../src/services/authApi", () => ({
  signup: vi.fn(),
}));

function CurrentPath() {
  return <p>Current path: {useLocation().pathname}</p>;
}

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

function fillSignupForm({
  name = "Jamie Customer",
  phone = "5550100123",
  password = "password123",
  confirmPassword = password,
} = {}) {
  fireEvent.change(screen.getByPlaceholderText("Enter your full name"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
    target: { value: "jamie@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your phone number"), {
    target: { value: phone },
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your address"), {
    target: { value: "1 Main Street" },
  });
  fireEvent.change(screen.getByPlaceholderText("Create a password"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByPlaceholderText("Confirm your password"), {
    target: { value: confirmPassword },
  });
}

describe("Signup page", () => {
  it.each([
    [{ name: " " }, "Full name is required."],
    [{ phone: "12345678901" }, "Phone number must contain exactly 10 digits."],
    [{ phone: "123456789" }, "Phone number must contain exactly 10 digits."],
    [{ phone: "12345abc90" }, "Phone number must contain exactly 10 digits."],
    [{ password: "" }, "Password is required."],
    [{ password: "short" }, "Password must be at least 8 characters."],
    [{ password: "password123", confirmPassword: "different123" }, "Passwords do not match."],
  ])("validates signup fields before sending a request", (options, errorMessage) => {
    const { container } = renderSignup();
    fillSignupForm(options);
    fireEvent.submit(container.querySelector("form"));

    expect(container.querySelector(".signup-error span").textContent).toBe(errorMessage);
    expect(signup).not.toHaveBeenCalled();
  });

  it("submits trimmed values and shows a success message", async () => {
    signup.mockResolvedValue({ message: "created" });
    renderSignup();
    fillSignupForm({ name: "  Jamie Customer  " });
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Account created successfully. Redirecting to login...")).toBeTruthy();
    expect(signup).toHaveBeenCalledWith("Jamie Customer", "jamie@example.com", "password123", {
      phone: "5550100123",
      address: "1 Main Street",
    });
  });

  it("redirects to login after successful account creation", async () => {
    vi.useFakeTimers();
    signup.mockResolvedValue({});
    renderSignup();
    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByText("Account created successfully. Redirecting to login...")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByText("Current path: /login")).toBeTruthy();
  });

  it("shows the API error and permits another submission", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    signup.mockRejectedValue(new Error("Email is already registered."));
    renderSignup();
    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Email is already registered.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create Account" }).disabled).toBe(false);
    consoleError.mockRestore();
  });

  it("toggles password and confirmation visibility", () => {
    renderSignup();
    const password = screen.getByPlaceholderText("Create a password");
    const confirmation = screen.getByPlaceholderText("Confirm your password");

    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(password.type).toBe("text");
    fireEvent.click(screen.getAllByRole("button")[1]);
    expect(confirmation.type).toBe("text");
  });
});
