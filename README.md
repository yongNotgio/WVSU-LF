

# WVSULF

WVSULF is a peer-to-peer lost-and-found platform for West Visayas State University. It replaces informal Freedom Wall posts with a structured system that includes item matching, verification-aware chat, and a college-based Karma leaderboard.

## Core Features

- Lost and found item posting with category/location metadata
- Matching engine for potential item-owner pairs
- Anonymous P2P chat with challenge-question verification flow
- Karma points for successful returns and a college leaderboard
- Safety reporting and auto-archival for stale posts

## Tech Stack

- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS
- Backend: Convex (database + queries/mutations/actions + cron)
- Auth: Convex Auth (`@convex-dev/auth`) with email/password
- Language: TypeScript (strict mode)

## Project Structure

```text
WVSU-LF/
├── convex/          # Convex backend functions and schema
├── docs/            # Project documentation
├── public/          # Static assets
├── scripts/         # Utility scripts (including e2e matrix runner)
└── src/
	├── app/         # Next.js App Router pages/layouts
	├── components/  # Shared UI components
	└── lib/         # Frontend utilities
```

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- A Convex account

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start Convex in one terminal:

```bash
npx convex dev
```

On first run, Convex will prompt you to log in and link/create a project. It will also create `.env.local` with:

```bash
CONVEX_DEPLOYMENT=dev:<your-deployment>
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
```

3. Start the Next.js app in a second terminal:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Convex local setup writes the required frontend variables to `.env.local`.

For backend email notifications, configure these Convex environment variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `APP_BASE_URL`

Set them with:

```bash
npx convex env set RESEND_API_KEY <your-resend-api-key>
npx convex env set RESEND_FROM_EMAIL "WVSU LF <your-verified-sender@yourdomain.com>"
npx convex env set APP_BASE_URL https://your-app-domain.com
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test:matrix` - Run the E2E matrix script
- `npm run test:matrix:keep` - Run E2E matrix without cleanup

## Key Documentation

- `docs/SETUP.md` - Full setup and troubleshooting guide
- `docs/ARCHITECTURE.md` - System architecture and data flow
- `docs/SCHEMA.md` - Database schema reference
- `docs/API.md` - Backend API/function reference
- `docs/E2E_TEST_MATRIX.md` - E2E matrix testing notes

## Security Notes

- Never commit secrets or API keys.
- Use Convex environment variables for backend secrets.
- Rotate keys immediately if they are exposed.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
