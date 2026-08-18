import { describe, it, expect, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../../../test/render";
import { VoteView } from "./VoteView";
import type { VomStatement } from "../../../../types";

const statements: VomStatement[] = [
  { id: "s1", text: "I have run a marathon" },
  { id: "s2", text: "I have never eaten sushi" },
  { id: "s3", text: "I once met a president" },
];

describe("VoteView", () => {
  it("clicking a statement before confirming marks it pending/selected without calling onVote yet", async () => {
    const user = userEvent.setup();
    const onVote = vi.fn();

    renderWithProviders(<VoteView statements={statements} myVote={null} protagonistName="Alice" onVote={onVote} />);

    const row = screen.getByText("I have never eaten sushi").closest("div") as HTMLElement;
    await user.click(row);

    expect(row.style.border).toContain("243, 156, 18");
    expect(onVote).not.toHaveBeenCalled();
  });

  it("the confirm button is disabled until a statement is pending, and calls onVote exactly once with the pending selection", async () => {
    const user = userEvent.setup();
    const onVote = vi.fn();

    renderWithProviders(<VoteView statements={statements} myVote={null} protagonistName="Alice" onVote={onVote} />);

    const confirmButton = screen.getByRole("button", { name: /Confirm vote/ });
    expect(confirmButton).toBeDisabled();

    await user.click(screen.getByText("I once met a president"));
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);
    expect(onVote).toHaveBeenCalledTimes(1);
    expect(onVote).toHaveBeenCalledWith("s3");
  });

  it("after voting, statements become non-interactive and only the chosen one stays visually marked", async () => {
    const user = userEvent.setup();
    const onVote = vi.fn();

    renderWithProviders(<VoteView statements={statements} myVote="s1" protagonistName="Alice" onVote={onVote} />);

    // Confirm button is replaced by the waiting message.
    expect(screen.queryByRole("button", { name: /Confirm vote/ })).not.toBeInTheDocument();
    expect(screen.getByText("Waiting for the rest of the team...")).toBeInTheDocument();

    const chosenRow = screen.getByText("I have run a marathon").closest("div") as HTMLElement;
    const otherRow = screen.getByText("I have never eaten sushi").closest("div") as HTMLElement;

    expect(chosenRow.style.border).toContain("243, 156, 18");
    expect(otherRow.style.border).not.toContain("243, 156, 18");

    // Clicking another statement after voting must not change anything or call onVote.
    await user.click(otherRow);
    expect(onVote).not.toHaveBeenCalled();
    expect(otherRow.style.border).not.toContain("243, 156, 18");
  });
});