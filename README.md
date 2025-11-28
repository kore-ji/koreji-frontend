# Koreji Frontend

Koreji Frontend is an [Expo](https://expo.dev) repository created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) for the Koreji application.

## Prerequisites

Install the tooling before running any project scripts:

1. **Node.js + npm** (use the latest LTS release—Expo currently recommends Node 18+).

   ```bash
   # via nvm (https://github.com/nvm-sh/nvm)
   nvm install --lts
   nvm use --lts
   node -v
   npm -v
   ```

2. **PNPM** (preferred package manager for this repo).

   ```bash
   corepack enable         # ships with recent Node versions
   corepack prepare pnpm@latest --activate
   pnpm -v
   ```

## Get started

1. Install dependencies

   ```bash
   pnpm install --frozen-lockfile
   ```

2. Start the app

   ```bash
   pnpm start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Project structure

```
.
├── app/                     # Expo Router entry points (tabs, layouts, modals)
│   ├── (tabs)/              # Main navigation shell exposed to iOS/Android/Web
│   ├── _layout.tsx          # Shared stack/tab layout wrapper
│   └── modal.tsx            # Example modal route wired into the router
├── components/              # Shared UI + feature components
│   ├── themed-text.tsx      # Typography primitive bound to theme tokens
│   ├── themed-view.tsx      # Surface primitive enforcing design system colors
│   └── ui/                  # Low-level building blocks (icon-symbol.*, collapsible)
├── constants/               # Theme tokens + runtime constants (`theme.ts`, etc.)
├── hooks/                   # Reusable logic (gestures, data fetching, derived state)
├── assets/                  # Images, fonts, and other bundled static media
├── scripts/                 # Node helpers for maintenance + CI automation
├── .github/workflows/       # CI definitions (lint + typecheck pipeline)
├── package.json             # Expo configuration and project scripts
└── tsconfig.json            # TypeScript configuration consumed by Expo/tooling
```

## Quality checks

Every pull request and push to `main` triggers the GitHub Actions workflow defined in `.github/workflows/ci.yml`. The pipeline installs dependencies with PNPM and runs:

- `pnpm lint` – Expo ESLint rules via `expo lint`.
- `pnpm test` – runs TypeScript `--noEmit` checks and then executes the Playwright `test:e2e` suite (requires the Expo web server running at `PLAYWRIGHT_BASE_URL`).

Run the same commands locally before opening a PR to catch issues early. When running `pnpm test` locally, ensure `pnpm web` (or another server that matches your `PLAYWRIGHT_BASE_URL`) is already serving the app.

### End-to-end tests (Playwright)

Playwright powers our browser smoke tests under `tests/e2e/`. To run them locally:

1. After `pnpm install` completes, the `postinstall` script copies `.env.example` to `.env` if you don't have one yet. You can rerun it manually whenever needed:

   ```bash
   pnpm postinstall
   # edit .env if you serve the app on a different port
   ```

2. Start the Expo web server in one terminal:

   ```bash
   pnpm web
   ```

3. In another terminal, run the tests:

   ```bash
   pnpm test:e2e
   ```

   Use `pnpm test:e2e:ui` for Playwright's UI mode while authoring new specs. Override `PLAYWRIGHT_BASE_URL` inline if needed (e.g., `PLAYWRIGHT_BASE_URL=https://staging.example.com pnpm test:e2e`). CI environments should ensure the Expo web app is reachable and the env var is set before invoking the Playwright scripts.

## Learn more about Expo

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
