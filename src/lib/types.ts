export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceCents: number | null;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  // Variant ids this image applies to. Empty means it applies to every
  // variant (the default for an image nobody has tagged).
  variantIds: string[];
}

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePriceCents: number;
  currency: string;
  status: ProductStatus;
  categoryIds: string[];
  totalStock: number;
  variants: ProductVariant[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export type Role = 'CUSTOMER' | 'STAFF' | 'ADMIN';

// Mirrors the backend's fixed Permission enum values exactly — only
// meaningful for STAFF (ADMIN bypasses permission checks entirely).
export type Permission =
  | 'users:view'
  | 'users:manage'
  | 'products:view'
  | 'products:manage'
  | 'categories:view'
  | 'categories:manage'
  | 'analytics:view'
  | 'orders:view';

export interface User {
  id: string;
  email: string;
  name: string;
  // Only ever set from an OAuth provider's profile photo — password-only
  // accounts have no way to set one.
  avatarUrl: string | null;
  role: Role;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface PaginatedAdminUsers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

export interface OAuthAccountSummary {
  provider: string;
  providerAccountId: string;
  createdAt: string;
}

export interface AdminUserDetail extends User {
  hasPassword: boolean;
  oauthAccounts: OAuthAccountSummary[];
}

export type PaginatedAdminProducts = PaginatedProducts;

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productVariantId: string;
  productName: string;
  variantSize: string;
  variantColor: string;
  unitPriceCents: number;
  quantity: number;
  /** Null for a plain, uncustomized item. */
  customization: OrderItemCustomization | null;
}

/**
 * Where a design sits on a garment photo, as fractions of that photo: `x`
 * and `y` are the design's centre, `width` its width.
 */
export interface DesignPlacement {
  x: number;
  y: number;
  width: number;
}

/**
 * The part of an uploaded file to keep, as fractions of the image the way it
 * is displayed. The browser previews with these and the server cuts the
 * original with the same four numbers.
 */
export interface DesignCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** An uploaded design, as the API returns it. */
export interface Design {
  id: string;
  /** Preview with the store logo already applied. */
  thumbnailUrl: string;
  width: number;
  height: number;
  createdAt: string;
}

/** What the studio needs to preview a design the way the server renders it. */
export interface StudioConfig {
  logo: {
    url: string;
    width: number;
    height: number;
    widthRatio: number;
    maxHeightRatio: number;
    marginRatio: number;
  };
  upload: {
    maxBytes: number;
    acceptedTypes: string[];
    minEdgePx: number;
  };
}

export interface OrderItemCustomization {
  designId: string;
  thumbnailUrl: string;
  /** The garment photo the placement is relative to, if there was one. */
  garmentImageUrl: string | null;
  placement: DesignPlacement;
}

/** One ordered item with a customer design, as the admin print list returns it. */
export interface CustomOrderItem {
  orderId: string;
  orderStatus: OrderStatus;
  orderedAt: string;
  customer: { id: string; name: string; email: string };
  item: OrderItem & { customization: OrderItemCustomization };
  /** The full-resolution, logo-applied file to send to the printer. */
  printUrl: string;
}

export interface PaginatedCustomOrderItems {
  items: CustomOrderItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  currency: string;
  subtotalCents: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CommentImage {
  /** Full-size version — only fetched when the reader opens the image. */
  url: string;
  /** Small version shown inline in the thread. */
  thumbnailUrl: string;
  /** Pixel size of the full image; lets the UI reserve the box up front. */
  width: number;
  height: number;
}

export interface Comment {
  id: string;
  productId: string;
  body: string;
  /** Null for a root comment. */
  parentId: string | null;
  /** 1..3 — the nesting level the API assigned (see MAX_COMMENT_DEPTH). */
  depth: number;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  /** False for anonymous readers, who still see the count. */
  likedByViewer: boolean;
  /** At most one image per comment; null when there is none. */
  image: CommentImage | null;
  createdAt: string;
}

export interface PaginatedComments {
  /** Each root comment immediately followed by its own replies, in order. */
  items: Comment[];
  /** Every comment on the product, replies included. */
  total: number;
  /** Root comments only — what page/pageSize index into. */
  rootTotal: number;
  page: number;
  pageSize: number;
}

/** A shopper's star rating of a product, with or without a comment. */
export interface Review {
  id: string;
  productId: string;
  /** Whole stars, 1..5. */
  rating: number;
  /** Null when the rating was left without a comment. */
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A review as the public list returns it, with who wrote it. */
export interface ListedReview extends Review {
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

export interface RatingSummary {
  /** Mean of every rating, to two decimals. Null while nobody has rated. */
  average: number | null;
  /** Every rating, with or without a comment. */
  count: number;
  /** How many ratings each star value got, keyed "1".."5". */
  distribution: Record<string, number>;
}

export interface ProductReviews {
  /** A page of the reviews that carry a comment. */
  items: ListedReview[];
  /** How many reviews carry a comment: what page/pageSize index into. */
  total: number;
  page: number;
  pageSize: number;
  summary: RatingSummary;
  /** The reader's own review. Null when signed out or not rated yet. */
  viewerReview: Review | null;
}

/** One visit to a product page, as the admin history returns it. */
export interface ProductViewRecord {
  id: string;
  // `id` and `slug` are null once the product has been deleted; `name` is a
  // snapshot from the time of the visit and is always there.
  product: { id: string | null; name: string; slug: string | null };
  /** Null for a visitor who was not signed in. */
  user: { id: string; name: string; email: string } | null;
  /** Anonymous per-browser id; groups visits by someone who never signs in. */
  visitorId: string;
  ipAddress: string;
  /** ISO 3166-1 alpha-2, or null when the address couldn't be placed. */
  country: string | null;
  /** Time the page was actually visible, in milliseconds. */
  durationMs: number;
  favorited: boolean;
  startedAt: string;
  lastSeenAt: string;
}

export interface PaginatedProductViews {
  items: ProductViewRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CommentLikeState {
  commentId: string;
  liked: boolean;
  likeCount: number;
}
