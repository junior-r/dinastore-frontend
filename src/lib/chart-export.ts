/**
 * Turns an on-page SVG chart into a PNG file.
 *
 * The charts are styled with Tailwind classes and theme tokens, none of which
 * exist once the SVG is lifted out of the page and drawn as an image. So the
 * export works on a copy with every element's *computed* style written onto
 * it, which also means the PNG matches the theme (light or dark) the person
 * is looking at.
 */

interface ExportOptions {
  title: string;
  /** A second line under the title: the period, the filters in effect. */
  subtitle?: string;
  /** Device pixels per CSS pixel. 2 keeps text crisp when pasted into a doc. */
  scale?: number;
}

// The properties that decide how an SVG mark or label looks. Copying only
// these (rather than every computed property) keeps the serialized file small.
const STYLE_PROPERTIES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-opacity',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'opacity',
  'font-family',
  'font-size',
  'font-weight',
  'text-anchor',
  'dominant-baseline',
  'visibility',
  'display',
];

const PADDING = 24;
const TITLE_SIZE = 18;
const SUBTITLE_SIZE = 13;
const HEADER_GAP = 16;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function serialize(svg: SVGSVGElement): { markup: string; width: number; height: number } {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  const originals = svg.querySelectorAll<SVGElement>('*');
  const copies = copy.querySelectorAll<SVGElement>('*');

  originals.forEach((original, index) => {
    const computed = getComputedStyle(original);
    const target = copies[index];
    for (const property of STYLE_PROPERTIES) {
      target.style.setProperty(property, computed.getPropertyValue(property));
    }
    target.removeAttribute('class');
  });

  // Hover state (crosshair, hit areas) belongs to the live chart, not the file.
  copy.querySelectorAll('[data-export-ignore]').forEach((node) => node.remove());

  const { width, height } = svg.viewBox.baseVal;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('width', String(width));
  copy.setAttribute('height', String(height));
  copy.removeAttribute('class');
  copy.removeAttribute('style');

  return { markup: new XMLSerializer().serializeToString(copy), width, height };
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('The chart could not be drawn as an image.'));
    image.src = source;
  });
}

export async function svgToPngBlob(svg: SVGSVGElement, options: ExportOptions): Promise<Blob> {
  // Let the "preparing" state paint before the synchronous part below.
  await nextFrame();

  const scale = options.scale ?? 2;
  const { markup, width, height } = serialize(svg);
  const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`);

  const headerHeight = TITLE_SIZE + (options.subtitle ? SUBTITLE_SIZE + 8 : 0) + HEADER_GAP;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round((width + PADDING * 2) * scale);
  canvas.height = Math.round((height + headerHeight + PADDING * 2) * scale);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser cannot draw images.');
  }
  context.scale(scale, scale);

  // An opaque background: a transparent PNG pasted onto a dark slide would
  // lose its dark-on-light labels.
  context.fillStyle = token('--color-surface', '#ffffff');
  context.fillRect(0, 0, width + PADDING * 2, height + headerHeight + PADDING * 2);

  const fontFamily = getComputedStyle(document.body).fontFamily;
  context.textBaseline = 'top';
  context.fillStyle = token('--color-content', '#111111');
  context.font = `700 ${TITLE_SIZE}px ${fontFamily}`;
  context.fillText(options.title, PADDING, PADDING);
  if (options.subtitle) {
    context.fillStyle = token('--color-content-muted', '#666666');
    context.font = `400 ${SUBTITLE_SIZE}px ${fontFamily}`;
    context.fillText(options.subtitle, PADDING, PADDING + TITLE_SIZE + 8);
  }

  context.drawImage(image, PADDING, PADDING + headerHeight, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('The image could not be created.'));
      }
    }, 'image/png');
  });
}
