import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import { api } from "../lib/api";
import type { User } from "../types";

vi.mock("../lib/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

const testUser: User = {
  id: "u1",
  email: "user@example.com",
  username: "tester",
  createdAt: new Date().toISOString(),
};

const Harness = () => {
  const { user, loading, login, logout } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : "none"}</span>
      <button onClick={() => login(testUser, "tok-remember", true)}>login-remember</button>
      <button onClick={() => login(testUser, "tok-session", false)}>login-session</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
};

const waitForReady = async () =>
  waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("throws when useAuth is called outside of an AuthProvider", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<Harness />)).toThrow("useAuth must be used within AuthProvider");

    consoleErrorSpy.mockRestore();
  });

  it("with no token stored: isn't loading, has no user, and never calls the API", async () => {
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitForReady();

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it("with a stored token: fetches the profile and sets the user on success", async () => {
    localStorage.setItem("token", "existing-token");
    mockedApi.get.mockResolvedValueOnce({ user: testUser });

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitForReady();

    expect(mockedApi.get).toHaveBeenCalledWith("/users/me");
    expect(screen.getByTestId("user").textContent).toBe("tester");
  });

  it("with a stored token that fails to resolve: clears stored auth state and keeps user null", async () => {
    localStorage.setItem("token", "bad-token");
    sessionStorage.setItem("token", "bad-session-token");
    mockedApi.get.mockRejectedValueOnce(new Error("unauthorized"));

    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );

    await waitForReady();

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });

  it("login(keep=true) persists the token to localStorage (not sessionStorage) and updates state", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitForReady();

    await user.click(screen.getByText("login-remember"));

    expect(localStorage.getItem("token")).toBe("tok-remember");
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("tester");
  });

  it("login(keep=false) persists the token to sessionStorage (not localStorage)", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitForReady();

    await user.click(screen.getByText("login-session"));

    expect(sessionStorage.getItem("token")).toBe("tok-session");
    expect(localStorage.getItem("token")).toBeNull();
    expect(screen.getByTestId("user").textContent).toBe("tester");
  });

  it("login clears any existing guestId", async () => {
    localStorage.setItem("guestId", "guest-1");
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitForReady();

    await user.click(screen.getByText("login-remember"));

    expect(localStorage.getItem("guestId")).toBeNull();
  });

  it("logout clears both storages and resets user state", async () => {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>
    );
    await waitForReady();
    await user.click(screen.getByText("login-remember"));
    expect(screen.getByTestId("user").textContent).toBe("tester");

    await user.click(screen.getByText("logout"));

    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(localStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});