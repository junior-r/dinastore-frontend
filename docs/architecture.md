# Architecture

DinaStore's frontend is an **Astro + React islands** application: Astro owns
routing, page shells, and (where used) SSR; React is mounted selectively for
anything interactive. This document describes how those pieces actually fit
together in this codebase today. See `../AGENTS.md` for the project's
aspirational guidelines and a dated log of what's been built; this doc
summarizes the resulting architecture without repeating that log.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Astro 7 (`astro.config.mjs`) |
| Interactive UI | React 19, via `@astrojs/react` |
| Language | TypeScript, `astro/tsconfigs/strict` |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), semantic color tokens |
| State | Zustand (`+persist` middleware for anything durable) |
| Data fetching | `@tanstack/react-query` v5 |
| Realtime | `socket.io-client` |
| Toasts | `sonner` |
| Icons | `lucide-react` |
| Package manager | pnpm |

There is no test suite (no Vitest/Playwright) — `pnpm exec astro check` is
the only automated verification, backed up by manual/live browser testing
(see `AGENTS.md`'s progress log for what's been verified this way).

## Astro islands: static shell + React islands

Every page is an `.astro` file under `src/pages/` that renders a shared
`Layout.astro` and drops in one or more React components with a `client:*`
hydration directive. Astro itself renders the header/nav chrome
(`components/astro/Header.astro`, which just mounts the React `Navbar`) and
page-level headings/containers; nearly all actual interactivity lives in
`components/react/`.

- `components/astro/` — currently just `Header.astro`. Astro components are
  used for static/server-rendered shell markup.
- `components/react/` — everything interactive: forms, cart/favorites UI,
  catalog browsing, checkout/orders, the whole admin section. Organized into
  subfolders by feature: `catalog/`, `navbar/`, `admin/`, `ui/` (generic
  primitives: `Modal`, `Sidebar`, `ConfirmDialog`, `QuantityStepper`), plus a
  handful of top-level views (`AccountView`, `CheckoutView`,
  `OrdersListView`, `OrderDetailView`, `LoginForm`, `RegisterForm`, etc.).

Hydration is almost always `client:load`. Two components use
`transition:persist` so they survive Astro's soft navigations as long-lived
singletons instead of remounting on every page: `Toaster` and
`SessionWatcher` (both mounted once in `Layout.astro`), and `Navbar` (mounted
via `Header.astro`).

### Where Astro's SSR guidance was deliberately not followed

`AGENTS.md` calls for SSR/SSG on SEO-sensitive pages like the catalog.
`/catalog` and `/catalog/[slug]` deviate from that on purpose: they're fully
client-rendered React islands (`ProductGrid`, `ProductDetailView`) backed by
React Query, trading SEO/first-paint for response caching and hover-prefetch
(see below). This is called out explicitly in `AGENTS.md`'s progress log as
an intentional tradeoff, not an oversight.

Both product pages set `export const prerender = false` (on-demand
rendering) rather than static generation, since product/stock data must stay
live. This currently means `pnpm build` fails with `NoAdapterInstalled` —
no server adapter (`@astrojs/node`/`vercel`/`netlify`) has been chosen yet;
`pnpm dev` is unaffected. See `README.md` and `AGENTS.md`'s "Known gaps".

## Routing

File-based routing under `src/pages/`:

```
/                     index.astro
/catalog              catalog/index.astro
/catalog/[slug]       catalog/[slug].astro       (prerender = false)
/login, /register     login.astro, register.astro
/auth/callback         auth/callback.astro         (OAuth redirect target)
/account              account.astro
/checkout              checkout.astro
/orders               orders/index.astro
/orders/[id]           orders/[id].astro           (prerender = false)
/admin                admin/index.astro
/admin/users           admin/users/index.astro
/admin/products        admin/products/index.astro
/admin/categories      admin/categories/index.astro
```

There are no dedicated create/edit routes for admin entities — product,
user, and category detail/edit UI is rendered inside a slide-in `Sidebar`
opened from the relevant list page (see `docs/features/admin.md`), so those
routes were deleted once that pattern landed.

## Layouts

- `layouts/Layout.astro` — the one shared shell: `<head>` boilerplate, a
  FOUC-prevention inline theme script, `<ClientRouter />` (Astro View
  Transitions, aka "soft navigation"), `Header` (navbar), a `<slot />` for
  page content, and the persistent `Toaster` + `SessionWatcher` islands.
- `layouts/AdminLayout.astro` — wraps `Layout.astro`, adds the
  `AdminNav` sidebar and a content column. First (and only) "section layout"
  in the codebase.

## State management (Zustand)

All global client state lives in `src/stores/`, one Zustand store per
concern, each independently `persist`ed to its own `localStorage` key:

- `auth-store.ts` (`dinastore-auth`) — `accessToken`/`user`. Exposes a
  `hasHydrated` flag that every gated component must check before trusting
  `accessToken`/`user`, since `persist` restores them from `localStorage`
  asynchronously on first load.
- `cart-store.ts` (`dinastore-cart`) — cart line items, keyed by
  `productVariantId` (not `productId`) since a print-on-demand order needs a
  specific size/color to be fulfillable.
- `favorites-store.ts` (`dinastore-favorites`) — saved products, frontend-only
  (no backend concept of a favorite yet).
- `theme-store.ts` (`dinastore-theme`) — light/dark/system preference; also
  reacts to `astro:after-swap` to reapply the `.dark` class Astro's View
  Transitions wipe on every soft navigation (see "Astro/Tailwind gotchas"
  below).

Cart and favorites mutations also fire `sonner` toasts directly from inside
the store actions, so any caller gets consistent feedback for free.

## Data fetching (`lib/api` + `lib/queries`)

Two layers, deliberately kept separate:

- `lib/api/*.ts` — one module per backend domain (`catalog.ts`, `auth.ts`,
  `orders.ts`, `comments.ts`, `admin.ts`). Each is plain async functions
  that call `apiFetch`/`apiUpload` (`lib/api-client.ts`) and return typed
  data. No React, no caching — just typed HTTP calls.
- `lib/queries/*.ts` — React Query hooks (`useQuery`/`useMutation`) built on
  top of the `lib/api` functions: `products.ts`, `orders.ts`, `comments.ts`,
  `admin.ts`. Mutations invalidate the relevant query keys and surface
  `sonner` toasts on success/error via a shared `errorMessage()` helper that
  unwraps `ApiError`.

`lib/api-client.ts` is the single fetch wrapper: `apiFetch<T>()` builds the
URL against `PUBLIC_API_URL`, attaches a bearer token when given, and throws
a typed `ApiError` (with `statusCode`) on non-2xx responses. `apiUpload<T>()`
is a separate multipart-form variant used for product image uploads (file
input needs the browser to set its own `Content-Type` boundary).

`lib/query-client.ts` exports a `getQueryClient()` singleton: server-side
(Astro's SSR pass) always gets a fresh `QueryClient`, but client-side it
returns the same instance every call. Because Astro's `<ClientRouter />`
turns same-origin navigation into a soft navigation that keeps the JS module
graph alive, this singleton — and everything cached in it — survives
navigating from `/catalog` to `/catalog/[slug]` and back. `ProductCard`'s
`onMouseEnter`/`onFocus` calls `usePrefetchProduct()` to warm that cache
ahead of a click-through.

Every top-level React view that needs React Query wraps itself in its own
`<QueryClientProvider client={getQueryClient()}>` (e.g. `ProductGrid`,
`ProductDetailView`, `CheckoutView`, `OrdersListView`, `AdminUsersListView`)
rather than relying on one provider mounted higher up — there's no single
app-wide React root, since each Astro island hydrates independently.

## Realtime (`lib/realtime.ts`)

A single shared `socket.io-client` connection (namespace `/realtime`,
websocket transport, JWT passed as `auth.token`) is exposed via
`getRealtimeSocket(token)`/`disconnectRealtimeSocket()`. It's idempotent —
calling it again with the same token returns the existing socket rather than
reconnecting. Two consumers currently attach listeners to it:

- `SessionWatcher` (mounted once, `transition:persist`, in `Layout.astro`) —
  listens for `user.deactivated` and force-ends the session with a modal the
  instant an admin deactivates the account.
- `AdminUsersListView` — listens for `user.registered` to toast a
  notification and invalidate the users list query live.

See `docs/features/realtime.md` for details.

## Styling

Tailwind CSS v4, loaded via the Vite plugin (`@tailwindcss/vite`) rather
than a PostCSS config. All colors are centralized as **semantic tokens** in
`src/styles/global.css` (`bg-surface`, `text-content`, `bg-brand`,
`bg-success-soft`, etc.) — raw Tailwind palette classes (`bg-white`,
`text-neutral-900`, `bg-red-500`, ...) are not used elsewhere in the project;
a missing token is added to `global.css` instead. See
`docs/code-standards.md` for the full convention and the Tailwind v4 `@theme`
gotcha that shapes how dark mode is implemented (light values live in
`@theme`, dark overrides live in a plain `.dark { }` block outside of it).

## Cross-cutting UI infrastructure

A few pieces of shared infrastructure are used across almost every feature
and are documented here rather than repeated in each feature file:

- **Navbar** (`components/react/navbar/Navbar.tsx`) — single responsive
  island (hamburger below `sm`) composing `NavSearch`/`SearchOverlay`,
  `ThemeToggle`, `FavoritesButton`, `CartButton`, `UserMenu`.
- **Theme system** — `theme-store.ts` + an inline `<script is:inline>` FOUC
  guard in `Layout.astro` + `ThemeToggle.tsx`. Resolves `light`/`dark`/
  `system` to a `.dark` class on `<html>`.
- **Toasts** — `sonner`'s `<Toaster>` mounted once in `Layout.astro`.
  `lib/toast.ts` provides `toastOnNextLoad`/`flushPendingToast` for actions
  that redirect via a hard `window.location.href` immediately after
  succeeding (login, register, logout, place order), which would otherwise
  tear down the current page before a toast could render — the message is
  queued in `sessionStorage` and flushed by `Toaster` on the next page's
  mount.
- **Overlays** — `components/react/ui/Modal.tsx` (centered dialog, portaled
  to `document.body`) and `ui/Sidebar.tsx` (right-anchored slide-in panel,
  hand-rolled Tailwind transition, no animation library). Both register with
  `hooks/overlay-stack.ts` so Escape closes only the topmost overlay, and
  both mark their root with `data-overlay-root` so `hooks/useClickOutside.ts`
  can tell "a click inside a different, portaled overlay" apart from "a
  genuine outside click" even though portaled content isn't a DOM descendant
  of its logical parent.
- **`ConfirmDialog`/`ConfirmPrompt`** (`ui/ConfirmDialog.tsx`) — the shared
  confirm-before-destructive-action pattern used everywhere (remove from
  cart, delete comment, delete product/category, deactivate user). Exposes
  the dialog body (`ConfirmPrompt`) separately so a caller that already owns
  a `Modal` (e.g. `AddToCartModal`) can swap to a confirm step in place
  instead of stacking a second overlay.

## Features not yet implemented

`AGENTS.md`'s Section 4 describes a broader product vision than what
currently exists in `src/`: a print-on-demand customization engine (custom
design upload/preview), gamification/quizzes, and a creative AI agent chat
UI. None of these have corresponding pages, components, or stores in the
current codebase — only the storefront, auth, catalog/cart/checkout/orders,
comments, admin, and realtime session/notification features described in
`docs/features/` exist today. Real payment gateway integration
(Stripe/MercadoPago) is also not wired up — see `docs/features/orders.md`.
