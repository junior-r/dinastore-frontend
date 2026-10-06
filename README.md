# DinaStore Frontend

Customer-facing storefront for DinaStore. Astro (routing/SSR) + React (interactive islands) + Tailwind CSS v4.

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io/)
- The [backend](../backend) running locally at `http://localhost:3000` (catalog browsing and auth call it directly from the browser)

## Setup

```bash
cp .env.example .env   # defaults to http://localhost:3000, edit PUBLIC_API_URL if the backend runs elsewhere
pnpm install
```

## Running the app

```bash
pnpm dev       # dev server at http://localhost:4321
pnpm build     # production build to ./dist/
pnpm preview   # preview a production build locally
```

> **`pnpm build` currently fails with `NoAdapterInstalled`.** The catalog pages (`src/pages/catalog/*`) render on demand (`export const prerender = false`) so product/inventory data is always live rather than frozen at build time — this requires a server adapter (e.g. `@astrojs/node`, `@astrojs/vercel`, `@astrojs/netlify`) that hasn't been chosen yet, since it depends on the deployment target. `pnpm dev` is unaffected and fully functional for local development.

## Type checking

```bash
pnpm exec astro check
```

There is no test suite yet (no Vitest/Playwright configured).

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_API_URL` | Base URL of the backend API. Prefixed with `PUBLIC_` so Astro exposes it to client-side code too. |

## Project structure

```
src/
├── components/
│   ├── astro/     # static/server-rendered components (Header, ProductCard)
│   └── react/     # interactive islands, hydrated via client:load (forms, auth status)
├── layouts/       # Layout.astro (shared <head>, header)
├── lib/
│   ├── api-client.ts   # typed fetch wrapper, throws ApiError on non-2xx
│   ├── api/            # one module per backend domain (catalog.ts, auth.ts)
│   ├── types.ts        # types mirroring backend response DTOs
│   └── format.ts       # display formatting helpers (money, ...)
├── stores/        # zustand stores (auth-store.ts persists the JWT/user to localStorage)
└── pages/         # file-based routing
```

## Pages implemented so far

| Route | Description |
| --- | --- |
| `/` | Home |
| `/catalog` | Product listing, paginated, filterable by status/category via query params |
| `/catalog/[slug]` | Product detail |
| `/register`, `/login` | Auth forms (React islands) |
| `/account` | Authenticated profile page — redirects to `/login` if not signed in |
