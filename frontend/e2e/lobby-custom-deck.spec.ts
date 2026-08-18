import { test, expect } from "@playwright/test";
import { makeUser, registerUser, joinRoomAsGuest } from "./helpers";

// Lower-priority than the two full-round specs, but cheap to add on top of them:
// a registered user builds their own deck (one black + two white cards — enough
// for a single playable round; malas_personas.service.js's buildSession/nextRound
// finishes the game immediately if the black deck is empty), creates a room with
// it, and the black card actually shown in-game is the custom one, not some
// official deck's card — on both contexts, not just the creator's.
test("custom deck: create it, use it in a room, and see its own card in-game", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try{
    const user = await registerUser(pageA, makeUser("deckOwner"));

    const suffix = Date.now().toString(36);
    const deckName = `E2E Custom Deck ${ suffix }`;
    // Keep the distinctive part entirely before the "______" gap: BlackCardText
    // (lib/game.tsx) splits the card text on that marker into separate <span>s,
    // so a substring straddling the gap would never match a single text node.
    const blackTextUniquePart = `E2E-CUSTOM-BLACK-${ suffix }`;
    const blackText = `${ blackTextUniquePart }: the real reason is ______.`;
    const whiteText1 = `E2E custom white card A ${ suffix }`;
    const whiteText2 = `E2E custom white card B ${ suffix }`;

    // ── Create the deck.
    await pageA.goto("/my-decks");
    // Two buttons open the same "new deck" modal (header CTA + the empty-grid
    // card) — both children include a leading "+", so match by substring and
    // take the first; either one triggers the identical `setShowNewModal(true)`.
    await pageA.getByRole("button", { name: "New deck" }).first().click();
    await pageA.getByPlaceholder("e.g. My team deck").fill(deckName);
    await pageA.getByRole("button", { name: "Create deck", exact: true }).click();
    await expect(pageA.getByText(deckName, { exact: true })).toBeVisible();

    // ── Add one black card (the "add" modal defaults to type BLACK already)
    // and two white cards.
    await pageA.getByRole("button", { name: "Manage cards" }).click();
    await expect(pageA).toHaveURL("/my-cards");

    await pageA.getByRole("button", { name: "New card" }).first().click();
    await pageA.locator("textarea").fill(blackText);
    await pageA.getByRole("button", { name: "Add card" }).click();
    await expect(pageA.getByText(blackTextUniquePart, { exact: false })).toBeVisible();

    for( const whiteText of [ whiteText1, whiteText2 ] ){
      await pageA.getByRole("button", { name: "New card" }).first().click();
      await pageA.getByRole("button", { name: "Answer", exact: true }).click();
      await pageA.locator("textarea").fill(whiteText);
      await pageA.getByRole("button", { name: "Add card" }).click();
      await expect(pageA.getByText(whiteText, { exact: true })).toBeVisible();
    }

    // ── Create a room using this custom deck.
    await pageA.goto("/lobby");
    await pageA.getByPlaceholder("Squad A").fill("Custom Deck Room");
    await pageA.getByText(deckName, { exact: true }).click();
    await pageA.getByRole("button", { name: "Create room" }).click();
    await pageA.waitForURL(/\/room\/[A-Z0-9]{6}$/);

    const code = pageA.url().match(/\/room\/([A-Z0-9]{6})$/)![1];

    // A second (guest) player, purely so MIN_PLAYERS_TO_START (2) is met.
    const guestName = `DeckGuest${ suffix }`;
    await joinRoomAsGuest(pageB, { code, name: guestName });
    await expect(pageA.getByText(guestName)).toBeVisible();

    await pageA.getByRole("button", { name: "Start game" }).click();
    await expect(pageA).toHaveURL(new RegExp(`/game/${ code }$`));
    await expect(pageB).toHaveURL(new RegExp(`/game/${ code }$`));

    // The black card shown in-game is the custom deck's own card, on BOTH
    // contexts (judge view and player view render the same currentBlackCard).
    await expect(pageA.getByText(blackTextUniquePart, { exact: false })).toBeVisible();
    await expect(pageB.getByText(blackTextUniquePart, { exact: false })).toBeVisible();
  }finally{
    await contextA.close();
    await contextB.close();
  }
});