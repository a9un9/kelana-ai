import type { Conversation, Message } from "@/types";
import { getToken, logout } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

/** POST /api/v1/conversations — create a new conversation */
export async function createConversation(title?: string): Promise<{ conversation_id: number }> {
  const res = await fetch(`${API_URL}/conversations`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(title ? { title } : {}),
  });
  return handleResponse<{ conversation_id: number }>(res);
}

/** GET /api/v1/conversations — list previous conversations */
export async function listConversations(): Promise<Conversation[]> {
  const res = await fetch(`${API_URL}/conversations`, {
    cache: "no-store",
    headers: getAuthHeaders(false),
  });
  return handleResponse<Conversation[]>(res);
}

/** GET /api/v1/conversations/:id/messages — list all messages */
export async function listMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    cache: "no-store",
    headers: getAuthHeaders(false),
  });
  return handleResponse<Message[]>(res);
}

/** POST /api/v1/conversations/:id/messages — send a message & get AI reply */
export async function sendMessage(
  conversationId: number,
  content: string
): Promise<{ conversation_id: number; role: "assistant"; content: string; created_at: string }> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });
  return handleResponse<{ conversation_id: number; role: "assistant"; content: string; created_at: string }>(res);
}

/** PATCH /api/v1/conversations/:id — rename a conversation */
export async function renameConversation(
  conversationId: number,
  title: string
): Promise<Conversation> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });
  return handleResponse<Conversation>(res);
}

/** DELETE /api/v1/conversations/:id — delete a conversation */
export async function deleteConversation(
  conversationId: number
): Promise<{ message: string }> {
  const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(false),
  });
  return handleResponse<{ message: string }>(res);
}
