import { test, expect } from "@playwright/test";
import { makeUser, registerUser, logout } from "./helpers";

// Validates the whole harness first (real backend + real e2e Postgres DB + the
// production `vite preview` build all reachable) before the higher-value
// multiplayer specs rely on the same infrastructure.
test("register, log out, and log back in with the same credentials", async ({ page }) => {
  const fixture = makeUser("authFlow");

  const user = await registerUser(page, fixture);

  // Registration logs the user in immediately: the account nav (avatar +
  // logout) should replace the public "Log in" link, with no extra action.
  await expect(page.getByText(user.username).first()).toBeVisible();
  await expect(page.locator('.btn_red[title="Log out"]:visible').first()).toBeVisible();

  await logout(page);

  // Logged out: back to the public nav, username no longer rendered anywhere.
  await expect(page.getByRole("link", { name: "Log in" }).first()).toBeVisible();
  await expect(page.getByText(user.username)).toHaveCount(0);

  // Log back in with the same credentials used at registration.
  await page.goto("/login");
  await page.locator('input[name="identifier"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForURL("/");

  await expect(page.getByText(user.username).first()).toBeVisible();
  await expect(page.locator('.btn_red[title="Log out"]:visible').first()).toBeVisible();
});