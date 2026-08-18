import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { api } from "./api";

const mockFetchOnce = (response: {
  ok: boolean;
  status?: number;
  json: () => Promise<unknown>;
}) => {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("api", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("attaches an Authorization header when a token exists in localStorage", async () => {
    localStorage.setItem("token", "abc123");
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await api.get("/users/me");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer abc123");
  });

  it("omits the Authorization header when no token is present", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await api.get("/rooms");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["Authorization"]).toBeUndefined();
  });

  it("only JSON-stringifies a body when one is actually provided", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await api.get("/rooms");
    const [, getOptions] = fetchMock.mock.calls[0];
    expect(getOptions.body).toBeUndefined();

    const payload = { name: "room" };
    await api.post("/rooms", payload);
    const [, postOptions] = fetchMock.mock.calls[1];
    expect(postOptions.body).toBe(JSON.stringify(payload));
  });

  it("calls fetch with the requested path appended to the base URL", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await api.get("/rooms/ABCD");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/rooms\/ABCD$/);
  });

  it("throws an Error with the response message and status on a non-OK response", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Room not found" }),
    });

    await expect(api.get("/rooms/XXXX")).rejects.toMatchObject({
      message: "Room not found",
      status: 404,
    });
  });

  it("falls back to a generic message when the error body has no message field", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(api.post("/rooms")).rejects.toMatchObject({
      message: "Request failed",
      status: 500,
    });
  });

  it("resolves with the parsed JSON body on success", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ id: "1" }) });

    const result = await api.patch<{ id: string }>("/rooms/1", { name: "new" });

    expect(result).toEqual({ id: "1" });
  });
});