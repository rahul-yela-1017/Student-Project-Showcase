/**
 * Thin fetch wrapper for the same-origin REST API.
 * - Sends the `x-requested-with` header used for CSRF protection.
 * - Normalizes error messages from the { success, error } envelope.
 */
export class ApiClientError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-requested-with": "XMLHttpRequest",
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiClientError("Network error. Please check your connection.", 0);
  }
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json || !("success" in json) || !json.success) {
    const message =
      json && "error" in json && typeof json.error === "string"
        ? json.error
        : `Request failed (${res.status}).`;
    throw new ApiClientError(message, res.status);
  }
  return (json as { success: true; data: T }).data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  del: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
