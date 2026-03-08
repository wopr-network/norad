# norad

Next.js 16 command center dashboard — real-time pipeline view for WOPR (DEFCON + RADAR).

## Commands

```bash
pnpm dev      # Next.js dev server (localhost:3000)
pnpm build    # next build
pnpm check    # biome check + tsc --noEmit (run before committing)
pnpm lint     # biome check src/
pnpm format   # biome format --write src/
pnpm test     # vitest run
```

**Linter/formatter is Biome.** Never add ESLint/Prettier config.

## Architecture

```
src/
  app/
    layout.tsx        # Root layout
    page.tsx          # Landing — redirects to /pipeline
    pipeline/         # Entity pipeline board
    entity/[id]/      # Entity detail view
    radar/            # RADAR panel (slot pool, events)
  components/
    pipeline/         # Pipeline board components
    entity/           # Entity detail components
    radar/            # RADAR panel components
    ui/               # Base design system components
  lib/
    config.ts         # Environment variables (DEFCON_URL, RADAR_URL)
    defcon-client.ts  # DEFCON REST API client
    defcon-ws.ts      # DEFCON WebSocket client
    radar-client.ts   # RADAR REST API client
    logger.ts         # Logger utility
```

## Key Libraries

- **Next.js 16** with App Router
- **Tailwind CSS v4** (PostCSS plugin)
- **Radix UI** for headless primitives
- **framer-motion** for animations

## Design Principles

- **Dark mode first.** All components must look correct in dark mode.
- **No raw fetch() in components.** Use typed client modules in lib/.
- **No hardcoded URLs.** Import from lib/config.ts.
- **No console.log.** Use logger from lib/logger.ts.

## Environment Variables

- `DEFCON_URL` — DEFCON HTTP+WS endpoint (e.g. http://localhost:3001)
- `DEFCON_ADMIN_TOKEN` — admin auth token for DEFCON
- `RADAR_URL` — RADAR HTTP API endpoint (e.g. http://localhost:8080)

## Issue Tracking

All issues in **Linear** (team: WOPR). Issue descriptions start with `**Repo:** wopr-network/norad`.
