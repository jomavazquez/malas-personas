import { describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen, within } from "../../../../test/render";
import { PlayerView } from "./PlayerView";
import type { Card, PlayedCard } from "../../../../types";

const blackCard: Card = { id: "b1", type: "BLACK", text: "Fill in the blank" };

const baseProps = {
  blackCard,
  playedCount: 3,
  totalNeeded: 3,
  roundResult: null,
  showingResult: false,
  revealedCards: null as PlayedCard[] | null,
  hasPlayed: true,
  playedCards: [] as { id: string; text: string }[],
  winnerCardId: null as string | null,
  myId: "myid",
  selectedCard: null as string | null,
  hand: [] as Card[],
  isSpectator: false,
  hasRedrawn: true,
  onPlayCard: vi.fn(),
  onSendCard: vi.fn(),
  onRedrawHand: vi.fn(),
};

describe("PlayerView", () => {
  it("pre-reveal: derives 'my card' by matching the selected card's position among the played cards, not by userId", () => {
    renderWithProviders(
      <PlayerView
        {...baseProps}
        revealedCards={null}
        selectedCard="pc2"
        playedCards={[
          { id: "pc1", text: "Alpha" },
          { id: "pc2", text: "Beta" },
          { id: "pc3", text: "Gamma" },
        ]}
      />
    );

    // Shows the "played X of Y" message pre-reveal, not the judge-waiting message.
    expect(
      screen.getByText((_, el) => el?.tagName === "P" && el.textContent === "3 of 3 players have answered")
    ).toBeInTheDocument();

    const betaTile = screen.getByText("Beta").parentElement as HTMLElement;
    const alphaTile = screen.getByText("Alpha").parentElement as HTMLElement;
    const gammaTile = screen.getByText("Gamma").parentElement as HTMLElement;

    expect(within(betaTile).queryByText("✓")).toBeInTheDocument();
    expect(within(alphaTile).queryByText("✓")).not.toBeInTheDocument();
    expect(within(gammaTile).queryByText("✓")).not.toBeInTheDocument();
  });

  it("post-reveal: derives 'my card' by matching userId, regardless of which card is (still) selected", () => {
    const revealedCards: PlayedCard[] = [
      { userId: "other", username: "Alice", card: { id: "c1", type: "WHITE", text: "Answer A" } },
      { userId: "myid", username: "Me", card: { id: "c2", type: "WHITE", text: "Answer B" } },
    ];

    renderWithProviders(
      <PlayerView
        {...baseProps}
        revealedCards={revealedCards}
        // Deliberately mismatched vs. the post-reveal branch to prove index/selectedCard is ignored now.
        selectedCard="c1"
        playedCards={[
          { id: "c1", text: "Answer A" },
          { id: "c2", text: "Answer B" },
        ]}
      />
    );

    expect(
      screen.getByText((_, el) => el?.tagName === "P" && el.textContent === "Wait! The judge is choosing...")
    ).toBeInTheDocument();

    const tileA = screen.getByText("Answer A").parentElement as HTMLElement;
    const tileB = screen.getByText("Answer B").parentElement as HTMLElement;

    expect(within(tileA).queryByText("✓")).not.toBeInTheDocument();
    expect(within(tileB).queryByText("✓")).toBeInTheDocument();
  });

  it("post-reveal: the winner badge takes priority over the 'mine' badge on the winning card", () => {
    const revealedCards: PlayedCard[] = [
      { userId: "other", username: "Alice", card: { id: "c1", type: "WHITE", text: "Answer A" } },
      { userId: "myid", username: "Me", card: { id: "c2", type: "WHITE", text: "Answer B" } },
    ];
    const roundResult = {
      winner: { userId: "myid", username: "Me", score: 2 },
      winningCard: { id: "c2", type: "WHITE" as const, text: "Answer B" },
    };

    renderWithProviders(
      <PlayerView
        {...baseProps}
        revealedCards={revealedCards}
        playedCards={[
          { id: "c1", text: "Answer A" },
          { id: "c2", text: "Answer B" },
        ]}
        winnerCardId="c2"
        roundResult={roundResult}
        showingResult={true}
      />
    );

    expect(screen.getByText("🏆 Me")).toBeInTheDocument();
    const tileB = screen.getByText("Answer B").parentElement as HTMLElement;
    expect(within(tileB).queryByText("🏆")).toBeInTheDocument();
    // Only the winner badge shows on that tile, not also the "mine" checkmark.
    expect(within(tileB).queryByText("✓")).not.toBeInTheDocument();
  });

  it("shows the spectator notice instead of the hand when isSpectator is true", () => {
    renderWithProviders(
      <PlayerView
        {...baseProps}
        isSpectator
        hand={[{ id: "h1", type: "WHITE", text: "Never shown" }]}
      />
    );

    expect(
      screen.getByText("You're watching this round — you'll be able to play starting next round.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Never shown")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Send card" })).not.toBeInTheDocument();
  });

  it("renders the normal hand (PlayerHand) when not a spectator", () => {
    renderWithProviders(
      <PlayerView
        {...baseProps}
        isSpectator={false}
        hasPlayed={false}
        hand={[{ id: "h1", type: "WHITE", text: "My hand card" }]}
      />
    );

    expect(screen.getByText("My hand card")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send card" })).toBeInTheDocument();
  });
});