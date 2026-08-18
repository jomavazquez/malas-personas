import { test, expect } from "@playwright/test";
import { makeUser, registerUser, createRoom, joinRoomAsGuest, getGuestId } from "./helpers";

// Highest-value scenario: exercises the real-time judge/player loop that the
// project's bug-fix commit history keeps hitting (judge rotation, played-card
// counting, winner scoring). Every assertion below checks state that changed
// in ONE browser context and is expected to show up in ANOTHER context that
// took no action of its own — that's the actual point of testing this
// Socket.io-synced app with Playwright instead of just rendering pages.
test("Malas Personas: live judge/player round across two browser contexts", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try{
    // ── Context A: registers, creates the room, and (by joining first) becomes judge.
    const host = await registerUser(pageA, makeUser("mpHost"));
    const code = await createRoom(pageA, { roomName: "MP E2E Room", gameType: "MALAS_PERSONAS" });

    await expect(pageA.getByText("You need at least 2 players")).toBeVisible();

    // ── Context B: joins as a guest via the room code, no account needed.
    const guestName = `MpGuest${ Date.now().toString(36) }`;
    await joinRoomAsGuest(pageB, { code, name: guestName });
    const guestId = await getGuestId(pageB);

    // Live update on A's room page from B's join — A took no action.
    await expect(pageA.getByText(guestName)).toBeVisible();

    // ── A starts the game — both contexts navigate to the game page live.
    await pageA.getByRole("button", { name: "Start game" }).click();
    await expect(pageA).toHaveURL(new RegExp(`/game/${ code }$`));
    await expect(pageB).toHaveURL(new RegExp(`/game/${ code }$`));

    // Host joined first, so `judgeIndex = 0` makes them the judge (see
    // malas_personas.service.js buildSession/startGame) and the guest the
    // sole non-judge player (totalNeeded === 1).
    await expect(pageA.getByText("You are the judge this round")).toBeVisible();

    // ── B (non-judge) plays a card.
    await pageB.getByTestId("hand-card").first().click();
    await pageB.getByRole("button", { name: "Send card" }).click();

    // Judge's view updates live: since totalNeeded is 1, the single play
    // immediately flips the round into reveal — no manual refresh on A.
    await expect(pageA.getByText("Pick the funniest answer")).toBeVisible();
    const revealCard = pageA.getByTestId("judge-reveal-card").first();
    await expect(revealCard).toBeVisible();

    // ── Judge (A) picks the winner.
    await revealCard.click();

    // Both contexts' scoreboards update to reflect the score change, with
    // neither browser taking any further action.
    await expect(pageA.getByTestId(`score-${ guestId }`)).toHaveText("1");
    await expect(pageB.getByTestId(`score-${ guestId }`)).toHaveText("1");
  }finally{
    await contextA.close();
    await contextB.close();
  }
});