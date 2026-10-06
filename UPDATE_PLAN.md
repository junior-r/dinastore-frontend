# Frontend Update Plan — Catalog UX Fixes

Scope: `frontend` only. Backend already stores `size`/`color` as separate fields
per `ProductVariant` and already supports `?search=` on `GET /catalog/products`,
so no backend changes are required for this batch.

Status legend: `[ ]` todo · `[x]` done

## 1. New shared UI primitives
- [x] `src/components/react/ui/Modal.tsx` — generic centered dialog: fixed overlay,
      `backdrop-blur` + dim background, Escape-to-close, click-outside-to-close,
      locks body scroll while open.
- [x] `src/components/react/ui/ConfirmDialog.tsx` — built on `Modal`, used for the
      "remove from cart" confirmation. Also exports `ConfirmPrompt` (body only)
      so a caller that already owns a `Modal` (AddToCartModal) can swap to a
      confirm step in place instead of stacking a second overlay.
- [x] `src/components/react/ui/QuantityStepper.tsx` — `-` / number / `+` control,
      clamps to `[1, maxStock]`.

## 2. Split size/color into independently selectable fields
- [x] `src/components/react/catalog/VariantPicker.tsx` — new shared component:
      renders a **Size** button group and a **Color** button group separately
      (derived from `product.variants`), resolves the matching variant from the
      pair, disables combinations that don't exist or are out of stock.
- [x] `ProductDetailView.tsx` — replace the single "Size / Color" combined
      button grid with `VariantPicker`.
- [x] `AddToCartModal` (below) reuses the same `VariantPicker`.

## 3. Ask quantity before adding to cart
- [x] `ProductDetailView.tsx` — add a `QuantityStepper` next to the Add to Cart
      button; the selected quantity is passed to `addItem`.
- [x] `src/components/react/catalog/AddToCartModal.tsx` — new modal opened from
      the list view (`ProductCard`) cart button. Contains: product thumbnail,
      `VariantPicker` (only if the product has >1 variant), `QuantityStepper`,
      and the Add/Remove-from-cart action. Keeps the list view uncluttered per
      requirements ("in the modal to not overload the UI").
- [x] `ProductCard.tsx` — cart icon always opens `AddToCartModal` (see item 5).

## 4. Cart button becomes "Remove from cart" when already in cart
- [x] In `ProductDetailView.tsx` (and `AddToCartModal.tsx`, below), once a
      variant is resolved, check `useCartStore` for that `productVariantId`.
      If present, render "Remove from cart" instead of "Add to cart".
- [x] Clicking "Remove from cart" opens a confirm step before calling
      `removeItem`.

## 5. Fix: cart button not clickable from the list view
- [x] Root cause: `ProductCard`'s cart button only intercepted the click for
      single-variant in-stock products; otherwise the click fell through to the
      card's wrapping `<a>` and just navigated, which reads as "the button does
      nothing." Fix: the button always calls `preventDefault`/`stopPropagation`
      and always opens `AddToCartModal` (single-variant products still get a
      fast path inside the modal — quantity only, no picker needed).

## 6. Navbar search overlay
- [x] `src/components/react/navbar/SearchOverlay.tsx` — new full-viewport
      overlay (`fixed inset-0`, dimmed + `backdrop-blur` background) opened from
      the existing search icon (desktop) and the mobile inline search entry.
  - Search input pinned near the top, full horizontal width of a centered
    container.
  - Real-time filtering via the existing `useDebouncedValue` hook + `useProducts`
    query (same backend `?search=` param already used by `/catalog`).
  - Results render below the input as horizontal cards (image left, name/price
    right), reusing `formatMoney`.
  - Empty state: icon (`SearchX` from lucide-react) + "No products match …"
    message.
  - Escape key / backdrop click / close button dismiss it.
- [x] `NavSearch.tsx` — desktop icon and mobile inline variant both open
      `SearchOverlay` instead of the small popover form.

## 7. Cursor affordance on action buttons
- [x] Add `cursor-pointer` (and keep/add `disabled:cursor-not-allowed` where a
      disabled state exists) to all clickable `<button>` elements across:
      `ProductCard`, `ProductDetailView`, `CartButton`, `FavoritesButton`,
      `NavSearch`/`SearchOverlay`, `Navbar` (mobile menu toggle), `UserMenu`,
      `ThemeToggle`, `ProductGrid` (clear/pagination), `CheckoutView`,
      `OrderDetailView`, `LoginForm`, `RegisterForm`.

## 8. Toast notifications on action buttons
- [x] Added `sonner` and mounted `<Toaster client:load transition:persist>` once
      in `Layout.astro` (`src/components/react/Toaster.tsx`, theme-aware via
      `theme-store`).
- [x] Cart (`cart-store.ts`): `addItem`/`removeItem` toast success with the
      product name — covers every cart button (list-view modal, detail page,
      cart dropdown remove, checkout remove/quantity-to-zero).
- [x] Favorites (`favorites-store.ts`): `toggle`/`remove` toast success —
      covers the favorite heart button everywhere it appears and the
      favorites dropdown's remove button.
- [x] `src/lib/toast.ts` — `toastOnNextLoad`/`flushPendingToast`: several
      actions (login, register, logout, place order) redirect via a hard
      `window.location.href` immediately after succeeding, which tears down
      the current page (and its `Toaster`) before a toast could render.
      Queues the message in `sessionStorage`; `Toaster` flushes it on mount
      after the next page loads.
- [x] `LoginForm.tsx` / `RegisterForm.tsx`: success → queued welcome toast
      before redirect; failure → immediate `toast.error` (kept alongside the
      existing inline error banner).
- [x] `UserMenu.tsx` logout → queued "Logged out" toast before redirect.
- [x] `lib/queries/orders.ts`: `usePlaceOrder` queues "Order placed!" before
      `CheckoutView`'s redirect, `onError` toasts the failure; `usePayOrder`
      toasts "Payment confirmed!" / the failure directly (no redirect on that
      page, so no queueing needed).

## Manual verification
- [x] `astro check` — 0 errors.
- [x] Verified live in Chrome against the running `pnpm dev` server:
  - List view cart icon always opens `AddToCartModal` (previously fell through
    to navigation for multi-variant products) — confirmed size/color pickers,
    quantity stepper, and that it flips to "Remove from cart" + confirm prompt
    once that variant is already in the cart.
  - Product detail page: same split size/color pickers, quantity stepper,
    "Remove from cart" + confirm dialog once added.
  - Navbar search: opens as a full-screen dimmed+blurred overlay, debounced
    real-time results as horizontal cards, "No products match …" empty state
    with icon, Escape closes it.
  - Noted one pre-existing (unrelated) React hydration console warning on the
    product detail page caused by the existing hover-prefetch architecture —
    not introduced by this batch of changes, left as-is.
