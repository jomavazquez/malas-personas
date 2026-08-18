import { describe, it, expect, beforeEach, vi } from "vitest";
import { getOrCreateGuestId, clearGuestId } from "./guest";

const FAKE_UUID_1 = "11111111-1111-1111-1111-111111111111";
const FAKE_UUID_2 = "22222222-2222-2222-2222-222222222222";

describe("guest", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("creates and persists a new guest id when none exists yet", () => {
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID").mockReturnValue(FAKE_UUID_1);

    const id = getOrCreateGuestId();

    expect(id).toBe(FAKE_UUID_1);
    expect(localStorage.getItem("guestId")).toBe(FAKE_UUID_1);
    expect(randomUUIDSpy).toHaveBeenCalledTimes(1);
  });

  it("returns the existing id without generating a new one when one is already stored", () => {
    localStorage.setItem("guestId", "existing-guest-id");
    const randomUUIDSpy = vi.spyOn(crypto, "randomUUID");

    const id = getOrCreateGuestId();

    expect(id).toBe("existing-guest-id");
    expect(randomUUIDSpy).not.toHaveBeenCalled();
  });

  it("is idempotent: a second call returns the same id without regenerating", () => {
    const randomUUIDSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValueOnce(FAKE_UUID_1)
      .mockReturnValueOnce(FAKE_UUID_2);

    const first = getOrCreateGuestId();
    const second = getOrCreateGuestId();

    expect(first).toBe(FAKE_UUID_1);
    expect(second).toBe(FAKE_UUID_1);
    expect(randomUUIDSpy).toHaveBeenCalledTimes(1);
  });

  it("removes the guest id from localStorage on clear", () => {
    localStorage.setItem("guestId", "some-id");

    clearGuestId();

    expect(localStorage.getItem("guestId")).toBeNull();
  });

  it("clearing when no guest id is present is a no-op", () => {
    expect(() => clearGuestId()).not.toThrow();
    expect(localStorage.getItem("guestId")).toBeNull();
  });
});