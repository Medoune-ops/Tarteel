/**
 * Notifications LOCALES, programmées sur l'appareil.
 *
 * Répartition des rôles avec le serveur :
 *  - ICI, tout ce qui est prévisible et fixe : le rappel quotidien à l'heure
 *    choisie, le hadith du jour. L'appareil sait déjà quoi dire et quand, il
 *    n'a besoin ni de réseau, ni de token, ni même d'un compte.
 *  - AU SERVEUR, tout ce qui demande de décider quelque chose que l'appareil
 *    ignore : « ça fait longtemps qu'on ne t'a pas vu », l'alerte de série,
 *    les annonces. Une notification locale ne peut pas relancer quelqu'un qui
 *    n'ouvre plus l'app, justement parce qu'elle a besoin qu'il l'ouvre.
 *
 * ⚠️ PAS DE DOUBLON. Le rappel quotidien est désormais servi ici et nulle
 * part ailleurs : le backend ne doit plus envoyer `notifDailyReminder`, sinon
 * la personne reçoit deux notifications à la même heure.
 *
 * ⚠️ CODE NATIF. `expo-notifications` n'existe ni sur le web ni dans Expo Go
 * (SDK 53+) : le module est chargé paresseusement et tout échoue en silence
 * s'il manque. Le réglage reste enregistré et s'appliquera dans un vrai build.
 */

/** Étiquette portée par chaque notification locale, pour la retrouver. */
export type LocalKind = 'daily-reminder' | 'hadith-du-jour';

interface Scheduled {
  identifier: string;
  content?: { data?: Record<string, unknown> };
}

interface NotificationsModule {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  getPermissionsAsync: () => Promise<{ granted: boolean }>;
  cancelScheduledNotificationAsync: (id: string) => Promise<void>;
  getAllScheduledNotificationsAsync: () => Promise<Scheduled[]>;
  scheduleNotificationAsync: (req: {
    content: { title: string; body: string; data?: Record<string, unknown> };
    trigger: unknown;
  }) => Promise<string>;
  SchedulableTriggerInputTypes: { DAILY: string };
}

/**
 * Charge `expo-notifications` à la demande.
 *
 * Un `import` direct ferait planter l'écran là où le module natif n'existe
 * pas. On renvoie `null` dans ce cas, et l'appelant continue sans rien
 * programmer.
 */
function load(): NotificationsModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-notifications') as Partial<NotificationsModule>;
    return mod.scheduleNotificationAsync ? (mod as NotificationsModule) : null;
  } catch {
    return null;
  }
}

/** Les notifications locales sont-elles utilisables sur cet appareil ? */
export function localNotificationsAvailable(): boolean {
  return load() !== null;
}

/** Annule toutes les notifications locales d'un type donné. */
async function cancelKind(N: NotificationsModule, kind: LocalKind): Promise<void> {
  const planned = await N.getAllScheduledNotificationsAsync();
  for (const p of planned) {
    if (p.content?.data?.kind === kind) {
      await N.cancelScheduledNotificationAsync(p.identifier);
    }
  }
}

/**
 * (Re)programme une notification quotidienne, ou l'annule si `enabled` est
 * faux.
 *
 * Idempotent : l'ancienne notification du même type est retirée d'abord, pour
 * qu'un changement d'heure n'en laisse pas deux en place. Les notifications
 * des autres types sont reconnues par leur `data.kind` et laissées intactes.
 *
 * Les textes viennent de l'appelant, qui a accès aux traductions.
 */
export async function scheduleDaily(
  kind: LocalKind,
  enabled: boolean,
  hour: number,
  texts: { title: string; body: string },
): Promise<void> {
  const N = load();
  if (!N) return;

  try {
    await cancelKind(N, kind);
    if (!enabled) return;

    const { granted } = await N.requestPermissionsAsync();
    if (!granted) return;

    await N.scheduleNotificationAsync({
      content: { title: texts.title, body: texts.body, data: { kind } },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DAILY,
        hour: Math.min(Math.max(Math.trunc(hour), 0), 23),
        minute: 0,
      },
    });
  } catch {
    // Permission refusée, plateforme non supportée : le réglage reste
    // enregistré et s'appliquera quand ce sera possible.
  }
}

/**
 * Remet en place les notifications locales au démarrage de l'app.
 *
 * Nécessaire parce qu'un redémarrage de l'appareil, une mise à jour de l'app
 * ou une réinstallation effacent les notifications programmées, alors que les
 * réglages, eux, sont persistés. Sans ce rappel, quelqu'un qui redémarre son
 * téléphone ne reçoit plus jamais son rappel du matin.
 *
 * Ne demande PAS la permission : si elle n'a jamais été accordée, on ne
 * programme rien plutôt que d'ouvrir une boîte de dialogue au lancement.
 */
export async function restoreLocalNotifications(
  items: { kind: LocalKind; enabled: boolean; hour: number; texts: { title: string; body: string } }[],
): Promise<void> {
  const N = load();
  if (!N) return;

  try {
    const { granted } = await N.getPermissionsAsync();
    if (!granted) return;

    for (const it of items) {
      await cancelKind(N, it.kind);
      if (!it.enabled) continue;
      await N.scheduleNotificationAsync({
        content: { title: it.texts.title, body: it.texts.body, data: { kind: it.kind } },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DAILY,
          hour: Math.min(Math.max(Math.trunc(it.hour), 0), 23),
          minute: 0,
        },
      });
    }
  } catch {
    // Rien à faire : les réglages restent, la prochaine visite de l'écran
    // des notifications reprogrammera.
  }
}
