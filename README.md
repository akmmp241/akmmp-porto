# web — SvelteKit portfolio

Phase 1 rewrite of the portfolio in SvelteKit with TypeScript, Tailwind v4, Paraglide 2 i18n, mode-watcher theming, and a Drizzle/Postgres skeleton wired in for later phases.

## Stack

- SvelteKit (Svelte 5 runes) + adapter-node
- TypeScript strict
- Tailwind v4 (CSS-first config in `src/app.css`)
- bits-ui primitives, `@lucide/svelte` icons, `motion` for spring physics
- `mode-watcher` for SSR-safe dark/light/system theming
- `@inlang/paraglide-js` for i18n (`en` default, `id` at `/id/...`)
- Zod for static-data schemas
- Drizzle ORM + postgres.js (skeleton, no schema yet)
- Bun as package manager and runtime
- Postgres 16 in Docker for dev

## Scripts

| Command                                                        | What it does                                    |
| -------------------------------------------------------------- | ----------------------------------------------- |
| `bun run dev`                                                  | Start vite dev server                           |
| `bun run build`                                                | Production build via `adapter-node`             |
| `bun run preview`                                              | Preview the production build                    |
| `bun run check`                                                | `svelte-check` type check                       |
| `bun run lint`                                                 | `prettier --check` + `eslint`                   |
| `bun run format`                                               | `prettier --write`                              |
| `bun run paraglide:compile`                                    | Recompile messages from `messages/{en,id}.json` |
| `bun run db:up` / `db:down`                                    | Start / stop the dev Postgres container         |
| `bun run db:generate` / `db:migrate` / `db:push` / `db:studio` | Drizzle Kit commands                            |

## Local setup

```sh
cp .env.example .env
bun install
bun run paraglide:compile
bun run db:up        # starts postgres on :5432
bun run dev          # http://localhost:5173
```

## i18n

- Source messages live in `messages/{en,id}.json`. Re-run `bun run paraglide:compile` after edits (the vite plugin also recompiles on dev start).
- URL strategy: `en` is bare (`/projects`), `id` is prefixed (`/id/projects`).
- Locale resolution: URL → cookie → `accept-language` → default (`en`), driven by paraglide's `paraglideMiddleware` in `src/hooks.server.ts`.

## Theme

- `mode-watcher` ships an inline pre-hydration script via `<ModeWatcher />` and a cookie (`mode-watcher-mode`).
- The `app.html` script also reads the cookie before hydration to avoid FOUC.
- Toggle cycles: `light → dark → system`, with a circular clip-path reveal driven by the View Transitions API where supported (graceful fallback otherwise).

## Database (skeleton)

- `docker-compose.yml` provisions a Postgres 16 container with a healthcheck and named volume.
- `src/lib/server/db/index.ts` lazy-instantiates a `postgres.js` client + Drizzle instance from `DATABASE_URL`. Phase 1 does not query anything; the schema in `src/lib/server/db/schema.ts` is intentionally empty.
- `drizzle.config.ts` points migrations at `./drizzle/` for Phase 2+.

## Production deploy

```sh
docker compose -f docker-compose.prod.yml up --build
```

App listens on `:3000`. The image is multi-stage (Bun → Bun build → Node 20 runtime running `node build`).

## Repo layout

```
web/
├── src/
│   ├── routes/                  # /, /projects, /about, /contact (paraglide handles /id/*)
│   ├── lib/
│   │   ├── components/{ui,fx,layout,sections}/
│   │   ├── data/                # zod-validated static content
│   │   ├── server/db/           # drizzle skeleton
│   │   ├── paraglide/           # generated, gitignored
│   │   ├── i18n.ts              # tr(), localePath() helpers
│   │   └── utils/cn.ts
│   ├── params/lang.ts
│   ├── hooks.server.ts
│   ├── hooks.ts                 # paraglide reroute
│   ├── app.html
│   ├── app.css
│   └── app.d.ts
├── messages/{en,id}.json
├── project.inlang/settings.json
├── static/                      # public assets, /resume.pdf placeholder
├── drizzle/                     # migrations (empty for P1)
├── drizzle.config.ts
├── Dockerfile
├── docker-compose.yml           # postgres (dev)
├── docker-compose.prod.yml      # app + postgres
└── ...
```
