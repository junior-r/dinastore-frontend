export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiErrorBody {
  message?: string | string[];
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  searchParams?: Record<string, string | number | string[] | undefined>;
  // Lets the request outlive the page that sent it. For reports sent as the
  // visitor is leaving, which the browser would otherwise cancel on unload.
  keepalive?: boolean;
}

function buildUrl(path: string, searchParams?: RequestOptions['searchParams']): string {
  const url = new URL(path, import.meta.env.PUBLIC_API_URL);
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length > 0) {
        url.searchParams.set(key, value.join(','));
      }
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  // A FormData body is sent as-is: the browser has to set the multipart
  // Content-Type itself, because it carries the boundary.
  const isFormData = options.body instanceof FormData;
  if (options.body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(buildUrl(path, options.searchParams), {
    method: options.method ?? 'GET',
    headers,
    keepalive: options.keepalive,
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    const message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? 'Request failed');
    throw new ApiError(response.status, message);
  }

  return data as T;
}

interface UploadOptions {
  token?: string;
  fieldName?: string;
}

// Separate from apiFetch because file uploads need a multipart body (the
// browser sets its own Content-Type with the multipart boundary) instead of
// JSON.
export async function apiUpload<T>(path: string, files: File[], options: UploadOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append(options.fieldName ?? 'files', file);
  }

  const response = await fetch(buildUrl(path), { method: 'POST', headers, body: formData });
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = (data ?? {}) as ApiErrorBody;
    const message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? 'Upload failed');
    throw new ApiError(response.status, message);
  }

  return data as T;
}
