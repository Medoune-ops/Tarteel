/** POST/GET /me/support — Paramètres → Support (conversation continue avec l'équipe support). */
import { apiFetch } from './client';

export interface SupportMessageResult {
  id: string;
  createdAt: string;
}

export interface SupportThreadMessage {
  id: string;
  message: string;
  fromAdmin: boolean;
  createdAt: string;
}

export async function sendSupportMessage(message: string): Promise<SupportMessageResult> {
  return apiFetch<SupportMessageResult>('/me/support', {
    method: 'POST',
    json: { message },
  });
}

/** Lit tout le fil de la conversation, du plus ancien au plus récent. */
export async function getSupportThread(): Promise<SupportThreadMessage[]> {
  const { messages } = await apiFetch<{ messages: SupportThreadMessage[] }>('/me/support');
  return messages;
}
