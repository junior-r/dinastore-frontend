import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { getTranslation } from '@/i18n';
import { randomUuid } from '@/lib/uuid';
import { imagesForVariant } from '@/lib/variants';
import type { DesignPlacement, Product, ProductVariant } from '../lib/types';

/** The shopper's own design on a cart line, set in the design studio. */
export interface CartItemCustomization {
  designId: string;
  /** Preview with the store logo applied. */
  thumbnailUrl: string;
  placement: DesignPlacement;
}

export interface CartItem {
  /**
   * What identifies a line. A plain line uses its variant id, so adding the
   * same size and color again raises the quantity. A customized line gets its
   * own id: two designs on the same tee, or one design placed twice, are
   * different things to print and must stay separate lines.
   */
  lineId: string;
  productId: string;
  productVariantId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  priceCents: number;
  currency: string;
  /** For a customized line, the photo the design was placed on. */
  imageUrl: string | null;
  quantity: number;
  customization: CartItemCustomization | null;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  addCustomItem: (
    product: Product,
    variant: ProductVariant,
    customization: CartItemCustomization,
    quantity?: number,
  ) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
}

function newLine(product: Product, variant: ProductVariant, quantity: number) {
  return {
    productId: product.id,
    productVariantId: variant.id,
    slug: product.slug,
    name: product.name,
    size: variant.size,
    color: variant.color,
    priceCents: variant.priceCents ?? product.basePriceCents,
    currency: product.currency,
    quantity,
  };
}

// Carts saved before lines had their own id: every line was plain and keyed
// by its variant.
type StoredCartItem = Omit<CartItem, 'lineId' | 'customization'> & Partial<CartItem>;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, variant, quantity = 1) => {
        const items = get().items;
        const existing = items.find((item) => item.lineId === variant.id);

        if (existing) {
          set({
            items: items.map((item) =>
              item.lineId === variant.id ? { ...item, quantity: item.quantity + quantity } : item,
            ),
          });
          toast.success(getTranslation().cart.added(product.name));
          return;
        }

        set({
          items: [
            ...items,
            {
              ...newLine(product, variant, quantity),
              lineId: variant.id,
              imageUrl: product.images[0]?.url ?? null,
              customization: null,
            },
          ],
        });
        toast.success(getTranslation().cart.added(product.name));
      },
      addCustomItem: (product, variant, customization, quantity = 1) => {
        set({
          items: [
            ...get().items,
            {
              ...newLine(product, variant, quantity),
              lineId: `${variant.id}:${randomUuid()}`,
              // The same photo the studio showed, and the one the API
              // snapshots onto the order (see imagesForVariant).
              imageUrl: imagesForVariant(product, variant.id)[0]?.url ?? null,
              customization,
            },
          ],
        });
        toast.success(getTranslation().cart.added(product.name));
      },
      removeItem: (lineId) => {
        const removed = get().items.find((item) => item.lineId === lineId);
        set({ items: get().items.filter((item) => item.lineId !== lineId) });
        if (removed) {
          toast.success(getTranslation().cart.removed(removed.name));
        }
      },
      setQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(lineId);
          return;
        }
        set({
          items: get().items.map((item) => (item.lineId === lineId ? { ...item, quantity } : item)),
        });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'dinastore-cart',
      version: 1,
      migrate: (persisted) => {
        const state = (persisted ?? {}) as { items?: StoredCartItem[] };
        return {
          items: (state.items ?? []).map((item) => ({
            ...item,
            lineId: item.lineId ?? item.productVariantId,
            customization: item.customization ?? null,
          })),
        };
      },
    },
  ),
);

export function useCartCount(): number {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}

export function useCartTotalCents(): number {
  return useCartStore((state) => state.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0));
}
