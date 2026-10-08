import { ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n';
import { useFormat } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useCartStore } from '@/stores/cart-store';
import { ConfirmPrompt } from '../ui/ConfirmDialog';
import Modal from '../ui/Modal';
import QuantityStepper from '../ui/QuantityStepper';
import VariantPicker from './VariantPicker';
import { firstAvailableVariant } from '@/lib/variants';

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

// Opened from the catalog list view's cart button. Quantity (and, for
// multi-variant products, size/color) are asked here instead of inline on the
// card so the grid itself stays uncluttered.
export default function AddToCartModal({ product, open, onClose }: Props) {
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const t = useTranslation();
  const format = useFormat();

  useEffect(() => {
    if (open) {
      setSelectedVariantId(firstAvailableVariant(product.variants)?.id ?? null);
      setQuantity(1);
      setConfirmingRemove(false);
    }
  }, [open, product]);

  const selectedVariant = product.variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const isInCart = Boolean(
    selectedVariant && items.some((item) => item.lineId === selectedVariant.id),
  );
  const coverImage = product.images[0];

  return (
    <Modal open={open} onClose={onClose} title={confirmingRemove ? t.cart.removeFromCart : product.name}>
      {confirmingRemove ? (
        <ConfirmPrompt
          message={
            selectedVariant
              ? t.cart.confirmRemoveVariant(product.name, selectedVariant.size, selectedVariant.color)
              : t.cart.confirmRemove(product.name)
          }
          confirmLabel={t.common.remove}
          danger
          onCancel={() => setConfirmingRemove(false)}
          onConfirm={() => {
            if (selectedVariant) {
              removeItem(selectedVariant.id);
            }
            onClose();
          }}
        />
      ) : (
        <div>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-surface-muted">
              {coverImage && (
                <img src={coverImage.url} alt={coverImage.altText ?? product.name} className="h-full w-full object-cover" />
              )}
            </div>
            <p className="text-sm text-content-muted">{format.money(product.basePriceCents, product.currency)}</p>
          </div>

          {product.variants.length === 0 ? (
            <p className="mt-4 text-sm text-content-muted">{t.catalog.noOptions}</p>
          ) : (
            <>
              {product.variants.length > 1 && (
                <div className="mt-4">
                  <VariantPicker
                    variants={product.variants}
                    value={selectedVariantId}
                    onChange={setSelectedVariantId}
                  />
                </div>
              )}

              {selectedVariant && selectedVariant.stock > 0 && !isInCart && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-content">{t.common.quantity}</h3>
                  <div className="mt-2">
                    <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={selectedVariant.stock} />
                  </div>
                </div>
              )}

              {isInCart ? (
                <button
                  type="button"
                  onClick={() => setConfirmingRemove(true)}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-danger px-5 py-2.5 text-sm font-medium text-content-inverse hover:opacity-90"
                >
                  <Trash2 size={16} />
                  {t.cart.removeFromCart}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!selectedVariant || selectedVariant.stock === 0}
                  onClick={() => {
                    if (selectedVariant) {
                      addItem(product, selectedVariant, quantity);
                      onClose();
                    }
                  }}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart size={16} />
                  {selectedVariant && selectedVariant.stock === 0 ? t.cart.outOfStock : t.cart.addToCart}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
