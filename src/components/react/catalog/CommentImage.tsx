import type { CommentImage as CommentImageData } from '@/lib/types';

interface Props {
  image: CommentImageData;
  alt: string;
  openLabel: string;
}

// Largest box (CSS px) the thumbnail is shown in. The API's thumbnail is 480px
// on its long edge, so this stays sharp on 2x screens.
const DISPLAY_BOX = 240;

/**
 * A comment's attached picture. Only the small thumbnail is ever loaded in
 * the thread; the full-size file is fetched if and when the reader opens it.
 */
export default function CommentImage({ image, alt, openLabel }: Props) {
  const scale = Math.min(1, DISPLAY_BOX / image.width, DISPLAY_BOX / image.height);
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  return (
    <a
      href={image.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={openLabel}
      // The box is sized from the dimensions the API sends, before a single
      // byte of the image arrives — so a lazy image loading in later never
      // pushes the comments below it down the page.
      style={{ width, aspectRatio: `${image.width} / ${image.height}` }}
      className="mt-2 block max-w-full overflow-hidden rounded-md border border-border bg-surface-muted"
    >
      <img
        src={image.thumbnailUrl}
        alt={alt}
        width={width}
        height={height}
        // Not requested until it is about to scroll into view, and decoded
        // off the main thread — a long thread costs nothing up front.
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover"
      />
    </a>
  );
}
