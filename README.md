# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

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
- `pnpm test` – currently runs TypeScript `--noEmit` checks through the `typecheck` script.

Run the same commands locally before opening a PR to catch issues early.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
