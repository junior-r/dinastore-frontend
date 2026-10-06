/** Mirrors the backend's accepted formats (see SharpImageProcessor). */
export const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/** Mirrors the backend's MAX_COMMENT_IMAGE_BYTES. */
export const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;

// The API keeps nothing larger than this on its long edge, so sending more
// pixels than that is pure upload time.
const MAX_EDGE = 1600;

// Deliberately high: the server re-encodes to its own quality afterwards, and
// compressing hard twice compounds the artefacts.
const QUALITY = 0.9;

/**
 * Shrinks a photo in the browser before it is uploaded — a 12 MP phone
 * picture goes from several MB to a few hundred KB, which is the difference
 * between an instant post and a visible wait on a mobile connection.
 *
 * This is only a transfer optimization. The server validates and re-encodes
 * whatever arrives regardless, so every failure path here just returns the
 * original file untouched rather than blocking the comment.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    // `from-image` applies the EXIF orientation while decoding, so a portrait
    // phone photo isn't drawn onto the canvas sideways.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', QUALITY),
    );

    // Browsers that can't encode WebP silently hand back a PNG instead, which
    // for a photo is usually *bigger* than the JPEG it came from — so the
    // result is only used when it is genuinely WebP and genuinely smaller.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${name}.webp`, { type: 'image/webp' });
  } catch {
    return file;
  }
}
