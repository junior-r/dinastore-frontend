# Checkout & Orders

Placing an order from the cart, order history, and order detail (including
the payment stub). See `cart.md` for how items get into the cart in the
first place.

## Pages

- `/checkout` (`src/pages/checkout.astro`) → `CheckoutView`
- `/orders` (`src/pages/orders/index.astro`) → `OrdersListView`
- `/orders/[id]` (`src/pages/orders/[id].astro`, `prerender = false`) →
  `OrderDetailView`

All auth-gated (redirect to `/login` if `auth-store` is hydrated with no
`accessToken`), all `client:load`.

## What it does (user-facing)

- **Checkout** (`CheckoutView.tsx`): lists current cart items with an
  editable quantity input and a remove link per line, a subtotal, and a
  "Place order" button. If the cart is empty, shows an empty state linking
  back to `/catalog` instead. On submit, calls `POST /orders`, clears the
  cart, and redirects to `/orders/[id]` for the new order.
- **Order history** (`/orders`, `OrdersListView.tsx`): a list of the
  signed-in user's past orders — short ID, date, subtotal, and a status
  badge (Pending/Paid/Cancelled, color-coded). Each row links to its detail
  page. Empty state links back to `/catalog`.
- **Order detail** (`/orders/[id]`, `OrderDetailView.tsx`): full line-item
  breakdown (product name, size/color, quantity × unit price), subtotal, and
  status badge. If the order is `PENDING`, shows a **"Pay now" button** —
  see below.

## Payment (stub)

There is no real payment gateway wired up on the backend yet. The "Pay now"
button on a `PENDING` order (`usePayOrder` → `POST /orders/:id/pay`) just
confirms payment immediately, for testing — the UI shows a small disclaimer
above the button saying so. `AGENTS.md` notes that replacing this with real
Stripe/MercadoPago integration should only need to touch this one button's
handler.

## Data fetching

- `lib/api/orders.ts` — `placeOrder(items, token)`, `listMyOrders(token,
  params)`, `getOrder(id, token)`, `payOrder(id, token)`.
- `lib/queries/orders.ts`:
  - `useMyOrders`, `useOrder` — gated on `auth-store`'s
    `hasHydrated && accessToken`, same pattern as `AccountView`.
  - `usePlaceOrder` — on success, invalidates the `orders` query and queues
    an "Order placed!" toast via `toastOnNextLoad` (see `auth.md`), since
    `CheckoutView` redirects immediately after via a hard navigation.
  - `usePayOrder` — on success, writes the updated order straight into the
    `['order', id]` query cache via `setQueryData` (no extra round trip),
    invalidates the `orders` list, and toasts "Payment confirmed!" directly
    (no redirect happens on this page, so no queueing needed).

## Backend endpoints used

- `POST /orders` — place an order (`{ items: [{ productVariantId,
  quantity }] }`)
- `GET /orders` — the signed-in user's order history, paginated
- `GET /orders/:id`
- `POST /orders/:id/pay` — stub payment confirmation

## Known gaps

- No real payment gateway (Stripe/MercadoPago) — see above.
- No order cancellation flow in the UI, even though `OrderStatus` includes
  `CANCELLED`.
