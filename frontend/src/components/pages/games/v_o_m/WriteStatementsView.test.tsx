import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { renderWithProviders, screen } from "../../../../test/render";
import { WriteStatementsView } from "./WriteStatementsView";
import { api } from "../../../../lib";

vi.mock("../../../../lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../lib")>();
  return {
    ...actual,
    api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  };
});

const mockedApi = vi.mocked(api);

const getInputs = () => screen.getAllByPlaceholderText(/Statement \d/) as HTMLInputElement[];

describe("WriteStatementsView", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the submit button disabled until all three fields are filled and one is marked as the lie", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WriteStatementsView onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole("button", { name: /Send my statements/ });
    const inputs = getInputs();

    // Nothing filled, nothing marked.
    expect(submitButton).toBeDisabled();

    // Fill all three but don't mark a lie.
    await user.type(inputs[0], "I like tea");
    await user.type(inputs[1], "I like coffee");
    await user.type(inputs[2], "I like juice");
    expect(submitButton).toBeDisabled();

    // Mark one as the lie -> now ready.
    await user.click(screen.getAllByRole("button", { name: /Mark as lie/ })[1]);
    expect(submitButton).toBeEnabled();
  });

  it("still gates on all-filled even once a lie is marked (partial fill stays disabled)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WriteStatementsView onSubmit={vi.fn()} />);

    const inputs = getInputs();
    await user.click(screen.getAllByRole("button", { name: /Mark as lie/ })[0]);
    await user.type(inputs[0], "Only this one is filled");

    expect(screen.getByRole("button", { name: /Send my statements/ })).toBeDisabled();
  });

  it("shows a clear button only for non-empty fields, and clears that field's text when clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<WriteStatementsView onSubmit={vi.fn()} />);

    const inputs = getInputs();
    expect(screen.queryAllByRole("button", { name: "Clear statement" })).toHaveLength(0);

    await user.type(inputs[0], "Something");
    expect(screen.getAllByRole("button", { name: "Clear statement" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear statement" }));
    expect(getInputs()[0].value).toBe("");
    expect(screen.queryAllByRole("button", { name: "Clear statement" })).toHaveLength(0);
  });

  it("fills empty fields from a fetched prompt, marks exactly one statement as the lie, and submits the expected payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0); // deterministic: no truth-swap, lieSlot = blanks[0]

    mockedApi.get.mockResolvedValueOnce({
      prompt: {
        id: "p1",
        language: "EN",
        truthOne: "I have a cat",
        truthTwo: "I have visited Japan",
        lie: "I have a pet dragon",
      },
    });

    renderWithProviders(<WriteStatementsView onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Use an example" }));

    expect(mockedApi.get).toHaveBeenCalledTimes(1);
    expect(mockedApi.get).toHaveBeenCalledWith("/vom-prompts/random?language=EN");

    const inputs = getInputs();
    await vi.waitFor(() => expect(inputs[0].value).not.toBe(""));

    // With Math.random stubbed to 0: lieSlot = blanks[0] = index 0.
    expect(inputs[0].value).toBe("I have a pet dragon");
    // The other two fields get the two truths, in either order (sort order is
    // engine-dependent even with a constant comparator, so only assert the set).
    expect(new Set([inputs[1].value, inputs[2].value])).toEqual(
      new Set(["I have a cat", "I have visited Japan"])
    );

    // Exactly one lie button should read "Lie" (marked), the rest "Mark as lie".
    expect(screen.getAllByRole("button", { name: "Lie" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Mark as lie" })).toHaveLength(2);

    const submitButton = screen.getByRole("button", { name: /Send my statements/ });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0] as { text: string; isLie: boolean }[];
    expect(payload).toHaveLength(3);
    expect(payload.filter((s) => s.isLie)).toEqual([{ text: "I have a pet dragon", isLie: true }]);
    expect(new Set(payload.filter((s) => !s.isLie).map((s) => s.text))).toEqual(
      new Set(["I have a cat", "I have visited Japan"])
    );

    randomSpy.mockRestore();
  });

  it("does not overwrite fields the player already filled in, only the blank ones", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0);

    mockedApi.get.mockResolvedValueOnce({
      prompt: {
        id: "p2",
        language: "EN",
        truthOne: "Truth A",
        truthTwo: "Truth B",
        lie: "Lie C",
      },
    });

    renderWithProviders(<WriteStatementsView onSubmit={vi.fn()} />);

    const inputs = getInputs();
    await user.type(inputs[0], "My own statement");

    await user.click(screen.getByRole("button", { name: "Use an example" }));
    await vi.waitFor(() => expect(getInputs()[1].value).not.toBe(""));

    expect(getInputs()[0].value).toBe("My own statement");
  });
});