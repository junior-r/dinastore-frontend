# Code Standards

These conventions are derived from `AGENTS.md` and observed consistently
across `src/`. There is no ESLint/Prettier config checked into the repo and
no test suite — `pnpm exec astro check` (strict TypeScript via
`astro/tsconfigs/strict`) is the only automated check. Follow the patterns
below to stay consistent with the rest of the codebase.

## TypeScript

- `tsconfig.json` extends `astro/tsconfigs/strict` — strict mode is on.
  `jsx: "react-jsx"` with `jsxImportSource: "react"`.
- Backend response shapes are mirrored as plain interfaces/types in
  `src/lib/types.ts` (`Product`, `User`, `Order`, `Comment`, `Permission`,
  etc.) — this is the single source of truth for API DTO shapes on the
  frontend. When the backend adds a field, add it here first.
- Request payload types live next to the API call that uses them, in the
  relevant `lib/api/*.ts` module (e.g. `CreateProductPayload` in
  `lib/api/admin.ts`), not in `types.ts`.
- Union types are used for fixed enums that must mirror the backend exactly
  (`Role`, `Permission`, `ProductStatus`, `OrderStatus`) — a comment usually
  says so explicitly (e.g. `Permission` is "Mirrors the backend's fixed
  Permission enum values exactly").
- Errors: a single `ApiError` class (`lib/api-client.ts`) with a
  `statusCode` field, thrown by `apiFetch`/`apiUpload` on any non-2xx
  response. Callers narrow with `error instanceof ApiError` to get a
  user-facing message, falling back to a generic string otherwise — see the
  repeated `errorMessage(error, fallback)` helper pattern in every
  `lib/queries/*.ts` file.

## Component conventions

- **One default-exported component per file**, file name matches the
  component name (`ProductCard.tsx` → `export default function
  ProductCard`).
- **Directory-by-feature** under `components/react/`: `catalog/`, `navbar/`,
  `admin/`, `ui/` (generic, feature-agnostic primitives only — `Modal`,
  `Sidebar`, `ConfirmDialog`, `QuantityStepper`). Top-level files in
  `components/react/` are page-level views not tied to one feature grouping
  (`AccountView`, `CheckoutView`, `OrdersListView`, `OrderDetailView`,
  `LoginForm`, `RegisterForm`, `Avatar`, `Toaster`, `SessionWatcher`,
  `ThemeToggle`).
- **Outer wrapper + inner component split** for any view that needs
  `QueryClientProvider`: the default export sets up the provider (and, for
  admin views, the `useRequireAdminAccess` gate) and renders a `*Inner`
  component that does the real work. See `ProductGrid`/`ProductGridInner`,
  `CheckoutView`/`CheckoutInner`, `AdminUsersListView`/`AdminUsersListInner`,
  etc. — this pattern repeats in every React-Query-backed view.
- Astro components (`components/astro/`) are used only for static/shell
  markup that mounts a React root — currently just `Header.astro`, which
  wraps `Navbar`.
- Props are declared as a local `interface Props { ... }` above the
  component, not inlined.
- Comments explain **why**, not what — the codebase leans heavily on
  short comments documenting non-obvious tradeoffs, race conditions, or
  browser/library quirks (e.g. `VariantPicker.tsx`'s explanation of why
  size/color availability is checked independently, or `useClickOutside.ts`'s
  explanation of the portal/DOM-ancestry problem). Follow this style: prefer
  a comment that explains a decision's reasoning over one that restates the
  code.

## Styling (Tailwind CSS v4)

- **Never use a raw Tailwind palette class** (`bg-white`, `text-neutral-900`,
  `bg-red-500`, ...). Always use the semantic color tokens defined in
  `src/styles/global.css`: `bg-surface`/`bg-surface-muted`/`bg-surface-hover`,
  `text-content`/`text-content-muted`/`text-content-inverse`, `border-border`,
  `bg-brand`/`bg-brand-hover`/`text-brand-content`, `bg-accent*`,
  `bg-danger`/`bg-danger-soft`/`text-danger`, `bg-success*`, `bg-warning*`.
  If a new semantic need comes up, add a new token to `global.css` rather
  than reaching for a palette class.
- **Tailwind v4 `@theme` gotcha**: `@theme` only generates utilities for a
  color token when given a **literal** value — `--color-x: var(--y)`
  silently generates nothing, and `@theme inline` isn't supported in this
  Tailwind version either (4.3.3). The working pattern (already in
  `global.css`): literal light-mode values inside `@theme`, then the same
  `--color-*` custom property names redeclared under a plain `.dark { }`
  block **outside** `@theme`. If colors stop reacting to the theme toggle,
  check this before assuming the toggle logic is broken.
- Dark mode is triggered by a `.dark` class on `<html>` via a custom variant
  (`@custom-variant dark (&:where(.dark, .dark *));`), not the OS-only
  `prefers-color-scheme` Tailwind v4 defaults to.
- Interactive elements always get `cursor-pointer` (and
  `disabled:cursor-not-allowed` alongside a `disabled` state) — this is a
  deliberate, swept-in convention (see `AGENTS.md`'s "Cursor affordance on
  action buttons" entry), not incidental.
- No CSS-in-JS, no CSS Modules, no styled-components — everything is
  Tailwind utility classes directly in JSX/Astro templates. The only plain
  CSS in the project is `src/styles/global.css` (token definitions) plus one
  `<style>` block in `Layout.astro` for `html, body` box-sizing basics.
- No animation library exists in the project. Transitions (e.g. `Sidebar`'s
  slide-in) are hand-rolled with Tailwind `transition-*`/`duration-*`
  classes and a `requestAnimationFrame`/`setTimeout` mount-delay pattern —
  see `ui/Sidebar.tsx`. Entrance motion is plain CSS in `global.css`:
  `animate-rise` plays once on mount (stagger siblings with `riseIndex(n)`
  from `lib/motion.ts`); `reveal` / `reveal-group` play when
  `hooks/useReveal.ts` reports the element has scrolled into view. Animate
  only `transform` and `opacity`, and add any new animation class to the
  `prefers-reduced-motion` block in `global.css`.
- Values that change continuously (pointer position) go to CSS custom
  properties through a ref, never through `useState`: see
  `hooks/usePointerEffect.ts`. No `window` scroll listeners; use an
  `IntersectionObserver`.
- A hook that attaches listeners or observers in a mount effect needs its
  element to exist at mount. Put conditionally rendered content that uses
  one in its own component rather than calling the hook in the parent.
- **Typography**: one family, Archivo, self-hosted through
  `@fontsource-variable/archivo` and set as `--font-sans`. Headings use its
  expanded cut (`font-extrabold tracking-tight font-stretch-expanded`), not a
  second typeface.
- **Corner radius** follows one scale, with `--radius-md`/`--radius-lg`
  overridden in `global.css`: controls (buttons, inputs, menus) are
  `rounded-md`; cards and media are `rounded-lg` or `rounded-2xl`; chips and
  icon buttons are `rounded-full`.
- **Color roles**: `brand` is the only accent and marks the primary action.
  A *selected* state (a chosen size, an active filter chip) is ink,
  `bg-content text-content-inverse`, so it doesn't compete with that action.
- **z-index** is used for three layers only, listed in `global.css`: `z-20`
  dropdowns, `z-30` the sticky navbar, `z-50` overlays.

## State and data-fetching conventions

- One Zustand store per concern in `src/stores/`, each store file exporting
  its hook (`useAuthStore`, `useCartStore`, ...) plus small derived-selector
  hooks where useful (`useCartCount`, `useIsFavorite`, `useFavoritesCount`).
- Any store that must survive a hard reload uses `persist` with an explicit
  `name` (the `localStorage` key, always prefixed `dinastore-`).
- Stores with `persist` that gate access control or redirects
  (`auth-store`, `theme-store`) expose a `hasHydrated` boolean set from
  `onRehydrateStorage`, and every consumer checks it before trusting the
  persisted value — never assume `accessToken`/`preference` is correct on
  the very first render.
- `lib/api/*.ts` functions never import React or React Query — they're
  plain, framework-agnostic async functions taking a `token?: string` as an
  explicit parameter (never reading it from a store directly), so they stay
  testable/reusable independent of the calling hook.
- `lib/queries/*.ts` hooks follow a consistent shape: read `accessToken`/
  `hasHydrated` from `auth-store` inside the hook, gate `useQuery`'s
  `enabled` on both, and have mutations call
  `queryClient.invalidateQueries` for the affected key(s) plus a
  `sonner` success/error toast in `onSuccess`/`onError`.
- Query keys are arrays starting with a domain string, then narrowing
  params: `['products', params]`, `['admin', 'users', params]`,
  `['comments', productId]`, `['order', id]`. Mutations invalidate the
  broadest key that covers what changed (e.g. `['admin', 'users']`, not a
  specific paginated key), letting React Query refetch whatever's currently
  mounted.

## Naming

- Files: `PascalCase.tsx` for components, `kebab-case.ts` or
  `camelCase.ts` for plain modules (`api-client.ts`, `query-client.ts`,
  `oauth-providers.ts`, `useClickOutside.ts`). Hooks are prefixed `use*`
  regardless of file naming style.
- Store files: `<domain>-store.ts` (`auth-store.ts`, `cart-store.ts`,
  `favorites-store.ts`, `theme-store.ts`).
- API/query modules: `lib/api/<domain>.ts` and `lib/queries/<domain>.ts`,
  domain names matching the backend module they front (`catalog`, `auth`,
  `orders`, `comments`, `admin`).

## Testing

No automated test suite exists (no Vitest, no Playwright, no unit tests).
Verification so far has been `pnpm exec astro check` plus manual/live
browser and HTTP-API testing, as logged in `AGENTS.md`'s progress notes. If
you add a test runner, note the choice and initial config here.
