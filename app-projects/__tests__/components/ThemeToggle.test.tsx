import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/ThemeToggle";

describe("<ThemeToggle>", () => {
  it("updates the data-theme attribute on the root element", async () => {
    render(
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="dark"
        themes={["light", "dark", "visceral"]}
        enableSystem={false}
      >
        <ThemeToggle />
      </ThemeProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /visceral/i }));
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("visceral")
    );

    await userEvent.click(screen.getByRole("button", { name: /light/i }));
    await waitFor(() =>
      expect(document.documentElement.getAttribute("data-theme")).toBe("light")
    );
  });
});
