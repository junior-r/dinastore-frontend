# Cart & Favorites

Shopping cart and favorites/wishlist. Both are Zustand stores persisted to
`localStorage` — entirely frontend-local state, not backed by any backend
resource. For placing an order from the cart, see `orders.md`.

## What it does (user-facing)

### Cart

- **Add to cart** from two entry points, both funneling through
  `AddToCartModal.tsx`:
  - The catalog grid's cart icon (`ProductCard.tsx`) always opens
    `AddToCartModal` — for a product with a single in-stock variant this is
    effectively just a quantity prompt; for multi-variant products it also
    shows the `VariantPicker` (size/color — see `catalog.md`). This always-opens
    behavior was a deliberate fix (2026-08-05): the button used to only
    intercept the click for single-variant products, silently falling
    through to the card's own link (just navigating) for everything else,
    which read as "the button does nothing."
  - The product detail page (`ProductDetailView.tsx`) has its own inline
    `VariantPicker` + `QuantityStepper` + Add to cart button, not routed
    through the modal.
- **Quantity**: asked via `QuantityStepper` (`-`/number/`+`, clamped to
  `[1, variant.stock]`) before adding, in both entry points.
- **Cart button flips to "Remove from cart"** once the currently-selected
  variant is already in the cart, in both the modal and the detail page —
  clicking it opens a confirm step (`ConfirmDialog`/`ConfirmPrompt`) rather
  than removing immediately.
- **Cart dropdown** (`components/react/navbar/CartButton.tsx`): a navbar
  icon with a badge count, opening a dropdown listing each line item
  (thumbnail, name, size/color, quantity × price, a direct remove `X`), a
  subtotal, and a "Checkout" link to `/checkout`.
- **Toasts**: every cart mutation (`addItem`, `removeItem`) shows a
  `sonner` success toast naming the product — fired directly from inside
  `cart-store.ts`'s actions, so every call site gets this for free without
  wiring it up itself.

### Favorites

- **Heart toggle** on `ProductCard` (grid) and `ProductDetailView` (detail
  page) — toggles the product in/out of `favorites-store`, with the filled
  heart + toast feedback ("added to favorites"/"removed from favorites").
- **Favorites dropdown** (`components/react/navbar/FavoritesButton.tsx`): a
  navbar icon with a badge count, opening a dropdown of saved products
  (thumbnail, name, price, remove button), each linking to its product page.

## State

- `stores/cart-store.ts` (`dinastore-cart`, Zustand + `persist`): `items:
  CartItem[]`, keyed by `productVariantId` (not `productId` — a print-on-demand
  order needs a specific size/color to be fulfillable). Actions: `addItem`,
  `removeItem`, `setQuantity` (removing the item if quantity drops to 0 or
  below), `clear`. Derived hooks: `useCartCount()`, `useCartTotalCents()`.
- `stores/favorites-store.ts` (`dinastore-favorites`, Zustand + `persist`):
  `items: FavoriteItem[]`, keyed by `productId`. Actions: `toggle`,
  `remove`. Derived hooks: `useIsFavorite(productId)`,
  `useFavoritesCount()`.

Both stores derive their line-item snapshot (name, price, image, currency)
from the `Product`/`ProductVariant` at the moment of add, rather than
re-fetching — so a cart/favorites entry reflects the product as it looked
when added, not live data.

## Components involved

- `components/react/catalog/AddToCartModal.tsx` — the grid entry point's
  modal (quantity + optional variant picker + add/remove action).
- `components/react/catalog/VariantPicker.tsx` — shared size/color picker
  (see `catalog.md`).
- `components/react/ui/QuantityStepper.tsx`, `ui/ConfirmDialog.tsx`,
  `ui/Modal.tsx` — shared primitives (see `../architecture.md`).
- `components/react/navbar/CartButton.tsx`,
  `components/react/navbar/FavoritesButton.tsx`.

## Backend endpoints used

None directly — cart and favorites never call the API. (Order placement
from the cart's contents is a separate step; see `orders.md`.)

## Known gaps

- Favorites has no backend counterpart — it's purely a frontend
  `localStorage` list, so it doesn't sync across devices/browsers and is
  lost if the user clears storage.
