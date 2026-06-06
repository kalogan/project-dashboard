import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. The dev server is started on an isolated port with the content +
 * inbox roots redirected to throwaway temp dirs (see global-setup), so tests
 * never touch the real codex. Point E2E_BASE_URL at a running server to skip
 * the managed webServer (e.g. a production build for the access-control test).
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  reporter: "list",
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          CODEX_CONTENT_DIR: "_test-content",
          CODEX_INBOX_DIR: "_test-inbox",
        },
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
