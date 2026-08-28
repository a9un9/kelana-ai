import type { Trip, TripRequest, TripResult, GenerateResult } from "@/types";

// Read API URL from .env - no more hardcoding
const API_URL = process.env.NEXT_PUBLIC_API_URL;


// ─── Helpers ───────────────────────────────────────────────────────────────────

function getAuthHeaders(includeContentType = true) {
  const headers: Record<string, string> = {};
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// ─── API Calls ─────────────────────────────────────────────────────────────────

/** POST /api/v1/trips — create a new trip summary */
export async function createTrip(payload: Omit<TripRequest, 'user_id'>): Promise<TripResult> {
  const res = await fetch(`${API_URL}/trips`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<TripResult>(res);
}

/** GET /api/v1/trips — fetch all saved trips */
export async function listTrips(): Promise<Trip[]> {
  const res = await fetch(`${API_URL}/trips`, { 
    cache: "no-store",
    headers: getAuthHeaders(false)
  });
  return handleResponse<Trip[]>(res);
}

/** GET /api/v1/trips/:id — fetch a single trip */
export async function getTrip(id: number): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips/${id}`, {
    cache: "no-store",
    headers: getAuthHeaders(false)
  });
  return handleResponse<Trip>(res);
}

/** POST /api/v1/trips/:id/generate — generate AI itinerary for a trip */
export async function generateItinerary(id: number): Promise<GenerateResult> {
  const res = await fetch(`${API_URL}/trips/${id}/generate`, {
    method: "POST",
    headers: getAuthHeaders(false)
  });
  return handleResponse<GenerateResult>(res);
}

/** DELETE /api/v1/trips/:id — delete a trip */
export async function deleteTrip(id: number): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/trips/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(false)
  });
  return handleResponse<{ message: string }>(res);
}

/** PUT /api/v1/trips/:id — update an existing trip */
export async function updateTrip(
  id: number,
  payload: Omit<TripRequest, 'user_id'>
): Promise<Trip> {
  const res = await fetch(`${API_URL}/trips/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  return handleResponse<Trip>(res);
}
