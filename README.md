# Akmal Muhammad Pridianto

Hi, I'm Akmal. I'm a software engineer who enjoys building backend systems that are reliable, practical, and easy to maintain.

I mostly work around APIs, databases, payments, and service architecture. I like the part where a messy requirement turns into a clean flow that people can actually use. This portfolio is where I keep the projects I have built, the things I am learning, and a small blog for notes I do not want to lose.

Some of my recent work:

- PowerUP, a top up platform with online payment integration.
- AkmalStore, a microservice API for an online top up platform.
- Evia, a mobile app for recognizing external wounds with help from Gemini API.

This site is built with SvelteKit, TypeScript, Tailwind CSS, Paraglide for i18n, and Drizzle with Postgres. It also has an admin area, Editor.js blog editing, contact messages, guestbook entries, analytics, and theme support.

## Running locally

```sh
cp .env.example .env
bun install
bun run paraglide:compile
bun run db:up
bun run dev
```

The app runs at `http://localhost:5173`.

## Useful commands

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` | Build for production |
| `bun run preview` | Preview the production build |
| `bun run check` | Run Svelte and TypeScript checks |
| `bun run lint` | Run Prettier check and ESLint |
| `bun run format` | Format the codebase |
| `bun run db:up` | Start the local Postgres container |
| `bun run db:down` | Stop the local Postgres container |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Run Drizzle migrations |
| `bun run db:studio` | Open Drizzle Studio |

## Stack

- SvelteKit and Svelte 5
- TypeScript
- Tailwind CSS v4
- Paraglide i18n
- Drizzle ORM and Postgres
- Editor.js
- Bun
- Docker

## Contact

- GitHub: `akmmp241`
- Email: `akmalmp241@gmail.com`
- LinkedIn: `akmalmuhammadp`
