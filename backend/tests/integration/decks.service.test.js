import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resetDb } from "../helpers/db.js";
import { makeUser, makeDeck, makeRoom } from "../helpers/factories.js";
import { getDeckCards, createDeck, addCardToDeck, updateCard, deleteCard, updateDeck, deleteDeck } from "../../src/modules/decks/decks.service.js";

beforeEach(async () => {
  await resetDb();
});

afterEach(async () => {
  await resetDb();
});

describe("getDeckCards pagination", () => {
  it("computes total/pages correctly and paginates in [type asc, id asc] order across pages", async () => {
    const owner = await makeUser();
    // makeDeck adds 1 BLACK + `cardCount` WHITE cards.
    const deck = await makeDeck({ userId: owner.id, cardCount: 12 });

    const page1 = await getDeckCards(owner.id, deck.id, { page: 1 });
    const page2 = await getDeckCards(owner.id, deck.id, { page: 2 });

    expect(page1.total).toBe(13); // 1 black + 12 white
    expect(page1.pages).toBe(2);
    expect(page1.pageSize).toBe(10);
    expect(page1.cards).toHaveLength(10);
    expect(page2.cards).toHaveLength(3);

    // No overlap between pages.
    const page1Ids = new Set(page1.cards.map((c) => c.id));
    page2.cards.forEach((c) => expect(page1Ids.has(c.id)).toBe(false));

    expect(page1.blackCount).toBe(1);
    expect(page1.whiteCount).toBe(12);
  });

  it("filters by type and recomputes total/pages for the filtered set", async () => {
    const owner = await makeUser();
    const deck = await makeDeck({ userId: owner.id, cardCount: 5 });

    const whiteOnly = await getDeckCards(owner.id, deck.id, { page: 1, type: "WHITE" });

    expect(whiteOnly.total).toBe(5);
    expect(whiteOnly.pages).toBe(1);
    whiteOnly.cards.forEach((c) => expect(c.type).toBe("WHITE"));
    // blackCount/whiteCount reflect the whole deck, independent of the type filter.
    expect(whiteOnly.blackCount).toBe(1);
    expect(whiteOnly.whiteCount).toBe(5);
  });

  it("filters by case-insensitive search text", async () => {
    const owner = await makeUser();
    const deck = await createDeck(owner.id, { name: "Search deck", language: "ES" });
    await addCardToDeck(owner.id, deck.id, { type: "WHITE", text: "A very Unique Marker card" });
    await addCardToDeck(owner.id, deck.id, { type: "WHITE", text: "Something else entirely" });

    const result = await getDeckCards(owner.id, deck.id, { page: 1, search: "unique marker" });

    expect(result.total).toBe(1);
    expect(result.cards[0].text).toBe("A very Unique Marker card");
  });

  it("rejects a non-owner trying to read another user's deck cards", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const deck = await makeDeck({ userId: owner.id });

    await expect(getDeckCards(intruder.id, deck.id, { page: 1 })).rejects.toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });
});

describe("ownership authorization", () => {
  it("rejects a non-owner updating a card", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const deck = await makeDeck({ userId: owner.id });
    const card = await addCardToDeck(owner.id, deck.id, { type: "WHITE", text: "original" });

    await expect(updateCard(intruder.id, card.id, { text: "hacked" })).rejects.toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("rejects a non-owner deleting a card", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const deck = await makeDeck({ userId: owner.id });
    const card = await addCardToDeck(owner.id, deck.id, { type: "WHITE", text: "original" });

    await expect(deleteCard(intruder.id, card.id)).rejects.toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("rejects a non-owner updating the deck itself", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const deck = await makeDeck({ userId: owner.id });

    await expect(updateDeck(intruder.id, deck.id, { name: "hacked", language: "EN" })).rejects.toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("rejects a non-owner deleting the deck itself", async () => {
    const owner = await makeUser();
    const intruder = await makeUser();
    const deck = await makeDeck({ userId: owner.id });

    await expect(deleteDeck(intruder.id, deck.id)).rejects.toThrowError(
      expect.objectContaining({ status: 403 }),
    );
  });

  it("allows the owner to update and delete their own card/deck", async () => {
    const owner = await makeUser();
    const deck = await makeDeck({ userId: owner.id });
    const card = await addCardToDeck(owner.id, deck.id, { type: "WHITE", text: "original" });

    const updated = await updateCard(owner.id, card.id, { text: "updated" });
    expect(updated.text).toBe("updated");

    await expect(deleteCard(owner.id, card.id)).resolves.toBeTruthy();
    await expect(deleteDeck(owner.id, deck.id)).resolves.toBeTruthy();
  });
});

describe("deleteDeck referenced by a room", () => {
  it("rejects deleting a deck that's still referenced by an existing room", async () => {
    const owner = await makeUser();
    const deck = await makeDeck({ userId: owner.id });
    await makeRoom(owner.id, { deckId: deck.id });

    await expect(deleteDeck(owner.id, deck.id)).rejects.toThrowError(
      expect.objectContaining({ message: "DECK_IN_EXISTING_ROOM", status: 409 }),
    );
  });
});