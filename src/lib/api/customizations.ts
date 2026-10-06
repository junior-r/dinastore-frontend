import { apiFetch } from '../api-client';
import type { Design, DesignCrop, StudioConfig } from '../types';

// Public: the studio can be explored signed out.
export function getStudioConfig(): Promise<StudioConfig> {
  return apiFetch<StudioConfig>('/customizations/config');
}

// The original file is sent untouched. Unlike a comment image it is never
// compressed in the browser first: this is what gets printed.
//
// With a `crop`, the server keeps only that part. Cropping again means
// uploading the same original with different numbers, so no quality is lost
// to a browser re-encode.
export function uploadDesign(file: File, token: string, crop?: DesignCrop | null): Promise<Design> {
  const form = new FormData();
  form.append('file', file);
  if (crop) {
    form.append('cropX', String(crop.x));
    form.append('cropY', String(crop.y));
    form.append('cropWidth', String(crop.width));
    form.append('cropHeight', String(crop.height));
  }
  return apiFetch<Design>('/customizations/designs', { method: 'POST', body: form, token });
}
