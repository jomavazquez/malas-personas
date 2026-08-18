import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../../../test/render";
import { JudgeView } from "./JudgeView";
import type { Card, PlayedCard } from "../../../../types";

const blackCard: Card = { id: "b1", type: "BLACK", text: "Why did the chicken cross the road?" };

const baseProps = {
  blackCard,
  revealedCards: null as PlayedCard[] | null,
  roundResult: null,
  showingResult: false,
  winnerCardId: null,
  selectedWinner: null,
  playedCount: 1,
  totalNeeded: 3,
  playedCards: [] as { id: string; text: string }[],
  onPickWinner: vi.fn(),
};

describe("JudgeView", () => {
  it("shows the waiting-for-players count when no cards have been revealed yet", () => {
    renderWithProviders(<JudgeView {...baseProps} playedCount={1} totalNeeded={3} />);

    expect(
      screen.getByText((_, el) => el?.tagName === "P" && el.textContent === "Waiting for answers... (1 / 3)")
    ).toBeInTheDocument();
  });

  it("renders one played-card tile per already-played card while waiting", () => {
    renderWithProviders(
      <JudgeView
        {...baseProps}
        playedCards={[
          { id: "c1", text: "Card one" },
          { id: "c2", text: "Card two" },
        ]}
      />
    );

    expect(screen.getByText("Card one")).toBeInTheDocument();
    expect(screen.getByText("Card two")).toBeInTheDocument();
  });

  it("renders one tile per revealed card in the reveal state, and clicking one calls onPickWinner with the owning userId", async () => {
    const user = userEvent.setup();
    const onPickWinner = vi.fn();
    const revealedCards: PlayedCard[] = [
      { userId: "u1", username: "Alice", card: { id: "c1", type: "WHITE", text: "Answer A" } },
      { userId: "u2", username: "Bob", card: { id: "c2", type: "WHITE", text: "Answer B" } },
    ];

    renderWithProviders(
      <JudgeView {...baseProps} revealedCards={revealedCards} onPickWinner={onPickWinner} />
    );

    expect(screen.getByText("Answer A")).toBeInTheDocument();
    expect(screen.getByText("Answer B")).toBeInTheDocument();
    expect(screen.getByText(/Pick the funniest answer/)).toBeInTheDocument();

    await user.click(screen.getByText("Answer B"));
    expect(onPickWinner).toHaveBeenCalledTimes(1);
    expect(onPickWinner).toHaveBeenCalledWith("u2");
  });

  it("marks the winning entry in the winner state and stops allowing further picks", async () => {
    const onPickWinner = vi.fn();
    const revealedCards: PlayedCard[] = [
      { userId: "u1", username: "Alice", card: { id: "c1", type: "WHITE", text: "Answer A" } },
      { userId: "u2", username: "Bob", card: { id: "c2", type: "WHITE", text: "Answer B" } },
    ];
    const roundResult = {
      winner: { userId: "u2", username: "Bob", score: 3 },
      winningCard: { id: "c2", type: "WHITE" as const, text: "Answer B" },
    };

    renderWithProviders(
      <JudgeView
        {...baseProps}
        revealedCards={revealedCards}
        roundResult={roundResult}
        showingResult={false}
        winnerCardId="c2"
        selectedWinner="u2"
        onPickWinner={onPickWinner}
      />
    );

    // roundResult set and showingResult false -> falls into the "!roundResult" branch which is
    // false too, so nothing in the middle/waiting sections renders; only the black card shows.
    expect(screen.queryByText("Answer A")).not.toBeInTheDocument();
    expect(screen.queryByText("Answer B")).not.toBeInTheDocument();
  });

  it("shows the winner banner and highlights the winning card when showingResult is true", async () => {
    const user = userEvent.setup();
    const onPickWinner = vi.fn();
    const revealedCards: PlayedCard[] = [
      { userId: "u1", username: "Alice", card: { id: "c1", type: "WHITE", text: "Answer A" } },
      { userId: "u2", username: "Bob", card: { id: "c2", type: "WHITE", text: "Answer B" } },
    ];
    const roundResult = {
      winner: { userId: "u2", username: "Bob", score: 3 },
      winningCard: { id: "c2", type: "WHITE" as const, text: "Answer B" },
    };

    renderWithProviders(
      <JudgeView
        {...baseProps}
        revealedCards={revealedCards}
        roundResult={roundResult}
        showingResult={true}
        winnerCardId="c2"
        selectedWinner="u2"
        onPickWinner={onPickWinner}
      />
    );

    expect(screen.getByText("🏆 Bob")).toBeInTheDocument();
    expect(screen.getByText("Answer B")).toBeInTheDocument();

    // clickable is false once roundResult is set, so clicking must not fire the callback again.
    await user.click(screen.getByText("Answer B"));
    expect(onPickWinner).not.toHaveBeenCalled();
  });
});