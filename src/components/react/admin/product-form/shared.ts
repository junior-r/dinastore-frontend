// Pieces the product form's parts have in common.

export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/webp', 'image/jpeg'];

export interface PendingImage {
  id: string;
  // Set only for an image that already exists in the DB (edit mode
  // hydration) -- absent means "not yet created", so submit sends no `id`
  // and the backend creates a fresh row. Distinct from `id` above, which is
  // just a local React-key/tracking id and never sent to the API.
  dbId?: string;
  // Absent for images hydrated from an existing product -- they're already
  // uploaded, so there's nothing left to upload.
  file?: File;
  previewUrl: string;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  // Indexes into the form's `variants` array this image applies to.
  // Empty means "every variant" -- the default for an untagged image.
  variantIndexes: number[];
}

export const inputClass =
  'mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-content focus:border-brand focus:outline-none';
