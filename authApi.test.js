import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getRole, getToken, login, logout, saveAuth, signup } from "../src/services/authApi";

function jsonResponse(data, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  };
}

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("auth API", () => {
  it("sends normalized login credentials and returns the response", async () => {
    const data = { access_token: "token-123", role: "admin" };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(data)));

    await expect(login("  admin@example.com ", "password")).resolves.toEqual(data);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/login$/),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@example.com", password: "password" }),
      }),
    );
  });

  it("sends optional signup profile fields together with account credentials", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ id: 4 })));

    await expect(signup("Jamie", "jamie@example.com", "secret123", {
      phone: "555-0100",
      address: "1 Main Street",
    })).resolves.toEqual({ id: 4 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth\/signup$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          phone: "555-0100",
          address: "1 Main Street",
          name: "Jamie",
          email: "jamie@example.com",
          password: "secret123",
        }),
      }),
    );
  });

  it.each([
    [{ detail: "Email already exists." }, "Email already exists."],
    [{ detail: { message: "Validation failed." } }, "Validation failed."],
    [{ detail: [{ loc: ["body", "email"], msg: "Invalid email" }] }, "Email: Invalid email"],
  ])("converts backend signup errors into readable errors", async (body, expectedMessage) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(body, { ok: false, status: 400 })));

    await expect(signup("Jamie", "bad-email", "secret123")).rejects.toThrow(expectedMessage);
  });

  it("translates network failures into backend connection guidance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(login("jamie@example.com", "secret")).rejects.toThrow(
      "Unable to connect to the backend. Please make sure the FastAPI server is running.",
    );
  });

  it("stores only provided authentication fields and exposes token and role getters", () => {
    saveAuth({
      access_token: "token-123",
      token_type: "bearer",
      role: "admin",
      name: "Jamie",
      username: "jamie",
      email: "jamie@example.com",
    });

    expect(getToken()).toBe("token-123");
    expect(getRole()).toBe("admin");
    expect(localStorage.getItem("token_type")).toBe("bearer");
    expect(localStorage.getItem("name")).toBe("Jamie");

    saveAuth({ role: "manager" });
    expect(getToken()).toBe("token-123");
    expect(getRole()).toBe("manager");
  });

  it("clears stored authentication and remember-me data on logout", () => {
    saveAuth({
      access_token: "token-123",
      token_type: "bearer",
      role: "admin",
      name: "Jamie",
      username: "jamie",
      email: "jamie@example.com",
    });
    localStorage.setItem("user", "{}");
    localStorage.setItem("currentUser", "{}");
    localStorage.setItem("rememberMe", "true");

    logout();

    expect(getToken()).toBeNull();
    expect(getRole()).toBeNull();
    for (const key of ["token_type", "name", "username", "email", "user", "currentUser", "rememberMe"]) {
      expect(localStorage.getItem(key)).toBeNull();
    }
  });
});
