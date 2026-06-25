const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const getToken = (): string | null => localStorage.getItem("token");

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.message ?? "Request failed") as Error & { status: number };
    error.status = res.status;
    throw error;
  }

  return data as T;
};

export const api = {
  get:   <T>(path: string) => request<T>("GET", path),
  post:  <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};