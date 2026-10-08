import { useEffect, useState, type SubmitEvent } from 'react';
import { useTranslation } from '@/i18n';
import type { ProductVariantInput } from '@/lib/api/admin';
import Modal from '../../ui/Modal';
import { inputClass } from './shared';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (variant: ProductVariantInput) => void;
}

function emptyVariantDraft() {
  return { size: '', color: '', sku: '', stock: '0' };
}

export default function VariantFormModal({ open, onClose, onAdd }: Props) {
  const t = useTranslation();
  const [draft, setDraft] = useState(emptyVariantDraft());

  useEffect(() => {
    if (open) {
      setDraft(emptyVariantDraft());
    }
  }, [open]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    // This modal is portaled to <body> (see Modal.tsx), so it sits outside
    // the product form in the DOM -- but React re-fires bubbled events
    // along the *component* tree, not the DOM tree, for portaled content.
    // Without this, submitting this form also bubbles up and triggers the
    // outer product form's onSubmit in the same tick (with `variants` still
    // one add stale, since that closure was captured before this submit).
    event.stopPropagation();
    if (!draft.size.trim() || !draft.color.trim() || !draft.sku.trim()) {
      return;
    }
    onAdd({
      size: draft.size.trim(),
      color: draft.color.trim(),
      sku: draft.sku.trim(),
      stock: Number(draft.stock) || 0,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.admin.products.addVariant}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="variant-size" className="block text-sm font-medium text-content">
              {t.admin.products.size}
            </label>
            <input
              id="variant-size"
              required
              value={draft.size}
              onChange={(event) => setDraft((current) => ({ ...current, size: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="variant-color" className="block text-sm font-medium text-content">
              {t.admin.products.color}
            </label>
            <input
              id="variant-color"
              required
              value={draft.color}
              onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
        <div>
          <label htmlFor="variant-sku" className="block text-sm font-medium text-content">
            {t.admin.products.sku}
          </label>
          <input
            id="variant-sku"
            required
            value={draft.sku}
            onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="variant-stock" className="block text-sm font-medium text-content">
            {t.admin.products.stock}
          </label>
          <input
            id="variant-stock"
            type="number"
            min="0"
            value={draft.stock}
            onChange={(event) => setDraft((current) => ({ ...current, stock: event.target.value }))}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-content hover:bg-brand-hover"
        >
          {t.admin.products.addVariant}
        </button>
      </form>
    </Modal>
  );
}
