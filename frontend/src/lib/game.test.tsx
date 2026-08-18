import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BlackCardText } from "./game";

describe("BlackCardText", () => {
  it("renders plain text with no underline spans when there are no blank markers", () => {
    const { container } = render(<BlackCardText text="Just a plain black card." />);

    expect(container.textContent).toBe("Just a plain black card.");
    expect(container.querySelectorAll(".black_card_underline")).toHaveLength(0);
  });

  it("renders one underline span for a single blank marker", () => {
    const { container } = render(<BlackCardText text="I really like ______." />);

    expect(container.textContent).toBe("I really like .");
    expect(container.querySelectorAll(".black_card_underline")).toHaveLength(1);
  });

  it("renders one underline span per blank marker when there are 2+", () => {
    const { container } = render(
      <BlackCardText text="______ is worse than ______, honestly." />
    );

    expect(container.textContent).toBe(" is worse than , honestly.");
    expect(container.querySelectorAll(".black_card_underline")).toHaveLength(2);
  });

  it("uses the given color for the underline border", () => {
    const { container } = render(
      <BlackCardText text="Blank: ______" color="#ff0000" />
    );

    const underline = container.querySelector<HTMLElement>(".black_card_underline");
    expect(underline).not.toBeNull();
    expect(underline!.style.borderBottomColor).toBe("rgb(255, 0, 0)");
    expect(underline!.style.borderBottomWidth).toBe("2px");
    expect(underline!.style.borderBottomStyle).toBe("solid");
  });

  it("falls back to white (#fff) when no color prop is passed", () => {
    const { container } = render(<BlackCardText text="Blank: ______" />);

    const underline = container.querySelector<HTMLElement>(".black_card_underline");
    expect(underline).not.toBeNull();
    expect(underline!.style.borderBottomColor).toBe("rgb(255, 255, 255)");
  });
});