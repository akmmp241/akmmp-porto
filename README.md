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

## MCP Blog Management

The `mcp/` directory contains a standalone MCP server that lets an AI agent (e.g. Claude Desktop) manage blog posts directly via the database — no admin UI needed.

### Setup

```sh
cd mcp
npm install
npm run build
```

### Connect to Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "blog-management": {
      "command": "node",
      "args": ["/absolute/path/to/web/mcp/dist/mcp/index.js"],
      "env": {
        "DATABASE_URL": "postgres://postgres:postgres@localhost:5433/portfolio"
      }
    }
  }
}
```

### Available tools

| Tool | Description |
| --- | --- |
| `list_posts` | List posts with optional `status` filter (draft/published) |
| `get_post` | Get a post by `id` or `slug` |
| `create_post` | Create a draft post with Editor.js content |
| `update_post` | Update fields of an existing post |
| `publish_post` | Publish a post |
| `unpublish_post` | Revert a post to draft |
| `delete_post` | Hard-delete a post |
| `generate_slug` | Generate a URL slug from a title |

Content must be valid Editor.js JSON, e.g. `{"blocks":[{"type":"paragraph","data":{"text":"Hello"}}]}`.

## Contact

- GitHub: `akmmp241`
- Email: `akmalmp241@gmail.com`
- LinkedIn: `akmalmuhammadp`
