import { test, expect } from "@playwright/test";
import { makeUser, registerUser, createRoom, joinRoomAsGuest, getGuestId } from "./helpers";

// Verdad o Mentira is the newest, least-battle-tested game mode. This scenario
// proves the server-side vote aggregation broadcasts correctly (not just a
// locally-echoed optimistic update): three independent browser contexts each
// read the SAME reveal — same scores, same fooled-count, same per-statement
// voter attribution — after only the protagonist and the two voters acted.
test("Verdad o Mentira: live write/vote/reveal round across three browser contexts", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const contextC = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();
  const pageC = await contextC.newPage();

  try{
    // ── Context A: registers, creates the room, and (by joining first) becomes
    // the protagonist for round 1 (see v_o_m.service.js buildSession/startGame).
    const host = await registerUser(pageA, makeUser("vomHost"));
    const code = await createRoom(pageA, { roomName: "VOM E2E Room", gameType: "V_O_M" });

    const nameB = `VomVoterB${ Date.now().toString(36) }`;
    const nameC = `VomVoterC${ Date.now().toString(36) }`;
    await joinRoomAsGuest(pageB, { code, name: nameB });
    await joinRoomAsGuest(pageC, { code, name: nameC });
    const guestBId = await getGuestId(pageB);
    const guestCId = await getGuestId(pageC);

    // Live updates on A's room page from B and C joining — A took no action.
    await expect(pageA.getByText(nameB)).toBeVisible();
    await expect(pageA.getByText(nameC)).toBeVisible();

    await pageA.getByRole("button", { name: "Start game" }).click();
    await expect(pageA).toHaveURL(new RegExp(`/game/${ code }$`));
    await expect(pageB).toHaveURL(new RegExp(`/game/${ code }$`));
    await expect(pageC).toHaveURL(new RegExp(`/game/${ code }$`));

    // ── A (protagonist) writes three statements and marks the 2nd as the lie.
    await expect(pageA.getByText("Truth or Lie", { exact: true })).toBeVisible();
    const statements = [ "I have visited Japan twice", "I once shook hands with a president", "I speak fluent French" ];
    const lieIndex = 1;
    for( let i = 0; i < statements.length; i++ ){
      await pageA.getByPlaceholder(`Statement ${ i + 1 }`).fill(statements[i]);
    }
    await pageA.locator('[class*="write_row"]').nth(lieIndex).getByRole("button", { name: /lie/i }).click();
    await pageA.getByRole("button", { name: "Send my statements" }).click();

    // Both voters receive the statements live, with no page reload.
    await expect(pageB.getByText(statements[lieIndex], { exact: true })).toBeVisible();
    await expect(pageC.getByText(statements[lieIndex], { exact: true })).toBeVisible();

    // ── B votes for the lie (catches it); C votes for a truth (gets fooled).
    await pageB.getByText(statements[lieIndex], { exact: true }).click();
    await pageB.getByRole("button", { name: "Confirm vote" }).click();

    await pageC.getByText(statements[0], { exact: true }).click();
    await pageC.getByRole("button", { name: "Confirm vote" }).click();

    // ── Synced reveal on all three contexts once the last vote comes in.
    await expect(pageA.getByText("You fooled 1 of the team")).toBeVisible();
    await expect(pageB.getByText("You caught the lie!")).toBeVisible();
    await expect(pageC.getByText("You got fooled this time")).toBeVisible();

    // Check everything the reveal screen shows in one pass per context — scores
    // AND per-statement voter attribution — before the server's round-breather
    // timer advances to round 2 and replaces this reveal with the next "writing"
    // phase (VOM_ROUND_BREATHER_MS in backend/.env.e2e; scores alone would still
    // be readable after that since they persist across rounds, but the reveal's
    // voter grouping would not).
    for( const page of [ pageA, pageB, pageC ] ){
      // Scores: protagonist +1 (fooledCount), the lie-catcher +1, the fooled voter +0 —
      // identical on every context, proving this is server-broadcast, not local echo.
      await expect(page.getByTestId(`vom-score-${ host.id }`)).toHaveText("1");
      await expect(page.getByTestId(`vom-score-${ guestBId }`)).toHaveText("1");
      await expect(page.getByTestId(`vom-score-${ guestCId }`)).toHaveText("0");

      // Per-statement voter attribution: B grouped under the lie, C grouped under
      // the truth they picked — consistently on every browser, not just the one
      // that cast the vote (statement order in the reveal matches submission order).
      // RevealView renders a voter's own chip as "You" instead of their username
      // on THEIR OWN page (see RevealView.tsx's `isMe` check) — everyone else
      // still sees their real name, which is the actual cross-context proof here.
      const lieRow = page.locator('[class*="statement_row"]').nth(lieIndex);
      await expect(lieRow.getByText(page === pageB ? "You" : nameB, { exact: true })).toBeVisible();
      const truthRow = page.locator('[class*="statement_row"]').nth(0);
      await expect(truthRow.getByText(page === pageC ? "You" : nameC, { exact: true })).toBeVisible();
    }
  }finally{
    await contextA.close();
    await contextB.close();
    await contextC.close();
  }
});