import { Page, expect } from "@playwright/test";

export interface TestUser {
  username: string;
  email: string;
  password: string;
  id: string;
}

let counter = 0;

/**
 * Builds a unique-enough registered-user fixture for a single test run.
 * Tests never reset the e2e DB between runs (too slow for e2e) — every test
 * creates its own users/rooms with unique emails/usernames instead, so
 * repeated `npm run e2e` runs never collide with leftover data.
 */
export const makeUser = (label: string) => {
  counter += 1;
  const unique = `${Date.now().toString(36)}${counter}${Math.floor(Math.random() * 1000)}`;
  return {
    username: `${label}${unique}`.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20),
    email: `${label}.${unique}@e2e.test`.toLowerCase(),
    password: "Sup3rSecret!1",
  };
};

/**
 * Registers a brand-new user through the real UI (RegisterPage) and returns
 * the fixture enriched with the DB-assigned user id (captured from the actual
 * /auth/register response, not guessed) — callers need this id to build the
 * per-player `score-*`/`vom-score-*` testid selectors added for e2e.
 */
export const registerUser = async (page: Page, user: { username: string; email: string; password: string }): Promise<TestUser> => {
  await page.goto("/register");
  await page.locator('input[name="username"]').fill(user.username);
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator(".terms_container").click();

  const [ response ] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/register") && r.request().method() === "POST"),
    page.getByRole("button", { name: "Create account" }).click(),
  ]);

  const data = await response.json() as { user: { id: string } };
  await page.waitForURL("/");

  return { ...user, id: data.user.id };
};

export const loginUser = async (page: Page, user: { email: string; password: string }) => {
  await page.goto("/login");
  await page.locator('input[name="identifier"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForURL("/");
};

/** Clicks the (viewport-visible) logout button in the account nav. */
export const logout = async (page: Page) => {
  const logoutButton = page.locator('.btn_red[title="Log out"]:visible').first();
  await logoutButton.click();
  await page.waitForURL("/");
};

type GameType = "MALAS_PERSONAS" | "V_O_M";

/**
 * Drives LobbyPage's "create room" form as a logged-in user and returns the
 * 6-character room code, read straight from the post-creation `/room/:code`
 * URL rather than scraped from the page (no reliable non-testid selector for
 * the bare code span, and the URL is authoritative anyway).
 */
export const createRoom = async (page: Page, { roomName, gameType }: { roomName: string; gameType: GameType }): Promise<string> => {
  await page.goto("/lobby");
  await page.getByPlaceholder("Squad A").fill(roomName);

  if( gameType === "V_O_M" ){
    await page.getByText("Truth or Lie", { exact: true }).click();
  }else{
    // Deck cards only render once GET /decks/all resolves — clicking it also
    // waits that out, and it's the same "No filters" deck the default-selection
    // effect would have picked anyway (this just makes the choice explicit).
    await page.getByText("No filters", { exact: true }).click();
  }

  await page.getByRole("button", { name: "Create room" }).click();
  await page.waitForURL(/\/room\/[A-Z0-9]{6}$/);

  const match = page.url().match(/\/room\/([A-Z0-9]{6})$/);
  if( !match ) throw new Error(`Could not read room code from URL: ${ page.url() }`);
  return match[1];
};

/**
 * Joins a room as a guest via the public "join with code" modal (reachable
 * from /login without an account) — the only join path available to a
 * browser context that hasn't registered, matching what LobbyPage.tsx's own
 * "join room" panel does for a logged-in user, minus the auth requirement.
 */
export const joinRoomAsGuest = async (page: Page, { code, name }: { code: string; name: string }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Join a game with a code" }).click();
  await page.getByPlaceholder("XXXXXX").fill(code);
  await page.getByPlaceholder("Elena", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Join", exact: true }).click();
  await page.waitForURL(new RegExp(`/room/${ code }$`));
};

export const startGame = async (page: Page) => {
  await page.getByRole("button", { name: "Start game" }).click();
};

/** Reads the guest id `getOrCreateGuestId()` stashed in localStorage for a guest context. */
export const getGuestId = async (page: Page): Promise<string> => {
  const id = await page.evaluate(() => localStorage.getItem("guestId"));
  expect(id, "guest id should have been created by the join flow").toBeTruthy();
  return id as string;
};