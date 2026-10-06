# Admin

Role-gated back-office section for managing users, products, and
categories.

## Pages

All under `/admin`, wrapped in `layouts/AdminLayout.astro` (which itself
wraps `Layout.astro` and adds the `AdminNav` sidebar):

- `/admin` (`admin/index.astro`) → `AdminDashboardView` — a card per section
  the signed-in user has access to.
- `/admin/users` (`admin/users/index.astro`) → `AdminUsersListView`
- `/admin/products` (`admin/products/index.astro`) → `AdminProductsListView`
- `/admin/categories` (`admin/categories/index.astro`) → `AdminCategoriesView`

There are no separate create/edit routes — `pages/admin/products/new.astro`,
`products/[slug].astro`, and `users/[id].astro` existed at one point and
were deleted once create/edit moved into a slide-in `Sidebar` opened from
each list page (see "Create/edit UI" below).

## Access control

- **Roles**: `CUSTOMER` / `STAFF` / `ADMIN` (`lib/types.ts`'s `Role`).
  `ADMIN` always has full access; `STAFF` needs specific `Permission`
  grants (`users:view`, `users:manage`, `products:view`, `products:manage`,
  `categories:view`, `categories:manage` — mirrors the backend's enum
  exactly).
- **`hooks/useRequireAdminAccess.ts`** — the one gating hook every `/admin`
  page/view uses. Redirects to `/login` if signed out, to `/` if signed in
  but not `ADMIN`/`STAFF`, or (when a specific `Permission` is passed) if
  `STAFF` without that grant. It also **re-fetches the current user from
  the backend** (`me(accessToken)`) on every admin page load — the JWT
  itself is stateless, so without this a role/permission change or
  deactivation made by another admin wouldn't be reflected here until the
  token was reissued via a fresh login.
- **`AdminNav.tsx`** filters its own links the same way, so a `STAFF` user
  only sees the sections they actually have a `*:view` permission for.
- Each list view (`AdminUsersListView`, `AdminProductsListView`,
  `AdminCategoriesView`) calls `useRequireAdminAccess('<domain>:view')`
  itself and derives a local `canManage` boolean
  (`role === 'ADMIN' || permissions.includes('<domain>:manage')`) that
  hides/disables mutation UI (create/edit/delete buttons) for `STAFF`
  without the `:manage` grant.

## Create/edit UI: slide-in `Sidebar`, not a dedicated page

Every admin entity's create/edit action opens `components/react/ui/Sidebar.tsx`
— a right-anchored panel with a hand-rolled Tailwind slide transition (no
animation library in this project). This replaced an earlier pattern of
dedicated pages/inline editing. The list page's own access-gate covers the
sidebar's content, since the form/detail view no longer owns its own
`QueryClientProvider`/`useRequireAdminAccess` wrapper.

- **Users**: `AdminUsersListView` opens a `Sidebar` containing
  `AdminUserDetailView` (role select, permission checkboxes, sign-in method
  summary — password set? which OAuth providers linked? — and
  deactivate/reactivate). A user can't change their own role, permissions,
  or active status (`isSelf` check). Deactivating goes through
  `ConfirmDialog`; deactivation takes effect immediately for the affected
  user via the realtime `user.deactivated` push — see `realtime.md`.
- **Products**: `AdminProductsListView` opens a `Sidebar` containing
  `AdminProductFormView` in either `create` or `edit` mode. Create supports
  name/slug/description/price/currency/categories, a drag-and-drop
  multi-image uploader (`ProductImagesField`, PNG/WebP/JPEG, each file
  uploads independently via `useUploadProductImages`), and adding variants
  (`VariantFormModal`, a nested `Modal` for size/color/SKU/stock). Edit mode
  currently only changes name/description/price/currency/categories — the
  form explicitly notes that variant/stock management and image editing
  aren't available from the edit form yet.
- **Categories**: `AdminCategoriesView` opens a `Sidebar` containing
  `CategorySidebar` (defined in the same file), handling both create and
  edit. **Create is name + optional description only** — no slug field; the
  backend generates the slug (confirmed live: "Café Específial Test" →
  `cafe-especifial-test`). Edit shows an editable slug field, since the
  backend's update DTO still accepts one.
- **Delete** (all three entities) goes through the shared `ConfirmDialog`.
  Category delete is expected to fail server-side if it would leave a
  product with no category — the confirm message says so.

## List views

- **Users** (`AdminUsersListView`): searchable (debounced, by name/email),
  paginated table (avatar, name — opens the sidebar, email, role badge,
  active/deactivated badge). Also subscribes to the realtime
  `user.registered` event to toast and live-refresh the list — see
  `realtime.md`.
- **Products** (`AdminProductsListView`): searchable + status-filterable
  (`DRAFT`/`PUBLISHED`/`ARCHIVED`), paginated table (thumbnail, name — opens
  the sidebar if `canManage`, price, stock, an inline status `<select>` that
  patches immediately on change, and a Delete action). Product creation
  deliberately posts to the **public** `POST /catalog/products` endpoint
  (guarded `ADMIN`/`STAFF` + `products:manage` server-side) rather than a
  separate `/admin` route, per a comment in `lib/api/admin.ts`.
- **Categories** (`AdminCategoriesView`): a simple list (name, slug,
  description, Edit/Delete) — no pagination, since categories are expected
  to be a small set.

## Data fetching

- `lib/api/admin.ts` — users (`listAdminUsers`, `getAdminUserDetail`,
  `updateUserRole`, `updateUserPermissions`, `deactivateUser`,
  `activateUser`), products (`listAdminProducts`, `createProduct`,
  `updateProduct`, `updateProductStatus`, `deleteProduct`,
  `uploadProductImages`), categories (`createCategory`, `updateCategory`,
  `deleteCategory`).
- `lib/queries/admin.ts` — one `useQuery`/`useMutation` hook per operation
  above, all gated on `hasHydrated && accessToken`
  (`useAdminEnabled()`/`useToken()`), all mutations invalidating the
  relevant list query key (`['admin', 'users']`, `['admin', 'products']`,
  or `['categories']` for category changes, since categories are also read
  by the public catalog) and toasting success/error.

## Backend endpoints used

- `GET/PATCH /admin/users`, `GET /admin/users/:id`,
  `PATCH /admin/users/:id/role`, `PATCH /admin/users/:id/permissions`,
  `PATCH /admin/users/:id/deactivate`, `PATCH /admin/users/:id/activate`
- `GET /admin/catalog/products`, `POST /catalog/products` (public route,
  guarded server-side), `PATCH /admin/catalog/products/:id`,
  `PATCH /admin/catalog/products/:id/status`,
  `DELETE /admin/catalog/products/:id`, `POST /catalog/products/images`
- `POST/PATCH/DELETE /admin/catalog/categories`

## Known gaps

- Product edit doesn't support changing variants, stock, or images — only
  create does.
- No admin UI for viewing/moderating comments, even though comment
  moderation exists on the backend (see `comments.md`).
