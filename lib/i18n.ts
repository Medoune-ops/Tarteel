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

  // ─── Onglet Coran (Savoir) ─────────────────────────────────────────────────
  'coran.headerTitle': 'Savoir',
  'coran.headerSub': "Découvre le Coran et l'Islam dans la joie ✨",
  'coran.factSourates': 'Sourates',
  'coran.factVersets': 'Versets',
  'coran.factProphetes': 'Prophètes',
  'coran.exploreThemes': 'Explore les thèmes',
  'coran.theme.coran.titre': 'Le Saint Coran',
  'coran.theme.coran.sous': 'Histoire, révélation, structure',
  'coran.theme.islam.titre': "L'Islam",
  'coran.theme.islam.sous': 'Les 5 piliers, la foi, les valeurs',
  'coran.theme.prophetes.titre': 'Les Prophètes',
  'coran.theme.prophetes.sous': 'Les 25 prophètes cités dans le Coran',
  'coran.theme.ablutions.titre': 'Les Ablutions',
  'coran.theme.ablutions.sous': 'Le Wudû étape par étape',
  'coran.theme.priere.titre': 'La Prière',
  'coran.theme.priere.sous': 'La Salât : gestes et invocations',

  // ─── Onglet Ligues ─────────────────────────────────────────────────────────
  'ligues.title': 'Ligues',
  'ligues.loading': 'Chargement des ligues…',
  'ligues.loadError': 'Impossible de charger les ligues.',
  'ligues.leagueName': 'Ligue {nom}',
  'ligues.weekLabel': 'Semaine {n} · ',
  'ligues.participant': '{n} participant',
  'ligues.participants': '{n} participants',
  'ligues.promotionTop': 'Top {n} → promotion',
  'ligues.promotionZone': 'ZONE DE PROMOTION',
  'ligues.relegationZone': 'ZONE DE RELÉGATION',
  'ligues.relegationTag': 'Zone de relégation',
  'ligues.emptyList': "Termine une leçon pour gagner de l'XP et apparaître au classement.",
  'ligues.myPosition': 'Ta position',
  'ligues.myHintPromotion': 'Tu es en zone de promotion !',
  'ligues.myHintRelegation': 'Attention, zone de relégation',
  'ligues.myHintDefault': '{n} participants cette semaine',

  // ─── Onglet Profil ─────────────────────────────────────────────────────────
  'profil.defaultName': 'Toi',
  'profil.xpTotal': 'XP Total',
  'profil.streakDays': 'Jours streak',
  'profil.sourates': 'Sourates',
  'profil.precision': 'Précision',
  'profil.levelProgress': 'Progression Niveau {level}',
  'profil.badgesTitle': 'Badges',
  'profil.badge.lectureLibre': 'Lecture libre',
  'profil.badge.streakGoalSet': 'Fixer un défi',
  'profil.badge.streakGoalReached': '🎯 Atteint !',
  'profil.badge.streakGoalProgress': '{streak}/{goal} j',
  'profil.badge.tajwid': 'Tajwid',
  'profil.badge.sourate': '{n} Sourate',
  'profil.badge.sourates': '{n} Sourates',
  'profil.badge.podiums': 'Mes podiums',
  'profil.logout': 'Se déconnecter',
  'profil.logoutConfirmTitle': 'Se déconnecter',
  'profil.logoutConfirmMsg': 'Es-tu sûr de vouloir te déconnecter ?',
  'profil.logoutCancel': 'Annuler',
  'profil.logoutAction': 'Déconnexion',
  'profil.weekday.mon': 'L',
  'profil.weekday.tue': 'M',
  'profil.weekday.wed': 'M',
  'profil.weekday.thu': 'J',
  'profil.weekday.fri': 'V',
  'profil.weekday.sat': 'S',
  'profil.weekday.sun': 'D',

  // ─── Onglet Révisions ──────────────────────────────────────────────────────
  'revisions.headerTitle': 'Révisions',
  'revisions.headerSub': 'Répétition espacée · SRS',
  'revisions.statSourates': 'Sourates',
  'revisions.statMaitrisees': 'Maîtrisées',
  'revisions.statARevoir': 'À revoir',
  'revisions.loadError': 'Impossible de charger tes révisions.',
  'revisions.searchPlaceholder': 'Rechercher une sourate…',
  'revisions.todayTitle': "À réviser aujourd'hui",
  'revisions.todayPillOne': '{n} sourate',
  'revisions.todayPillMany': '{n} sourates',
  'revisions.todayBannerTitle': "C'est l'heure de réviser !",
  'revisions.todayBannerSub': "{noms} t'attendent",
  'revisions.start': 'Commencer',
  'revisions.alphabetTitle': 'Alphabet & Harakat',
  'revisions.alphabetEmpty': "Termine une leçon d'alphabet ou d'harakat dans le parcours pour la voir apparaître ici.",
  'revisions.mySourates': 'Mes sourates',
  'revisions.searchResults': 'Résultats ({n})',
  'revisions.noneFound': 'Aucune sourate trouvée',
  'revisions.tryAnother': 'Essaie un autre nom ou numéro',
  'revisions.versets': '{n} versets',
  'revisions.dueToday': "Aujourd'hui",
  'revisions.dueInOneDay': 'Dans 1 jour',
  'revisions.dueInDays': 'Dans {n} jours',
  'revisions.etat.maitrise': '✓ Maîtrisé',
  'revisions.etat.revoir': '↺ À revoir',
  'revisions.etat.difficile': '⚡ Difficile',
  'revisions.etat.nonApprise': 'Non apprise',
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

  // ─── Quran tab (Learn/Knowledge) ───────────────────────────────────────────
  'coran.headerTitle': 'Knowledge',
  'coran.headerSub': 'Discover the Quran and Islam, the fun way ✨',
  'coran.factSourates': 'Surahs',
  'coran.factVersets': 'Verses',
  'coran.factProphetes': 'Prophets',
  'coran.exploreThemes': 'Explore topics',
  'coran.theme.coran.titre': 'The Holy Quran',
  'coran.theme.coran.sous': 'History, revelation, structure',
  'coran.theme.islam.titre': 'Islam',
  'coran.theme.islam.sous': 'The 5 pillars, faith, values',
  'coran.theme.prophetes.titre': 'The Prophets',
  'coran.theme.prophetes.sous': 'The 25 prophets mentioned in the Quran',
  'coran.theme.ablutions.titre': 'Ablutions',
  'coran.theme.ablutions.sous': 'Wudu step by step',
  'coran.theme.priere.titre': 'Prayer',
  'coran.theme.priere.sous': 'Salah: gestures and invocations',

  // ─── Leagues tab ────────────────────────────────────────────────────────────
  'ligues.title': 'Leagues',
  'ligues.loading': 'Loading leagues…',
  'ligues.loadError': 'Could not load leagues.',
  'ligues.leagueName': '{nom} League',
  'ligues.weekLabel': 'Week {n} · ',
  'ligues.participant': '{n} participant',
  'ligues.participants': '{n} participants',
  'ligues.promotionTop': 'Top {n} → promotion',
  'ligues.promotionZone': 'PROMOTION ZONE',
  'ligues.relegationZone': 'RELEGATION ZONE',
  'ligues.relegationTag': 'Relegation zone',
  'ligues.emptyList': 'Finish a lesson to earn XP and appear on the leaderboard.',
  'ligues.myPosition': 'Your position',
  'ligues.myHintPromotion': "You're in the promotion zone!",
  'ligues.myHintRelegation': 'Watch out, relegation zone',
  'ligues.myHintDefault': '{n} participants this week',

  // ─── Profile tab ────────────────────────────────────────────────────────────
  'profil.defaultName': 'You',
  'profil.xpTotal': 'Total XP',
  'profil.streakDays': 'Streak days',
  'profil.sourates': 'Surahs',
  'profil.precision': 'Accuracy',
  'profil.levelProgress': 'Level {level} progress',
  'profil.badgesTitle': 'Badges',
  'profil.badge.lectureLibre': 'Free reading',
  'profil.badge.streakGoalSet': 'Set a goal',
  'profil.badge.streakGoalReached': '🎯 Reached!',
  'profil.badge.streakGoalProgress': '{streak}/{goal} d',
  'profil.badge.tajwid': 'Tajwid',
  'profil.badge.sourate': '{n} Surah',
  'profil.badge.sourates': '{n} Surahs',
  'profil.badge.podiums': 'My podiums',
  'profil.logout': 'Log out',
  'profil.logoutConfirmTitle': 'Log out',
  'profil.logoutConfirmMsg': 'Are you sure you want to log out?',
  'profil.logoutCancel': 'Cancel',
  'profil.logoutAction': 'Log out',
  'profil.weekday.mon': 'M',
  'profil.weekday.tue': 'T',
  'profil.weekday.wed': 'W',
  'profil.weekday.thu': 'T',
  'profil.weekday.fri': 'F',
  'profil.weekday.sat': 'S',
  'profil.weekday.sun': 'S',

  // ─── Review tab ─────────────────────────────────────────────────────────────
  'revisions.headerTitle': 'Review',
  'revisions.headerSub': 'Spaced repetition · SRS',
  'revisions.statSourates': 'Surahs',
  'revisions.statMaitrisees': 'Mastered',
  'revisions.statARevoir': 'To review',
  'revisions.loadError': 'Could not load your reviews.',
  'revisions.searchPlaceholder': 'Search a surah…',
  'revisions.todayTitle': 'To review today',
  'revisions.todayPillOne': '{n} surah',
  'revisions.todayPillMany': '{n} surahs',
  'revisions.todayBannerTitle': "It's review time!",
  'revisions.todayBannerSub': '{noms} are waiting for you',
  'revisions.start': 'Start',
  'revisions.alphabetTitle': 'Alphabet & Harakat',
  'revisions.alphabetEmpty': 'Finish an alphabet or harakat lesson in your path to see it appear here.',
  'revisions.mySourates': 'My surahs',
  'revisions.searchResults': 'Results ({n})',
  'revisions.noneFound': 'No surah found',
  'revisions.tryAnother': 'Try another name or number',
  'revisions.versets': '{n} verses',
  'revisions.dueToday': 'Today',
  'revisions.dueInOneDay': 'In 1 day',
  'revisions.dueInDays': 'In {n} days',
  'revisions.etat.maitrise': '✓ Mastered',
  'revisions.etat.revoir': '↺ To review',
  'revisions.etat.difficile': '⚡ Difficult',
  'revisions.etat.nonApprise': 'Not learned',
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
