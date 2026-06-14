# RelationFlow Hub — CRM Demo

RelationFlow Hub is a lightweight customer relationship management (CRM) application built as a demo/starting point for product teams and engineers. It showcases a modern React + TypeScript stack with server-side helpers, local persistence, and several CRM-centric features: contacts, companies, case journeys, tasks, messaging, and notifications.

This README is written for engineers who will maintain or extend the project — it focuses on architecture, running the app locally, and where to find core pieces you will likely change.

**Tech stack**
- **Frontend:** React + TypeScript, Vite
- **Routing / Server functions:** TanStack Router + TanStack Start (serverFn RPC helpers)
- **Styling/UI:** Tailwind CSS + design system components under `src/components/ui` and `src/components/crm`
- **Persistence (demo):** JSON seed files in `src/data/seed/*` synced to localStorage and saved back to disk by the persistence server

**Repository layout (key files)**
- **`src/start.ts`**: TanStack Start configuration. CSRF middleware for `serverFn` endpoints is enabled here.
- **`src/server.ts`**: Development request entry — static asset routing and Start request handler.
- **`src/lib/db/persistence.ts`**: In-browser hydration and persistence layer that reads `src/data/seed/*.json` and syncs changes back to disk in dev.
- **`src/lib/db/repository.ts`**: Lightweight repository abstraction used by services.
- **`src/lib/services/*.service.ts`**: Business services (users, contacts, messages, notifications, tasks, journeys, etc.). Prefer adding logic here rather than in UI.
- **`src/components/crm/AppShell.tsx`**: Top-level layout, sidebar, and top-bar logic.
- **`src/routes/*`**: Page routes built with TanStack Router file routes.

Getting started (development)

Prerequisites
- Node.js 18+ (or current LTS)
- npm (or pnpm/yarn if you prefer — commands below assume npm)

Install

```bash
npm install
```

Run dev server

```bash
npm run dev
```

Open the app at the address printed by Vite (defaults to `http://localhost:5173`).

Important developer flows

- Local persistence: seed data lives in `src/data/seed/*.json`. On first run the app hydrates localStorage from those files. Edits in the UI write to localStorage; during development a small persistence server will write localStorage changes back to the seed files under `src/data/seed`.
- Images: uploaded images are written to `src/data/image/{users_image|customers_image}` and served from `/data/image/...` by `src/server.ts`.
- Server functions: use TanStack Start `createServerFn` pattern (see `src/lib/api/*.functions.ts`). These are same-origin RPC endpoints and are now protected by a CSRF middleware registered in `src/start.ts`.

Security note — CSRF

Server functions are same-origin RPC endpoints and must be protected from cross-site requests. The project includes a CSRF middleware in `src/start.ts`:

```ts
import { createCsrfMiddleware } from '@tanstack/react-start';

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
});

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware, /* other middleware */],
}));
```

If you intentionally protect CSRF differently (e.g., a gateway or custom token strategy), you can silence the built-in warning by setting `disableCsrfMiddlewareWarning: true` in TanStack Start serverFns config — but only do this with a documented, reviewed alternative in place.

Contributing guidelines (for engineers)

- Keep business logic in `src/lib/services/*`. UI files under `src/components` and `src/routes` should be thin and declarative.
- Use the repository layer (`src/lib/db/repository.ts`) for simple CRUD access and to keep persistence concerns isolated.
- Add unit tests for any non-trivial service logic.
- When adding server functions (RPCs), prefer `src/lib/api/*.functions.ts` and register them with TanStack Start patterns. Ensure they are idempotent when appropriate and validate inputs.

Testing & linting

- Run TypeScript checks and ESLint:

```bash
npm run typecheck
npm run lint
```

- Tests (if added): follow repo existing test runner (Jest / Vitest) — none are included by default in this demo.

Developer tips

- To quickly inspect persistence writes, watch the `src/data/seed` folder — the persistence server logs saved files to the terminal.
- For image upload issues, confirm the saved path returned by `saveImage` is served by the static middleware in `src/server.ts`.
- The sidebar uses a collapsed/expanded state stored in `localStorage` under `northwind.sidebar.collapsed` — useful when debugging layout differences.

Roadmap ideas (optional)

- Real-time messaging (WebSocket or server-sent events) for messages & notifications
- Migrate demo JSON persistence to a small embedded DB or remote service for multi-user scenarios
- Add end-to-end tests around server functions and persistence

License

This repository is a demo project and does not include an OSS license by default. Add an appropriate `LICENSE` file if you plan to open-source or distribute this work.

Contact

If you need help with architecture changes, server functions, or implementing production-grade persistence, open an issue or reach out to the engineering lead on the project.
