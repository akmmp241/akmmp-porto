# syntax=docker/dockerfile:1.7

FROM oven/bun:1.3-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

FROM oven/bun:1.3-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run paraglide:compile && bun run build

FROM oven/bun:1.3-alpine AS prod-deps
WORKDIR /app
COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
RUN addgroup -g 1001 -S nodejs && adduser -S -u 1001 -G nodejs sveltekit
COPY --from=build --chown=sveltekit:nodejs /app/build ./build
COPY --from=prod-deps --chown=sveltekit:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=sveltekit:nodejs /app/package.json ./package.json
USER sveltekit
EXPOSE 3000
CMD ["node", "build"]
