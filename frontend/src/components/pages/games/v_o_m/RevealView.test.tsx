import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { renderWithProviders, screen, within } from "../../../../test/render";
import { RevealView } from "./RevealView";
import type { VomStatement, VomVote } from "../../../../types";

const statements: VomStatement[] = [
  { id: "s1", text: "Truth one", isLie: false },
  { id: "s2", text: "The big lie", isLie: true },
  { id: "s3", text: "Truth two", isLie: false },
];

const baseProps = {
  statements,
  votes: [] as VomVote[],
  fooledCount: 0,
  protagonistUserId: "protagonist",
  protagonistName: "Alice",
  myId: "viewer",
  nextRoundAt: Date.now() + 10000,
  gameOver: false,
};

describe("RevealView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("labels the lie statement and the truths distinctly", () => {
    renderWithProviders(<RevealView {...baseProps} nextRoundAt={5000} />);

    const lieRow = screen.getByText("The big lie").closest("div")?.parentElement as HTMLElement;
    expect(within(lieRow).getByText("Lie")).toBeInTheDocument();

    const truthRow = screen.getByText("Truth one").closest("div")?.parentElement as HTMLElement;
    expect(within(truthRow).getByText("Truth")).toBeInTheDocument();
  });

  it("shows the protagonist headline (fooled count) when the viewer is the protagonist", () => {
    renderWithProviders(
      <RevealView
        {...baseProps}
        nextRoundAt={5000}
        myId="protagonist"
        fooledCount={2}
      />
    );

    expect(screen.getByText("You fooled 2 of the team. You won 2 points")).toBeInTheDocument();
    // Protagonist doesn't see the "about <username>" line.
    expect(screen.queryByText("About Alice")).not.toBeInTheDocument();
  });

  it("shows the caught-the-lie headline when the viewer correctly voted for the lie", () => {
    renderWithProviders(
      <RevealView
        {...baseProps}
        nextRoundAt={5000}
        myId="viewer"
        votes={[{ userId: "viewer", username: "Viewer", statementId: "s2" }]}
      />
    );

    expect(screen.getByText("You caught the lie! (You've won 1 point)")).toBeInTheDocument();
    expect(screen.getByText("About Alice")).toBeInTheDocument();
  });

  it("shows the got-fooled headline when the viewer voted for a truth instead of the lie", () => {
    renderWithProviders(
      <RevealView
        {...baseProps}
        nextRoundAt={5000}
        myId="viewer"
        votes={[{ userId: "viewer", username: "Viewer", statementId: "s1" }]}
      />
    );

    expect(screen.getByText("You got fooled this time")).toBeInTheDocument();
  });

  it("groups voters per statement, and marks the viewer's own vote chip distinctly", () => {
    const votes: VomVote[] = [
      { userId: "viewer", username: "Viewer", statementId: "s2" },
      { userId: "other1", username: "Bob", statementId: "s2" },
      { userId: "other2", username: "Cara", statementId: "s1" },
    ];

    renderWithProviders(<RevealView {...baseProps} nextRoundAt={5000} votes={votes} />);

    const lieRow = screen.getByText("The big lie").closest("div")?.parentElement as HTMLElement;
    expect(within(lieRow).getByText("2 votes")).toBeInTheDocument();
    expect(within(lieRow).getByText("You")).toBeInTheDocument();
    expect(within(lieRow).getByText("Bob")).toBeInTheDocument();

    const truthOneRow = screen.getByText("Truth one").closest("div")?.parentElement as HTMLElement;
    expect(within(truthOneRow).getByText("1 vote")).toBeInTheDocument();
    expect(within(truthOneRow).getByText("Cara")).toBeInTheDocument();

    const truthTwoRow = screen.getByText("Truth two").closest("div")?.parentElement as HTMLElement;
    expect(within(truthTwoRow).getByText("0 votes")).toBeInTheDocument();
  });

  it("counts down the seconds remaining to nextRoundAt and clamps at zero instead of going negative", () => {
    renderWithProviders(<RevealView {...baseProps} nextRoundAt={3000} />);

    expect(screen.getByText("Next round starts in 3...")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("Next round starts in 2...")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByText("Next round starts in 0...")).toBeInTheDocument();

    // Past the deadline: must clamp at 0, never show a negative number.
    act(() => { vi.advanceTimersByTime(5000); });
    expect(screen.getByText("Next round starts in 0...")).toBeInTheDocument();
    expect(screen.queryByText(/-\d/)).not.toBeInTheDocument();
  });

  it("shows the game-over countdown copy instead of the next-round copy when gameOver is true", () => {
    renderWithProviders(<RevealView {...baseProps} nextRoundAt={3000} gameOver />);

    expect(screen.getByText("Final results in 3...")).toBeInTheDocument();
    expect(screen.queryByText(/Next round starts in/)).not.toBeInTheDocument();
  });
});