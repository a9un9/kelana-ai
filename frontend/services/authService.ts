import { getToken, logout } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      logout();
    }
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

function getAuthHeaders(includeContentType = true) {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(payload: any) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function register(payload: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function getProfile() {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: getAuthHeaders(false),
  });
  return handleResponse<{
    id: number;
    name: string;
    email: string;
    created_at: string;
    updated_at?: string | null;
  }>(res);
}

export async function updateProfile(payload: { name: string; email: string; password?: string }) {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: JSON.stringify(payload),
  });
  return handleResponse<{
    message: string;
    user: {
      id: number;
      name: string;
      email: string;
      created_at: string;
      updated_at?: string | null;
    };
  }>(res);
}
