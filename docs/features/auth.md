# Auth

Registration, login (password and OAuth), session persistence, the account
page, and the deactivation kill-switch.

## Pages

- `/register` (`src/pages/register.astro`) → `RegisterForm`
- `/login` (`src/pages/login.astro`) → `LoginForm`
- `/auth/callback` (`src/pages/auth/callback.astro`) → `OAuthCallbackView`
- `/account` (`src/pages/account.astro`) → `AccountView` — redirects to
  `/login` if not signed in.

All render their React view with `client:load`.

## What it does (user-facing)

- **Register / Login forms** (`RegisterForm.tsx`, `LoginForm.tsx`): email +
  password (+ name for register, min 8 characters). On success, sets the
  session, queues a "Welcome back, `<first name>`!" toast (see
  `toastOnNextLoad` below), and hard-redirects to `/account`. On failure,
  shows an inline error banner and an immediate `toast.error`.
- **Continue with Google** (`OAuthButtons.tsx`, driven by
  `lib/oauth-providers.ts`): a plain `<a>` full-page navigation to
  `{PUBLIC_API_URL}/auth/google` — not a `fetch` call, since OAuth has to
  leave the page. `OAUTH_PROVIDERS` is a one-entry array today; adding a new
  provider (GitHub/Spotify/Apple) is a one-line addition once the backend
  has a matching `/auth/<id>` route pair.
- **OAuth callback** (`/auth/callback`, `OAuthCallbackView.tsx`): reads
  `?token=` from the URL (where the backend redirects back to), calls
  `me(token)` to fetch the user, hydrates `auth-store`, and redirects to
  `/account`.
- **Account page** (`/account`, `AccountView.tsx`): shows avatar, name,
  email, role. Redirects to `/login` if `auth-store` isn't hydrated with a
  token, or if the `me()` call fails (stale/invalid token — clears the
  session first).
- **Avatar** (`components/react/Avatar.tsx`): shared across `UserMenu`,
  `AccountView`, and `CommentsSection` — shows the user's `avatarUrl` (only
  ever set from an OAuth provider's profile photo) when present, otherwise a
  circle with the first letter of their name. Password-only accounts always
  get the initial.
- **Logged-in navbar state** (`components/react/navbar/UserMenu.tsx`): shows
  Log in / Sign up links when signed out; when signed in, an avatar dropdown
  with Account, Orders, (Admin panel, if `ADMIN`/`STAFF`), and Log out. Log
  out clears the session, queues a "Logged out" toast, and hard-redirects to
  `/`.
- **Forced logout on deactivation**: handled by `SessionWatcher` — see
  `realtime.md`. Not a page of its own, but part of the auth experience: an
  admin deactivating this user's account ends their session immediately,
  with an explanatory modal, rather than waiting for the next request to
  fail.

## Session storage

`stores/auth-store.ts` — Zustand + `persist` to `localStorage` key
`dinastore-auth`, storing `accessToken` and `user`. Exposes `hasHydrated`
(set via `onRehydrateStorage`) because `persist` restores state
asynchronously — every consumer must gate on `hasHydrated`, not just
`accessToken`, to avoid a false "signed out" flash on first load.

## The `toastOnNextLoad` pattern

Login, register, logout, and place-order all redirect via a hard
`window.location.href` immediately after succeeding — which tears down the
current page (and its `Toaster`) before `sonner` can render anything.
`lib/toast.ts`'s `toastOnNextLoad(kind, message)` queues the message in
`sessionStorage`; `Toaster` (mounted once in `Layout.astro`) calls
`flushPendingToast()` on mount, showing it once the next page loads.

## Data fetching

- `lib/api/auth.ts` — `register(payload)`, `login(payload)`, `me(token)`.
- No `lib/queries/auth.ts` — auth calls are made directly (via `useEffect`)
  in the consuming components rather than through React Query, since
  there's no list/cache semantics to gain here.

## Backend endpoints used

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `GET /auth/google` (OAuth entry, full-page navigation, not `fetch`)

## Known gaps

- No password reset / email verification flow exists in the frontend.
- Google is the only OAuth provider wired up today.
