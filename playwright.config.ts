import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 180_000,
  retries: 0,
  use: {
    baseURL: process.env.NORAD_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: undefined,
});
