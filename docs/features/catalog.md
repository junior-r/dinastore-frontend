# Catalog

Product browsing and product detail, including search, category filtering,
favorites, and hover-prefetch. See `../architecture.md` for why this is
client-rendered rather than SSR'd, and `cart.md` for the add-to-cart flow
that lives inside these views.

## Pages

- `/catalog` (`src/pages/catalog/index.astro`) — paginated product grid.
  Renders `ProductGrid` (`client:load`).
- `/catalog/[slug]` (`src/pages/catalog/[slug].astro`, `prerender = false`)
  — single product detail. Renders `ProductDetailView` (`client:load`).

## What it does (user-facing)

- **Grid browsing**: a responsive grid of `ProductCard`s (2/3/4 columns by
  breakpoint), each showing the cover image, name, price, a favorite
  (heart) toggle, and a quick-add-to-cart button.
- **Search**: a debounced (300 ms) text search box above the grid, synced to
  the `?q=` query param so a search is shareable/bookmarkable and survives a
  refresh.
- **Category filter**: multi-select toggle chips (`CategoryFilter`) sourced
  from `GET /catalog/categories`, synced to `?categories=id1,id2`.
- **Pagination**: Previous/Next controls, synced to `?page=`. Changing
  search or category filters resets to page 1.
- **Navbar search overlay**: a separate, full-viewport search entry point
  (`components/react/navbar/SearchOverlay.tsx`, opened via `NavSearch`) —
  dimmed/blurred backdrop, live debounced results as horizontal cards,
  "No products match…" empty state. Independent of the `/catalog` page's
  own search box; it can be opened from any page via the navbar.
- **Product detail**: image, name, price, description, a favorite toggle, a
  `VariantPicker` (independent Size and Color button groups — see below),
  a quantity stepper, and an Add to cart / Remove from cart button. The
  product's comment thread (`CommentsSection` — see `comments.md`) is
  mounted at the bottom of the page.
- **Favorites**: a heart toggle on both the card and the detail page. Saving
  is entirely frontend-local (see `cart.md`'s favorites section) — there is
  no backend concept of a favorited product yet.

## Variant selection (`VariantPicker.tsx`)

Renders Size and Color as **two independent button groups**, not one
combined "M / Red" grid. Each axis tracks its own local selection; clicking
one axis never changes the other. The two selections resolve to a single
matching `ProductVariant` (or `null` if that pairing doesn't exist / isn't
in stock). Availability (`sizeAvailable`/`colorAvailable`) is checked
against **all** variants for that axis, not just ones matching the other
axis's current selection — checking only against the current pairing would
permanently disable every option whenever stock isn't a full size×color
grid (e.g. Red only in stock as S, Blue only as M/L). This was a real bug,
fixed 2026-08-08 per `AGENTS.md`.

`VariantPicker` is shared between `ProductDetailView` and `AddToCartModal`
(see `cart.md`).

## Data fetching

- `lib/api/catalog.ts` — `listProducts(params)`, `getProductBySlug(slug)`,
  `listCategories()`. All public, no auth token required.
- `lib/queries/products.ts` — `useProducts`, `useProduct`, `useCategories`
  (5 min `staleTime`), plus `usePrefetchProduct()`, which returns a function
  wired to `ProductCard`'s `onMouseEnter`/`onFocus` to warm the React Query
  cache for that product's detail query ahead of a click-through — confirmed
  live that hovering fires the request and the click makes zero additional
  network calls (per `AGENTS.md`).
- Backed by one shared `QueryClient` singleton (`lib/query-client.ts`) that
  survives Astro's soft navigations between catalog pages — see
  `../architecture.md`.

## Backend endpoints used

- `GET /catalog/products` — `?search=`, `?categoryIds=` (comma-joined),
  `?status=`, `?page=`, `?pageSize=`.
- `GET /catalog/products/:slug`
- `GET /catalog/categories`

## Known gaps

- 25 throwaway seed products (`pagination-test-01..25`, category "Apparel")
  exist purely to push `/catalog` past the default page size so pagination
  is exercisable — see `AGENTS.md`'s "Known gaps" for cleanup instructions.
- No SEO benefit currently, despite `AGENTS.md`'s guidance to SSR the
  catalog — this was a deliberate tradeoff for caching/prefetch, see
  `../architecture.md`.
