import type { Product, ProductImage, ProductVariant } from './types';

/**
 * The variant to preselect when a product is first shown: the first one in
 * stock, or failing that the first one at all (so a fully sold-out product
 * still shows a size and color, marked unavailable, rather than nothing).
 *
 * The product page, the add-to-cart modal and the variant picker must agree
 * on this, which is why it lives here and not in each of them.
 */
export function firstAvailableVariant(variants: ProductVariant[]): ProductVariant | null {
  return variants.find((variant) => variant.stock > 0) ?? variants[0] ?? null;
}

/**
 * The photos that apply to a variant: those tagged to it or to no variant at
 * all, falling back to every photo when none match. The first of these is the
 * one the design studio places artwork on, and the API snapshots that same
 * photo onto a customized order line (`firstImageFor` in the backend's
 * product-catalog adapter), so this rule and that one must stay equal.
 */
export function imagesForVariant(product: Product, variantId: string | null): ProductImage[] {
  if (!variantId) {
    return product.images;
  }
  const matches = product.images.filter(
    (image) => image.variantIds.length === 0 || image.variantIds.includes(variantId),
  );
  return matches.length > 0 ? matches : product.images;
}
