# DinaStore Frontend Docs

Developer documentation for the `frontend` repo (Astro + React storefront
for DinaStore). Start with `../README.md` for setup/running instructions and
`../AGENTS.md` for the project's guidelines and dated progress log — these
docs summarize and cross-reference both rather than duplicating them.

- **[architecture.md](./architecture.md)** — how Astro and React fit
  together (islands, routing, layouts), state management, data fetching,
  realtime, styling, and cross-cutting UI infrastructure (navbar, theme,
  toasts, overlays).
- **[code-standards.md](./code-standards.md)** — TypeScript, component,
  styling, state/data-fetching, and naming conventions actually used in
  this codebase.
- **Features** (`./features/`):
  - **[catalog.md](./features/catalog.md)** — product browsing, search,
    category filters, product detail, variant selection.
  - **[cart.md](./features/cart.md)** — shopping cart and favorites
    (frontend-local state).
  - **[orders.md](./features/orders.md)** — checkout, order history, order
    detail, the payment stub.
  - **[auth.md](./features/auth.md)** — registration, login, OAuth,
    session persistence, the account page.
  - **[comments.md](./features/comments.md)** — public product comment
    threads.
  - **[admin.md](./features/admin.md)** — role-gated user/product/category
    management.
  - **[realtime.md](./features/realtime.md)** — the shared Socket.IO
    connection: forced logout on deactivation, live admin notifications.

## What's not documented here (because it doesn't exist yet)

`AGENTS.md`'s Section 4 describes a broader product vision — a
print-on-demand design customization engine, gamification/quizzes, and a
creative AI agent chat UI — that has no corresponding code in `src/` yet.
See `architecture.md`'s "Features not yet implemented" section.
