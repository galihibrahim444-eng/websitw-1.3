const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$|\s+/g, "") ??
  "http://localhost:3000";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("maqil.auth.session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? null;
  } catch {
    return null;
  }
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
) {
  const url = path.startsWith("http")
    ? new URL(path)
    : new URL(`${API_BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & {
    auth?: boolean;
    params?: Record<string, string | number | boolean | undefined>;
  },
): Promise<T> {
  const { auth = true, params, headers, body, ...rest } = options ?? {};
  const url = buildUrl(path, params);
  const token = auth ? getAuthToken() : null;

  const init: RequestInit = {
    method: options?.method ?? (body !== undefined ? "POST" : "GET"),
    headers: {
      ...headers,
      ...(body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body:
      body !== undefined && typeof body !== "string"
        ? JSON.stringify(body)
        : body,
    ...rest,
  };

  const response = await fetch(url, init);
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? (data as any).message
        : response.statusText;
    throw new Error(
      `API request failed: ${response.status} ${response.statusText} – ${message}`,
    );
  }

  return data as T;
}

export { API_BASE_URL };
