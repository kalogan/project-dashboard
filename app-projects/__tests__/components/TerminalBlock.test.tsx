import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TerminalBlock from "@/components/mdx/TerminalBlock";

describe("<TerminalBlock>", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it("renders the shell label and command", () => {
    render(<TerminalBlock label="bash" command="echo hello" />);
    expect(screen.getByText("bash")).toBeInTheDocument();
    expect(screen.getByText("echo hello")).toBeInTheDocument();
  });

  it("copies the command and confirms via the button", async () => {
    render(<TerminalBlock label="bash" command="echo hello" />);
    const button = screen.getByRole("button", { name: /copy/i });
    await userEvent.click(button);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("echo hello");
    expect(await screen.findByText("Copied")).toBeInTheDocument();
  });
});
