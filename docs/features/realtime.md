# Realtime

Live, push-based updates over a WebSocket connection to the backend, via
`socket.io-client`. `AGENTS.md`'s Section 4 describes a broader real-time
support-chat-widget ambition; what actually exists today is two narrower
uses of the same shared connection, described below.

## Shared connection (`lib/realtime.ts`)

`getRealtimeSocket(token)` returns a single module-level `Socket` instance,
connected to `{PUBLIC_API_URL}/realtime` (the `/realtime` Socket.IO
namespace) with the JWT passed as `auth: { token }` and `transports:
['websocket']`. It's idempotent: calling it again with the same token
returns the existing socket instead of opening a second connection.
Callers just attach/detach their own event listeners on whatever it
returns — they don't own the connection's lifecycle. `disconnectRealtimeSocket()`
tears it down (called when the user signs out or their token changes).

## Consumers

### Forced session end on deactivation

`components/react/SessionWatcher.tsx` — mounted once in `Layout.astro`
(`client:load transition:persist="session-watcher"`), so it stays connected
across Astro's soft navigations for as long as the user is signed in.
Listens for a `user.deactivated` event; when an admin deactivates this
user's account (see `admin.md`), the backend pushes this event and
`SessionWatcher` immediately clears the session (`auth-store.clearSession()`)
and shows a modal explaining the account was deactivated, with a link to
support. This is what makes a deactivation take effect the instant it
happens, rather than only the next time a request happens to fail.

### Live "new user" notifications in the admin users list

`components/react/admin/AdminUsersListView.tsx` opens the same shared
socket and listens for `user.registered`: on receipt, it shows a
`sonner` toast ("New user registered: `<name>`") and invalidates the
`['admin', 'users']` React Query cache so the list refreshes live. Per a
code comment in that component, the backend only routes this event to
sockets whose owner is allowed to see the users list (`ADMIN`, or `STAFF`
with `users:view`) — the frontend doesn't need to filter it itself.

## Backend contract

- Namespace: `/realtime` (Socket.IO), auth via `auth: { token: <JWT> }`.
- Events consumed: `user.deactivated` (`{ message, supportUrl }`),
  `user.registered` (a `User` object).

## Known gaps

- No support-chat widget exists yet, despite being called out in
  `AGENTS.md`'s Section 4 ("Real-Time Support") as a target feature — the
  realtime socket today is used only for the two admin/session notifications
  above.
