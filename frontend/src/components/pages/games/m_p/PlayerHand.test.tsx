import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../../../test/render";
import { PlayerHand } from "./PlayerHand";
import type { Card } from "../../../../types";

const hand: Card[] = [
  { id: "c1", type: "WHITE", text: "Card one" },
  { id: "c2", type: "WHITE", text: "Card two" },
];

const baseProps = {
  hand,
  selectedCard: null as string | null,
  hasPlayed: false,
  hasRedrawn: false,
  onPlayCard: vi.fn(),
  onSendCard: vi.fn(),
  onRedrawHand: vi.fn(),
};

describe("PlayerHand", () => {
  it("calls onPlayCard with the card id when a card is clicked before playing", async () => {
    const user = userEvent.setup();
    const onPlayCard = vi.fn();

    renderWithProviders(<PlayerHand {...baseProps} onPlayCard={onPlayCard} />);

    await user.click(screen.getByText("Card two"));
    expect(onPlayCard).toHaveBeenCalledTimes(1);
    expect(onPlayCard).toHaveBeenCalledWith("c2");
  });

  it("does not call onPlayCard when clicking a card after the player has already played", async () => {
    const user = userEvent.setup();
    const onPlayCard = vi.fn();

    renderWithProviders(<PlayerHand {...baseProps} hasPlayed onPlayCard={onPlayCard} selectedCard="c1" />);

    await user.click(screen.getByText("Card two"));
    expect(onPlayCard).not.toHaveBeenCalled();
  });

  it("shows the redraw-hand control only when the player has not redrawn yet", () => {
    const { rerender } = renderWithProviders(<PlayerHand {...baseProps} hasRedrawn={false} />);
    expect(screen.getByText("Swap hand (once per game)")).toBeInTheDocument();

    rerender(<PlayerHand {...baseProps} hasRedrawn={true} />);
    expect(screen.queryByText("Swap hand (once per game)")).not.toBeInTheDocument();
  });

  it("calls onRedrawHand when the redraw control is clicked", async () => {
    const user = userEvent.setup();
    const onRedrawHand = vi.fn();

    renderWithProviders(<PlayerHand {...baseProps} onRedrawHand={onRedrawHand} />);

    await user.click(screen.getByText("Swap hand (once per game)"));
    expect(onRedrawHand).toHaveBeenCalledTimes(1);
  });

  it("disables the send button until a card is selected, then enables it and calls onSendCard", async () => {
    const user = userEvent.setup();
    const onSendCard = vi.fn();

    const { rerender } = renderWithProviders(
      <PlayerHand {...baseProps} selectedCard={null} onSendCard={onSendCard} />
    );

    const sendButton = screen.getByRole("button", { name: "Send card" });
    expect(sendButton).toBeDisabled();

    rerender(<PlayerHand {...baseProps} selectedCard="c1" onSendCard={onSendCard} />);
    const enabledSendButton = screen.getByRole("button", { name: "Send card" });
    expect(enabledSendButton).toBeEnabled();

    await user.click(enabledSendButton);
    expect(onSendCard).toHaveBeenCalledTimes(1);
  });

  it("hides the send button entirely once the player has played", () => {
    renderWithProviders(<PlayerHand {...baseProps} hasPlayed selectedCard="c1" />);
    expect(screen.queryByRole("button", { name: "Send card" })).not.toBeInTheDocument();
  });
});