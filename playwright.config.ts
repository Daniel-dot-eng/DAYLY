import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  use: { baseURL: "http://127.0.0.1:5173", headless: true },
  webServer: [
    {
      command: "npm run dev:api",
      url: "http://127.0.0.1:3000/api/health",
      env: {
        DATABASE_URL:
          process.env.TEST_DATABASE_URL ||
          "postgresql://dayly_app@127.0.0.1:55432/dayly_test",
        NODE_ENV: "test",
      },
      reuseExistingServer: false,
    },
    {
      command: "npm run dev:web",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: false,
    },
  ],
});
