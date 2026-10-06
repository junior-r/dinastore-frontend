import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type SubmitEvent } from 'react';
import { useTranslation } from '@/i18n';
import type { ProductVariantInput } from '@/lib/api/admin';
import { DEFAULT_CURRENCY } from '@/lib/constants';
import {
  useCreateProduct,
  useUpdateProduct,
  useUpdateProductImages,
  useUpdateProductVariants,
} from '@/lib/queries/admin';
import { productQueryOptions, useCategories } from '@/lib/queries/products';
import CategoryMultiSelect from './product-form/CategoryMultiSelect';
import ProductImagesField from './product-form/ProductImagesField';
import VariantFormModal from './product-form/VariantFormModal';
import { inputClass, type PendingImage } from './product-form/shared';

type Props = ({ mode: 'create' } | { mode: 'edit'; slug: string }) & { onSaved: () => void };

// The create/edit form itself: its fields, its state, and the submit
// sequence. The self-contained parts (image upload and ordering, the
// add-variant dialog, the category picker) live in ./product-form/, one
// component per file.
export default function AdminProductFormView(props: Props) {
  const t = useTranslation();
  const { data: categories } = useCategories();
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    ...productQueryOptions(props.mode === 'edit' ? props.slug : ''),
    enabled: props.mode === 'edit',
  });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const updateProductVariants = useUpdateProductVariants();
  const updateProductImages = useUpdateProductImages();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0.00');
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariantInput[]>([]);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [images, setImages] = useState<PendingImage[]>([]);

  useEffect(() => {
    if (props.mode === 'edit' && product) {
      setName(product.name);
      setDescription(product.description ?? '');
      setPrice((product.basePriceCents / 100).toFixed(2));
      setCurrency(product.currency);
      setCategoryIds(product.categoryIds);
      setVariants(
        product.variants.map((variant) => ({
          id: variant.id,
          size: variant.size,
          color: variant.color,
          sku: variant.sku,
          stock: variant.stock,
          priceCents: variant.priceCents ?? undefined,
        })),
      );
      setImages(
        product.images.map((image) => ({
          id: crypto.randomUUID(),
          dbId: image.id,
          previewUrl: image.url,
          status: 'done',
          url: image.url,
          variantIndexes: image.variantIds
            .map((variantId) => product.variants.findIndex((variant) => variant.id === variantId))
            .filter((index) => index !== -1),
        })),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, product]);

  if (props.mode === 'edit' && isLoadingProduct) {
    return <p className="text-content-muted">{t.common.loading}</p>;
  }
  if (props.mode === 'edit' && !product) {
    return <p className="text-content-muted">{t.admin.products.notFound}</p>;
  }

  function removeVariant(index: number) {
    setVariants((current) => current.filter((_, i) => i !== index));
    // Keep every image's variantIndexes pointing at the same variant after
    // the removal shifts everything after `index` down by one.
    setImages((current) =>
      current.map((image) => ({
        ...image,
        variantIndexes: image.variantIndexes.filter((i) => i !== index).map((i) => (i > index ? i - 1 : i)),
      })),
    );
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const basePriceCents = Math.round(parseFloat(price) * 100);

    if (props.mode === 'create') {
      const uploadedImages = images.filter(
        (image): image is PendingImage & { url: string } => image.status === 'done' && Boolean(image.url),
      );
      await createProduct.mutateAsync({
        name,
        slug,
        description: description || undefined,
        basePriceCents,
        currency,
        categoryIds,
        variants: variants.length > 0 ? variants : undefined,
        images:
          uploadedImages.length > 0
            ? uploadedImages.map((image, index) => ({
                url: image.url,
                position: index,
                variantIndexes: image.variantIndexes.length > 0 ? image.variantIndexes : undefined,
              }))
            : undefined,
      });
      props.onSaved();
      return;
    }

    if (product) {
      await updateProduct.mutateAsync({
        id: product.id,
        payload: { name, description: description || undefined, basePriceCents, currency, categoryIds },
      });

      // Existing variants (an `id` from hydration) resolve to the same id;
      // brand-new ones (added this session, no id yet) get theirs back from
      // the response, matched by sku since it's unique per request. Only
      // once every local variant has a real id can images be tagged
      // correctly below -- create()'s index scheme doesn't apply here since
      // edit mode never lacks real ids for long.
      let finalVariants = variants;
      if (variants.length > 0 || product.variants.length > 0) {
        const variantsResult = await updateProductVariants.mutateAsync({
          id: product.id,
          slug: product.slug,
          variants: variants.map((variant) =>
            variant.id
              ? { id: variant.id, stock: variant.stock, priceCents: variant.priceCents }
              : {
                  size: variant.size,
                  color: variant.color,
                  sku: variant.sku,
                  stock: variant.stock,
                  priceCents: variant.priceCents,
                },
          ),
        });
        const idBySku = new Map(variantsResult.variants.map((v) => [v.sku, v.id]));
        finalVariants = variants.map((variant) => ({ ...variant, id: variant.id ?? idBySku.get(variant.sku) }));
      }

      const uploadedImages = images.filter(
        (image): image is PendingImage & { url: string } => image.status === 'done' && Boolean(image.url),
      );
      if (uploadedImages.length > 0 || product.images.length > 0) {
        await updateProductImages.mutateAsync({
          id: product.id,
          slug: product.slug,
          images: uploadedImages.map((image, index) => ({
            id: image.dbId,
            url: image.url,
            position: index,
            variantIds: image.variantIndexes
              .map((variantIndex) => finalVariants[variantIndex]?.id)
              .filter((id): id is string => Boolean(id)),
          })),
        });
      }

      props.onSaved();
    }
  }

  const imagesUploading = images.some((image) => image.status === 'uploading');
  const submitting =
    createProduct.isPending ||
    updateProduct.isPending ||
    updateProductVariants.isPending ||
    updateProductImages.isPending ||
    imagesUploading;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-content">
          {t.admin.products.name}
        </label>
        <input id="name" required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
      </div>

      {props.mode === 'create' && (
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-content">
            {t.admin.products.slug}
          </label>
          <input
            id="slug"
            required
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            title={t.admin.products.slugTitle}
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-content">
          {t.admin.products.description}
        </label>
        <textarea
          id="description"
          rows={3}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-content">
            {t.admin.products.price}
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-content">
            {t.admin.products.currency}
          </label>
          <input
            id="currency"
            required
            maxLength={3}
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-content">{t.admin.products.categories}</span>
        <CategoryMultiSelect categories={categories ?? []} selectedIds={categoryIds} onChange={setCategoryIds} />
      </div>

      <ProductImagesField images={images} onChange={setImages} variants={variants} />

      <div>
        <span className="block text-sm font-medium text-content">{t.admin.products.variants}</span>
        {props.mode === 'edit' && (
          <p className="mt-1 text-xs text-content-muted">
            {t.admin.products.variantsLockedHint}
          </p>
        )}
        <div className="mt-2 space-y-2">
          {variants.length === 0 && <p className="text-sm text-content-muted">{t.admin.products.noVariants}</p>}
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? index}
              className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm text-content"
            >
              <span>
                {variant.size} / {variant.color} ({variant.sku})
              </span>
              {variant.id ? (
                <label className="flex items-center gap-1.5 text-xs text-content-muted">
                  {t.admin.products.stock}
                  <input
                    type="number"
                    min="0"
                    value={variant.stock}
                    onChange={(event) =>
                      setVariants((current) =>
                        current.map((v, i) => (i === index ? { ...v, stock: Number(event.target.value) || 0 } : v)),
                      )
                    }
                    className="w-16 rounded border border-border bg-surface px-1.5 py-1 text-sm text-content focus:border-brand focus:outline-none"
                  />
                </label>
              ) : (
                <span className="text-content-muted">{t.admin.products.inStock(variant.stock)}</span>
              )}
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="cursor-pointer text-xs font-medium text-danger hover:underline"
              >
                {t.common.remove}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setIsVariantModalOpen(true)}
            className="cursor-pointer text-sm font-medium text-brand hover:underline"
          >
            {t.admin.products.addVariantPlus}
          </button>
        </div>
        <VariantFormModal
          open={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          onAdd={(variant) => setVariants((current) => [...current, variant])}
        />
      </div>

      <button
        type="submit"
        disabled={submitting || categoryIds.length === 0}
        className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-content hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {imagesUploading
          ? t.admin.products.uploadingImages
          : submitting
            ? t.common.saving
            : props.mode === 'create'
              ? t.admin.products.createProduct
              : t.common.saveChanges}
      </button>
    </form>
  );
}
