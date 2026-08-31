"use client";

/**
 * Parses JWT token payload without external libraries.
 */
function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks whether a given JWT token is still valid (not expired).
 */
export function isJwtValid(token: string): boolean {
  if (!token || token === "undefined" || token === "null") return false;
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  
  // Check expiration if 'exp' claim is present
  if (typeof payload.exp === "number") {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    // Token is valid if expiration is in the future
    return payload.exp > currentTimeInSeconds;
  }
  
  return true;
}

/**
 * Retrieves the stored token from localStorage.
 * If token is missing, invalid, or expired, it automatically cleans it up and returns null.
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      if (token !== null) {
        localStorage.removeItem("token");
      }
      return null;
    }

    if (!isJwtValid(token)) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-change"));
      return null;
    }

    return token;
  } catch {
    return null;
  }
}

/**
 * Checks if the user is currently authenticated with a valid token.
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

/**
 * Saves token to localStorage and notifies components of auth state change.
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-change"));
}

/**
 * Clears token from localStorage and notifies components of auth state change.
 */
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth-change"));
}
