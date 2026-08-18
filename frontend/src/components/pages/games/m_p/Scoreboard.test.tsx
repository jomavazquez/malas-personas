import { describe, it, expect } from "vitest";
import { renderWithProviders, screen, within } from "../../../../test/render";
import { Scoreboard } from "./Scoreboard";
import type { Player } from "../../../../types";

const players: Player[] = [
  { userId: "u1", username: "Alice", score: 3, isGuest: false, isJudge: true, isSpectator: false },
  { userId: "u2", username: "Bob", score: 1, isGuest: false, isJudge: false, isSpectator: false },
  { userId: "u3", username: "Cara", score: 0, isGuest: true, isJudge: false, isSpectator: true },
];

describe("Scoreboard", () => {
  it("labels the current judge distinctly", () => {
    renderWithProviders(
      <Scoreboard
        players={players}
        judgeId="u1"
        myId="u2"
        pointsToWin={5}
        playedCount={0}
        showCardsOnTable={false}
      />
    );

    const aliceCard = screen.getByText("Alice").closest("div") as HTMLElement;
    expect(within(aliceCard!.parentElement as HTMLElement).getByText("JUDGE")).toBeInTheDocument();

    const bobCard = screen.getByText("Bob").closest("div") as HTMLElement;
    expect(within(bobCard!.parentElement as HTMLElement).queryByText("JUDGE")).not.toBeInTheDocument();
  });

  it("labels a spectator player distinctly", () => {
    renderWithProviders(
      <Scoreboard
        players={players}
        judgeId="u1"
        myId="u2"
        pointsToWin={5}
        playedCount={0}
        showCardsOnTable={false}
      />
    );

    expect(screen.getByText("WATCHING")).toBeInTheDocument();
    // Only Cara (the spectator) gets the label.
    const caraTile = screen.getByText("Cara").closest("div")?.parentElement as HTMLElement;
    expect(within(caraTile).getByText("WATCHING")).toBeInTheDocument();
  });

  it("highlights the current viewer distinctly from the other players", () => {
    renderWithProviders(
      <Scoreboard
        players={players}
        judgeId="u1"
        myId="u2"
        pointsToWin={5}
        playedCount={0}
        showCardsOnTable={false}
      />
    );

    const bobTile = screen.getByText("Bob").closest("div")?.parentElement as HTMLElement;
    const aliceTile = screen.getByText("Alice").closest("div")?.parentElement as HTMLElement;

    expect(bobTile.style.border).toContain("243, 156, 18"); // C.accent border for "me"
    expect(aliceTile.style.border).not.toContain("243, 156, 18");
  });

  it("shows the cards-on-table count only when showCardsOnTable is true", () => {
    const { rerender } = renderWithProviders(
      <Scoreboard
        players={players}
        judgeId="u1"
        myId="u2"
        pointsToWin={5}
        playedCount={2}
        showCardsOnTable={false}
      />
    );
    expect(screen.queryByText(/cards/)).not.toBeInTheDocument();

    rerender(
      <Scoreboard
        players={players}
        judgeId="u1"
        myId="u2"
        pointsToWin={5}
        playedCount={2}
        showCardsOnTable={true}
      />
    );
    expect(
      screen.getByText((_, el) => el?.tagName === "SPAN" && (el.textContent ?? "").replace(/\s+/g, " ").trim() === "· 2 cards")
    ).toBeInTheDocument();
  });
});