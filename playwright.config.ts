const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5000";

const config = {
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "api-smoke",
      testMatch: /.*api\.smoke\.spec\.ts/,
    },
    {
      name: "ui-smoke",
      testMatch: /.*ui\.smoke\.spec\.ts/,
      dependencies: ["api-smoke"],
      use: {
        browserName: "chromium",
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    },
  ],
} satisfies import("@playwright/test").PlaywrightTestConfig;

export default config;
