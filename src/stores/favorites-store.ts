import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { getTranslation } from '@/i18n';
import type { Product } from '../lib/types';

export interface FavoriteItem {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
}

interface FavoritesState {
  items: FavoriteItem[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) => {
        const items = get().items;
        if (items.some((item) => item.productId === product.id)) {
          set({ items: items.filter((item) => item.productId !== product.id) });
          toast.success(getTranslation().favorites.removed(product.name));
          return;
        }
        set({
          items: [
            ...items,
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              priceCents: product.basePriceCents,
              currency: product.currency,
              imageUrl: product.images[0]?.url ?? null,
            },
          ],
        });
        toast.success(getTranslation().favorites.added(product.name));
      },
      remove: (productId) => {
        const removed = get().items.find((item) => item.productId === productId);
        set({ items: get().items.filter((item) => item.productId !== productId) });
        if (removed) {
          toast.success(getTranslation().favorites.removed(removed.name));
        }
      },
    }),
    { name: 'dinastore-favorites' },
  ),
);

export function useIsFavorite(productId: string): boolean {
  return useFavoritesStore((state) => state.items.some((item) => item.productId === productId));
}

export function useFavoritesCount(): number {
  return useFavoritesStore((state) => state.items.length);
}
