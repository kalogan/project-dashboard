import { test, expect } from "@playwright/test";

/**
 * Access Control: in production the middleware hard-404s the editor. This is a
 * production-only assertion (the dev server intentionally allows /editor), so
 * it runs only when pointed at a production build:
 *
 *   npm run build && npm run start &           # serves on :3000
 *   E2E_BASE_URL=http://localhost:3000 E2E_PROD=1 npm run test:e2e
 */
test.skip(
  !process.env.E2E_PROD,
  "production-only — set E2E_PROD=1 against a production server"
);

test("the editor is inaccessible (404) in production", async ({ page }) => {
  const response = await page.goto("/editor");
  expect(response?.status()).toBe(404);
});
