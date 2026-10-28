import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";

import Login from "../src/pages/Login";
import { login, saveAuth } from "../src/services/authApi";

vi.mock("../src/services/authApi", () => ({
  login: vi.fn(),
  saveAuth: vi.fn(),
}));

function CurrentPath() {
  return <p>Current path: {useLocation().pathname}</p>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<CurrentPath />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("Login page", () => {
  it("does not expose a forgot-password flow", () => {
    renderLogin();

    expect(screen.queryByText(/forgot password/i)).toBeNull();
    expect(screen.queryByRole("link", { name: /forgot/i })).toBeNull();
  });

  it("validates required fields without calling the login API", () => {
    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(screen.getByText("Please enter your email and password.")).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  });

  it("normalizes user data, saves auth, and navigates after a successful login", async () => {
    login.mockResolvedValue({
      access_token: "session-token",
      user: {
        name: "Jamie Customer",
        email: "jamie@example.com",
        role: "viewer",
      },
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: " jamie@example.com " },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "correct horse battery staple" },
    });
    fireEvent.click(screen.getByRole("checkbox", { name: /remember me/i }));
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText("Current path: /dashboard")).toBeTruthy();
    expect(login).toHaveBeenCalledWith("jamie@example.com", "correct horse battery staple");
    expect(saveAuth).toHaveBeenCalledWith(expect.objectContaining({ access_token: "session-token" }));
    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      name: "Jamie Customer",
      email: "jamie@example.com",
      role: "customer",
    });
    expect(localStorage.getItem("role")).toBe("customer");
    expect(localStorage.getItem("rememberMe")).toBe("true");
  });

  it("uses the email prefix when the login response has no name", async () => {
    login.mockResolvedValue({ role: "admin" });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await screen.findByText("Current path: /dashboard");
    expect(JSON.parse(localStorage.getItem("user"))).toEqual({
      name: "alex",
      email: "alex@example.com",
      role: "admin",
    });
  });

  it.each([
    [{ response: { data: { detail: "Invalid credentials." } } }, "Invalid credentials."],
    [{ response: { data: { message: "Account locked." } } }, "Account locked."],
    [{ detail: "Please try again." }, "Please try again."],
    [new Error("Network unavailable."), "Network unavailable."],
  ])("shows a readable login error for supported error shapes", async (error, message) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    login.mockRejectedValue(error);
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "jamie@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByRole("button", { name: /login/i }).disabled).toBe(false);
    consoleError.mockRestore();
  });

  it("toggles password visibility and clears an error when typing resumes", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    login.mockRejectedValue(new Error("Invalid credentials."));
    renderLogin();
    const password = screen.getByPlaceholderText("Enter your password");
    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "jamie@example.com" },
    });
    fireEvent.change(password, { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    await screen.findByText("Invalid credentials.");

    fireEvent.click(screen.getByRole("button", { name: "Show password" }));
    expect(password.type).toBe("text");
    fireEvent.change(password, { target: { value: "correct" } });
    expect(screen.queryByText("Invalid credentials.")).toBeNull();
    consoleError.mockRestore();
  });

  it("removes the remember-me flag when the option is unchecked", async () => {
    localStorage.setItem("rememberMe", "true");
    login.mockResolvedValue({ user: { email: "jamie@example.com", role: "customer" } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
      target: { value: "jamie@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await screen.findByText("Current path: /dashboard");
    expect(localStorage.getItem("rememberMe")).toBeNull();
  });
});
