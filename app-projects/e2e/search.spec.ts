import { test, expect } from "@playwright/test";

/**
 * The Search Flow: open the palette, run a full-text query, and verify the
 * flexsearch results render with a highlighted snippet, then route on Enter.
 * Queries are accessible-role based so they survive styling changes.
 */
test("full-text search renders a highlighted snippet and routes on Enter", async ({
  page,
}) => {
  await page.goto("/");

  // Open the command palette via the header affordance (cross-platform).
  await page.getByRole("button", { name: /search/i }).first().click();

  const input = page.getByRole("combobox", { name: /search query/i });
  await expect(input).toBeFocused();

  // "bioluminescent" only appears in the seeded fixture's body.
  await input.fill("bioluminescent");

  const option = page
    .getByRole("option")
    .filter({ hasText: /recall test/i })
    .first();
  await expect(option).toBeVisible();
  // The matched keyword is highlighted in a <mark>.
  await expect(option.locator("mark")).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/archive\/recall-test/);
});
