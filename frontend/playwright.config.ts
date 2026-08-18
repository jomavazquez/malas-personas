import { defineConfig, devices } from "@playwright/test";

// E2E suite for the real-time multiplayer flows (Malas Personas / Verdad o Mentira).
// Boots BOTH the real backend (against a dedicated `malas_personas_e2e` Postgres
// database — see backend/.env.e2e) and a production-like `vite preview` build of
// the frontend, then drives them with real browser contexts over real Socket.io.
//
// Prerequisites (documented here since this config assumes them):
//   - Postgres running: `docker compose -f ../backend/docker-compose.yml up -d db`
//   - `malas_personas_e2e` DB created + schema pushed + seeded once:
//       npm run db:push:e2e --prefix ../backend
//       npm run db:seed:e2e --prefix ../backend
export default defineConfig({
  testDir: "./e2e",

  // Realtime multi-context tests share room state (and the shared e2e DB / in-memory
  // games.state.js singleton on the backend) — running spec files concurrently would
  // cross-contaminate rooms and the auth rate-limit window. Keep everything serial.
  fullyParallel: false,
  workers: 1,

  retries: process.env.CI ? 1 : 0,

  reporter: [["html", { open: "never" }]],

  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    // Force English so assertions can rely on known translation strings regardless
    // of the host machine's locale (i18next-browser-languagedetector falls back to
    // navigator language when localStorage has no saved preference).
    locale: "en-US",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],

  webServer: [
    {
      // Real backend, pointed at the dedicated e2e database via dotenv-cli (see
      // backend/.env.e2e). NODE_ENV=test there also shortens the VOM vote/round
      // timers and skips the auth rate limiter, both needed for a fast, repeatable
      // suite (see backend/src/app.js authLimiter `skip`).
      command: "npm run start:e2e",
      cwd: "../backend",
      url: "http://localhost:3000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // Production-like build + `vite preview` (not the dev server), per the plan:
      // exercises the actual built bundle instead of Vite's dev transform pipeline.
      // Builds with `--mode e2e` (see frontend/.env.e2e) so it points at the local
      // backend above — `.env.production`'s real deployed API/socket URLs would
      // otherwise get baked into the bundle, since a plain `vite build` defaults
      // to mode "production" and loads that file.
      // Uses `vite build` directly (skipping the `tsc -b` step from the regular
      // `build` script) so an unrelated pre-existing type error in a frontend unit
      // test file doesn't block booting the e2e preview server.
      command: "npm run build:e2e && npm run preview -- --port 4173 --strictPort",
      port: 4173,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});