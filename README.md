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

App menyediakan MCP endpoint di `/mcp` untuk AI Agent yang perlu membaca dan mengelola draft blog. Endpoint memakai Streamable HTTP dan Bearer API key.

### 1. Buat API key

1. Login sebagai admin.
2. Buka `/admin/settings/api-keys`.
3. Buat key dengan scope yang dibutuhkan:
   - `blog:read`: membaca draft dan membuat slug.
   - `blog:create_draft`: membuat draft.
   - `blog:update_draft`: mengubah draft.
4. Salin raw key saat ditampilkan. Key hanya muncul sekali.

### 2. Daftarkan MCP ke AI Agent

Gunakan URL aplikasi ditambah `/mcp`. Contoh konfigurasi Claude Desktop di `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "blog-management": {
      "type": "streamable-http",
      "url": "http://localhost:5173/mcp",
      "headers": {
        "Authorization": "Bearer <API_KEY>"
      }
    }
  }
}
```

Ganti URL dengan URL deployment aplikasi. Ganti `<API_KEY>` dengan raw key, lalu restart AI Agent agar server MCP terhubung.

### Tools yang tersedia

| Tool | Scope | Deskripsi |
| --- | --- | --- |
| `list_posts` | `blog:read` | List draft dengan pagination |
| `get_post` | `blog:read` | Baca draft berdasarkan `id` atau `slug` |
| `create_post` | `blog:create_draft` | Buat draft baru |
| `update_post` | `blog:update_draft` | Ubah draft berdasarkan `id` |
| `generate_slug` | `blog:read` | Buat slug lowercase dari judul |

`content` harus berupa JSON Editor.js yang valid dan dikirim sebagai string, misalnya:

```json
{"blocks":[{"type":"paragraph","data":{"text":"Hello"}}]}
```

MCP hanya mengelola draft. Publish dilakukan dari admin UI setelah draft selesai ditinjau.

### Standalone server

Direktori `mcp/` berisi server stdio untuk client yang tidak mendukung koneksi HTTP. Server ini memerlukan `BLOG_API_URL` dan `BLOG_API_KEY`.

```sh
cd mcp
npm install
npm run build
```

Contoh konfigurasi client stdio:

```json
{
  "mcpServers": {
    "blog-management": {
      "command": "node",
      "args": ["/absolute/path/to/web/mcp/dist/mcp/index.js"],
      "env": {
        "BLOG_API_URL": "http://localhost:5173",
        "BLOG_API_KEY": "<API_KEY>"
      }
    }
  }
}
```

Server standalone memakai API yang sama dan hanya menerima raw API key melalui environment variable.

## Contact

- GitHub: `akmmp241`
- Email: `akmalmp241@gmail.com`
- LinkedIn: `akmalmuhammadp`
