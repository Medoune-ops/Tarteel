/**
 * Client HTTP unique pour le backend Tarteel.
 *
 *  - Préfixe chaque chemin relatif avec `API_URL` (lib/api/config.ts).
 *  - Ajoute `Authorization: Bearer <accessToken>` quand on est connecté.
 *  - Applique un timeout (API_TIMEOUT_MS) via AbortController.
 *  - Rafraîchit automatiquement l'access token sur un 401, puis rejoue la
 *    requête une fois. Les refresh concurrents sont dédupliqués (un seul appel
 *    réseau même si plusieurs requêtes échouent en 401 simultanément).
 */
import { API_URL, API_TIMEOUT_MS } from './config';
import {
  getAccessToken, getRefreshToken, getDeviceId, setTokens, clearTokens,
} from './tokens';

/** Erreur normalisée renvoyée par l'API (status + message convivial + code). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
    /** Code machine du backend (ex: VALIDATION_ERROR), pour les cas spécifiques. */
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Messages CONVIVIAUX par code d'erreur backend. On n'expose JAMAIS le message
 * technique brut du serveur à l'utilisateur — on le remplace par un texte clair.
 */
const FRIENDLY_BY_CODE: Record<string, string> = {
  // VALIDATION_ERROR est traité à part (message PAR CHAMP, cf. validationMessage).
  INVALID_CREDENTIALS: 'Email ou mot de passe incorrect.',
  EMAIL_TAKEN: 'Un compte existe déjà avec cet email.',
  USERNAME_TAKEN: "Ce nom d'utilisateur est déjà pris.",
  UNAUTHENTICATED: 'Session expirée. Reconnecte-toi.',
  TOKEN_EXPIRED: 'Session expirée. Reconnecte-toi.',
  TOKEN_REVOKED: 'Session expirée. Reconnecte-toi.',
  FORBIDDEN: "Tu n'as pas accès à cette action.",
  NOT_FOUND: 'Élément introuvable.',
  OUT_OF_HEARTS: 'Tu n\'as plus de cœurs.',
  RATE_LIMITED: 'Trop de tentatives. Réessaie dans un instant.',
  SERVICE_UNAVAILABLE: 'Service momentanément indisponible. Réessaie.',
  INTERNAL: 'Une erreur est survenue. Réessaie.',
};

/** Libellé lisible d'un champ pour les messages de validation. */
const FIELD_LABELS: Record<string, string> = {
  email: "L'adresse email",
  password: 'Le mot de passe',
  newPassword: 'Le nouveau mot de passe',
  currentPassword: 'Le mot de passe actuel',
  displayName: 'Le nom complet',
  name: 'Le nom',
};

/**
 * Traduit UN message d'erreur Zod (anglais, technique) en français clair, en
 * fonction du champ. On reconnaît les règles usuelles (email, longueur min/max,
 * requis) et on retombe sur un message générique par champ sinon.
 */
function translateRule(field: string, rawMessage: string): string {
  const label = FIELD_LABELS[field] ?? `Le champ « ${field} »`;
  const m = rawMessage.toLowerCase();

  if (field === 'email' && m.includes('email')) {
    return "L'adresse email n'est pas valide. Exemple : nom@exemple.com";
  }
  const min = m.match(/at least (\d+)/);
  if (min) return `${label} doit contenir au moins ${min[1]} caractères.`;
  const max = m.match(/at most (\d+)/);
  if (max) return `${label} ne doit pas dépasser ${max[1]} caractères.`;
  if (m.includes('required') || m.includes('expected string') || m.includes('received undefined')) {
    return `${label} est requis.`;
  }
  return `${label} n'est pas valide.`;
}

// Champs réellement saisis par l'utilisateur (les seuls qu'on peut lui nommer).
// Les champs internes (deviceId, refreshToken, timezone…) ne doivent JAMAIS
// apparaître dans un message : l'utilisateur ne les connaît pas.
const USER_FACING_FIELDS = new Set([
  'email', 'password', 'newPassword', 'currentPassword', 'displayName', 'name', 'token',
]);

/**
 * Construit un message PAR CHAMP à partir des détails Zod d'une VALIDATION_ERROR
 * (forme { details: { fieldErrors: { champ: [msg...] } } }). On ne nomme QUE les
 * champs saisis par l'utilisateur ; si seule une erreur sur un champ interne
 * existe (ex: deviceId), on renvoie null → message générique sûr.
 */
function validationMessage(body: unknown): string | null {
  const fieldErrors = (
    body as { details?: { fieldErrors?: Record<string, string[]> } } | undefined
  )?.details?.fieldErrors;
  if (!fieldErrors) return null;
  for (const [field, msgs] of Object.entries(fieldErrors)) {
    if (USER_FACING_FIELDS.has(field) && msgs && msgs.length) {
      return translateRule(field, msgs[0]);
    }
  }
  return null;
}

/** Messages de repli par statut HTTP quand aucun code connu n'est fourni. */
function friendlyByStatus(status: number): string {
  if (status === 0) return 'Impossible de joindre le serveur. Vérifie ta connexion.';
  if (status >= 500) return 'Le serveur rencontre un problème. Réessaie plus tard.';
  if (status === 429) return 'Trop de tentatives. Réessaie dans un instant.';
  if (status === 404) return 'Élément introuvable.';
  if (status === 401 || status === 403) return 'Accès refusé. Reconnecte-toi.';
  if (status >= 400) return 'Requête invalide. Vérifie tes saisies.';
  return 'Une erreur est survenue. Réessaie.';
}

/**
 * Construit le message montré à l'utilisateur. Priorité : message convivial par
 * code → repli par statut. Le message technique du serveur n'est utilisé en
 * dernier recours QUE s'il est court et non technique (sécurité + UX).
 */
function friendlyMessage(
  status: number,
  code?: string,
  serverMessage?: string,
  body?: unknown,
): string {
  // Erreur de validation → message PAR CHAMP et POURQUOI (le plus précis).
  if (code === 'VALIDATION_ERROR') {
    const byField = validationMessage(body);
    if (byField) return byField;
    return 'Certains champs sont invalides. Vérifie tes saisies.';
  }
  if (code && FRIENDLY_BY_CODE[code]) return FRIENDLY_BY_CODE[code];
  // Un message serveur "humain" et court (ex: messages d'auth) peut passer ;
  // tout ce qui ressemble à du technique (Prisma, stack, SQL) est écarté.
  if (
    serverMessage &&
    serverMessage.length < 120 &&
    !/prisma|invocation|errorCode|at \w|\n|postgres|sql|stack/i.test(serverMessage)
  ) {
    return serverMessage;
  }
  return friendlyByStatus(status);
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  /** Corps JSON (sérialisé automatiquement). */
  json?: unknown;
  /** Corps multipart (upload audio/fichier). Exclusif avec `json` — le
   *  Content-Type est laissé au runtime (boundary ajouté automatiquement). */
  formData?: FormData;
  /** N'attache pas le Bearer token (login, register, reset…). */
  auth?: boolean;
  /** Timeout spécifique (ms) — ex: upload audio + jugement Whisper. */
  timeoutMs?: number;
  /** Usage interne : empêche une 2e tentative de refresh en boucle. */
  _retry?: boolean;
  /** À passer sur les endpoints où un 401 signifie "mot de passe de
   *  confirmation incorrect" (ex: DELETE /me, change de mot de passe) et non
   *  "token expiré" : évite un refresh + une 2e requête inutiles, et surtout
   *  évite un clearTokens() (déconnexion silencieuse) si ce refresh échoue. */
  skipAuthRetry?: boolean;
}

/** Un seul refresh en vol à la fois, partagé entre les appels concurrents. */
let refreshPromise: Promise<boolean> | null = null;

/**
 * Tente de rafraîchir l'access token via le refresh token stocké.
 * Renvoie true si réussi (nouveaux tokens enregistrés), false sinon.
 */
async function refreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return false;
    const deviceId = await getDeviceId();
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceId }),
      });
      if (!res.ok) {
        await clearTokens(); // refresh invalide/expiré → session terminée
        return false;
      }
      const data = await res.json();
      await setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      return true;
    } catch {
      return false; // erreur réseau : on n'efface pas, on réessaiera plus tard
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Effectue une requête vers l'API. `path` est relatif ("/me", "/auth/login").
 * Lève `ApiError` sur réponse non-2xx (après tentative de refresh sur 401).
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { json, formData, auth = true, timeoutMs, _retry = false, skipAuthRetry = false, headers, ...rest } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? API_TIMEOUT_MS);

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string>),
  };
  if (json !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (auth) {
    const token = await getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: formData ?? (json !== undefined ? JSON.stringify(json) : undefined),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(0, 'Délai de connexion dépassé. Réessaie.');
    }
    throw new ApiError(0, 'Impossible de joindre le serveur. Vérifie ta connexion.');
  }
  clearTimeout(timeout);

  // 401 → tenter un refresh une seule fois, puis rejouer la requête.
  if (res.status === 401 && auth && !_retry && !skipAuthRetry) {
    const ok = await refreshTokens();
    if (ok) {
      return apiFetch<T>(path, { ...options, _retry: true });
    }
  }

  // 204 No Content (ex: logout) → pas de corps à parser.
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : undefined;

  if (!res.ok) {
    // Le backend renvoie une enveloppe { error: { code, message, details? } }.
    // On en extrait un message lisible (jamais une stack/erreur technique) et le
    // code, qu'on traduit en message convivial pour l'utilisateur.
    const envelope =
      data && typeof data === 'object' && 'error' in data
        ? (data as { error?: { code?: string; message?: string; details?: unknown } }).error
        : undefined;
    const code = envelope?.code;
    const message = friendlyMessage(res.status, code, envelope?.message, envelope);
    throw new ApiError(res.status, message, envelope ?? data, code);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
