/**
 * i18n maison, volontairement minimaliste (pas de dépendance lourde) :
 *   - dictionnaires fr/en typés (les clés manquantes sont des erreurs TS) ;
 *   - `useT()` : hook réactif — l'UI re-render quand la langue change ;
 *   - `t()`   : accès hors composant (Alert, callbacks…) ;
 *   - interpolation simple : t('key', { n: 3 }) remplace "{n}".
 *
 * La langue vient du store (choisie dans Paramètres → Langue, persistée côté
 * serveur via PATCH /me/settings). À l'installation, le store s'initialise sur
 * la langue du SYSTÈME (voir userStore). L'arabe n'ayant pas encore de
 * dictionnaire complet, il retombe sur l'anglais pour l'interface.
 */
import { useUserStore } from '../store/userStore';

const fr = {
  // ─── Commun ────────────────────────────────────────────────────────────────
  'common.cancel': 'Annuler',
  'common.soon': 'Bientôt',
  'common.retry': 'Réessayer',

  // ─── Barre d'onglets ───────────────────────────────────────────────────────
  'tabs.parcours': 'Apprendre',
  'tabs.revisions': 'Révisions',
  'tabs.ligues': 'Ligues',
  'tabs.coran': 'Coran',
  'tabs.profil': 'Profil',

  // ─── Parcours ──────────────────────────────────────────────────────────────
  'parcours.loading': 'Chargement du parcours…',
  'parcours.loadError': 'Impossible de charger le parcours.',
  'parcours.lessons': '{done}/{total} leçons',
  'chest.title': 'Coffre quotidien',
  'chest.sub': 'Récupère ta récompense du jour',
  'chest.alertTitle': '🎁 Coffre quotidien',
  'chest.xp': '+{n} XP ajoutés à ton compte !',
  'chest.gems': '+{n} gemmes 💎 (tes cœurs étaient déjà pleins) !',
  'chest.heart': '+1 cœur ❤️ rechargé !',
  'chest.hearts': '+{n} cœurs ❤️ rechargés !',

  // ─── Plus de cœurs ─────────────────────────────────────────────────────────
  'hearts.title': 'Plus de cœurs !',
  'hearts.reviewTitle': 'Réviser pour regagner',
  'hearts.reviewHint': '1 session de révision = +1 cœur (gratuit)',
  'hearts.nextIn': 'Prochain cœur dans',
  'hearts.refillTitle': '5 cœurs instantanés',
  'hearts.balance': 'Ton solde : {n} 💎',
  'hearts.premiumCta': 'Cœurs illimités avec Premium',
  'hearts.wait': "J'attends",
  'hearts.refillFailTitle': 'Recharge impossible',
  'hearts.refillFailInsufficient': 'Il te faut {n} gemmes — continue tes leçons pour en gagner !',
  'hearts.refillFailGeneric': 'Impossible de recharger pour le moment. Réessaie.',

  // ─── Révision → +1 cœur ────────────────────────────────────────────────────
  'review.regainTitle': 'Bien joué !',
  'review.regainMsg': 'Ta révision t’a fait regagner 1 cœur ❤️',

  // ─── Paramètres ────────────────────────────────────────────────────────────
  'settings.title': 'Paramètres',
  'settings.profileFallback': 'Mon profil',
  'settings.sectionAccount': 'COMPTE',
  'settings.editProfile': 'Modifier le profil',
  'settings.editProfileSub': "Nom, nom d'utilisateur",
  'settings.password': 'Mot de passe & sécurité',
  'settings.voice': 'Voix & enregistrements',
  'settings.on': 'Activé',
  'settings.off': 'Désactivé',
  'settings.sectionNotifs': 'NOTIFICATIONS',
  'settings.dailyReminder': 'Rappel quotidien',
  'settings.dailyReminderSub': 'Tous les jours à {h}h',
  'settings.manageNotifs': 'Gérer les notifications',
  'settings.manageNotifsSub': 'Série, ligues, verset du jour…',
  'settings.sectionSubscription': 'ABONNEMENT',
  'settings.premiumTitle': 'Passe à Tarteel Premium',
  'settings.premiumSub': 'Sans pub · Vies illimitées · Stats avancées',
  'settings.sectionPrivacy': 'CONFIDENTIALITÉ',
  'settings.privacy': 'Confidentialité & données',
  'settings.privacySub': 'Partage, profil, compte',
  'settings.sectionLanguage': 'LANGUE',
  'settings.language': "Langue de l'application",
  'settings.languageSub': 'Interface et menus',
  'settings.sectionAppearance': 'APPARENCE',
  'settings.themeLight': 'Clair',
  'settings.themeDark': 'Sombre',
  'settings.themeSystem': 'Système',
  'settings.logout': 'Se déconnecter',
  'settings.logoutConfirm': 'Veux-tu vraiment te déconnecter ?',

  // ─── Écran Langue ──────────────────────────────────────────────────────────
  'langue.title': 'Langue',
  'langue.sectionLabel': "LANGUE DE L'INTERFACE",
  'langue.fr': 'Français',
  'langue.en': 'Anglais',
  'langue.ar': 'Arabe',
  'langue.note': "La langue de récitation et du texte coranique reste l'arabe.",

  // ─── Écran Notifications ───────────────────────────────────────────────────
  'notif.title': 'Notifications & rappels',
  'notif.streakAlert': 'Alerte de série',
  'notif.streakAlertSub': 'Avant de perdre ton streak',
  'notif.hourLabel': 'HEURE DU RAPPEL',
  'notif.hourHint': 'Touche une heure pour la modifier',
  'notif.saveError': "Impossible d'enregistrer. Réessaie.",

  // ─── Confidentialité / compte ──────────────────────────────────────────────
  'account.deleteTitle': 'Supprimer mon compte',
  'account.deleteConfirm':
    'Toute ta progression (XP, série, gemmes, leçons) sera définitivement effacée. Cette action est irréversible.',
  'account.deleteAction': 'Supprimer définitivement',
  'account.deleteError': 'Suppression impossible pour le moment. Réessaie.',
  'account.passwordPrompt': 'Confirme avec ton mot de passe',
  'account.passwordPlaceholder': 'Mot de passe',
  'account.wrongPassword': 'Mot de passe incorrect.',
};

type Dict = typeof fr;
export type I18nKey = keyof Dict;

const en: Dict = {
  'common.cancel': 'Cancel',
  'common.soon': 'Soon',
  'common.retry': 'Retry',

  'tabs.parcours': 'Learn',
  'tabs.revisions': 'Review',
  'tabs.ligues': 'Leagues',
  'tabs.coran': 'Quran',
  'tabs.profil': 'Profile',

  'parcours.loading': 'Loading your path…',
  'parcours.loadError': 'Could not load your path.',
  'parcours.lessons': '{done}/{total} lessons',
  'chest.title': 'Daily chest',
  'chest.sub': 'Grab your reward of the day',
  'chest.alertTitle': '🎁 Daily chest',
  'chest.xp': '+{n} XP added to your account!',
  'chest.gems': '+{n} gems 💎 (your hearts were already full)!',
  'chest.heart': '+1 heart ❤️ refilled!',
  'chest.hearts': '+{n} hearts ❤️ refilled!',

  'hearts.title': 'Out of hearts!',
  'hearts.reviewTitle': 'Review to earn back',
  'hearts.reviewHint': '1 review session = +1 heart (free)',
  'hearts.nextIn': 'Next heart in',
  'hearts.refillTitle': '5 hearts instantly',
  'hearts.balance': 'Your balance: {n} 💎',
  'hearts.premiumCta': 'Unlimited hearts with Premium',
  'hearts.wait': "I'll wait",
  'hearts.refillFailTitle': 'Refill unavailable',
  'hearts.refillFailInsufficient': 'You need {n} gems — keep doing lessons to earn more!',
  'hearts.refillFailGeneric': "Couldn't refill right now. Try again.",

  'review.regainTitle': 'Well done!',
  'review.regainMsg': 'Your review earned you 1 heart back ❤️',

  'settings.title': 'Settings',
  'settings.profileFallback': 'My profile',
  'settings.sectionAccount': 'ACCOUNT',
  'settings.editProfile': 'Edit profile',
  'settings.editProfileSub': 'Name, username',
  'settings.password': 'Password & security',
  'settings.voice': 'Voice & recordings',
  'settings.on': 'On',
  'settings.off': 'Off',
  'settings.sectionNotifs': 'NOTIFICATIONS',
  'settings.dailyReminder': 'Daily reminder',
  'settings.dailyReminderSub': 'Every day at {h}:00',
  'settings.manageNotifs': 'Manage notifications',
  'settings.manageNotifsSub': 'Streak, leagues, verse of the day…',
  'settings.sectionSubscription': 'SUBSCRIPTION',
  'settings.premiumTitle': 'Go Tarteel Premium',
  'settings.premiumSub': 'Ad-free · Unlimited hearts · Advanced stats',
  'settings.sectionPrivacy': 'PRIVACY',
  'settings.privacy': 'Privacy & data',
  'settings.privacySub': 'Sharing, profile, account',
  'settings.sectionLanguage': 'LANGUAGE',
  'settings.language': 'App language',
  'settings.languageSub': 'Interface and menus',
  'settings.sectionAppearance': 'APPEARANCE',
  'settings.themeLight': 'Light',
  'settings.themeDark': 'Dark',
  'settings.themeSystem': 'System',
  'settings.logout': 'Log out',
  'settings.logoutConfirm': 'Do you really want to log out?',

  'langue.title': 'Language',
  'langue.sectionLabel': 'INTERFACE LANGUAGE',
  'langue.fr': 'French',
  'langue.en': 'English',
  'langue.ar': 'Arabic',
  'langue.note': 'Recitation and Quranic text stay in Arabic.',

  'notif.title': 'Notifications & reminders',
  'notif.streakAlert': 'Streak alert',
  'notif.streakAlertSub': 'Before you lose your streak',
  'notif.hourLabel': 'REMINDER TIME',
  'notif.hourHint': 'Tap an hour to change it',
  'notif.saveError': "Couldn't save. Try again.",

  'account.deleteTitle': 'Delete my account',
  'account.deleteConfirm':
    'All your progress (XP, streak, gems, lessons) will be permanently erased. This cannot be undone.',
  'account.deleteAction': 'Delete permanently',
  'account.deleteError': "Couldn't delete right now. Try again.",
  'account.passwordPrompt': 'Confirm with your password',
  'account.passwordPlaceholder': 'Password',
  'account.wrongPassword': 'Wrong password.',
};

// L'interface arabe n'est pas encore traduite → anglais en attendant.
const DICTS: Record<'fr' | 'en' | 'ar', Dict> = { fr, en, ar: en };

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m));
}

/** Traduction hors composant (Alert, callbacks…) — lit la langue du store. */
export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  const lang = useUserStore.getState().language;
  return interpolate((DICTS[lang] ?? fr)[key] ?? fr[key], vars);
}

/**
 * Hook réactif : re-render à chaque changement de langue.
 *   const tr = useT();  …  <Text>{tr('settings.title')}</Text>
 */
export function useT() {
  const lang = useUserStore((s) => s.language);
  return (key: I18nKey, vars?: Record<string, string | number>) =>
    interpolate((DICTS[lang] ?? fr)[key] ?? fr[key], vars);
}
