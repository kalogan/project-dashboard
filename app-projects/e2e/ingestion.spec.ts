import { test, expect } from "@playwright/test";

/**
 * The Ingestion Flow: author an entry and save it, exercising the `saveMdx`
 * server action end-to-end (it writes into the isolated `_test-content` root
 * and redirects to the rendered page).
 *
 * NOTE on Gemini: the "Grill Me" pane calls the model server-side, which a
 * browser-level mock can't intercept. This test covers the manual compose →
 * save path (no external API). Mocking Gemini requires a server-side test seam
 * (e.g. a fake injected via an env flag in askCodex).
 */
test("compose and save creates an entry and redirects to it", async ({ page }) => {
  await page.goto("/editor");

  // Ensure the Compose tab is active.
  await page.getByRole("button", { name: /^compose$/i }).click();

  await page.getByLabel(/^title$/i).fill("E2E Smoke Entry");
  await page.getByLabel(/^body$/i).fill("# Hello from Playwright");

  await page.getByRole("button", { name: /save entry/i }).click();

  // Default pillar is Logbook → redirect to the slugified route.
  await expect(page).toHaveURL(/\/logbook\/e2e-smoke-entry/);
  await expect(
    page.getByRole("heading", { name: "E2E Smoke Entry" })
  ).toBeVisible();
});
