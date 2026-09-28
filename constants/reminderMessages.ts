/**
 * Messages du rappel quotidien.
 *
 * FRANÇAIS : copie EXACTE du backend
 * (`Tarteelback/src/modules/notifications/reminderMessages.ts`). Textes
 * fournis par l'utilisateur, repris à l'identique, sans aucune modification.
 * ⚠️ NE PAS reformuler / raccourcir / éditer ces textes.
 *
 * ANGLAIS : traduction des mêmes messages, pensée pour garder le ton — direct,
 * des phrases courtes, des ruptures. Ce n'est volontairement pas du mot à mot :
 * « Occupé pour Allah. Disponible pour tout le monde. » perdrait sa chute en
 * traduction littérale. Les termes gardés en arabe (dunya, Akhirah, Bismillah,
 * surah) le restent, comme en français.
 *
 * Pourquoi une copie plutôt qu'un appel réseau : le rappel quotidien est une
 * notification LOCALE, programmée sur l'appareil (voir
 * `lib/localNotifications.ts`). Le texte doit donc être connu hors ligne, au
 * moment où l'on programme, sans réseau ni compte.
 *
 * ⚠️ Si la liste française change côté serveur, la recopier ici — et traduire
 * les nouveaux messages.
 */

/** Langues dans lesquelles les rappels sont écrits. */
export type ReminderLang = 'fr' | 'en';

/** Titre affiché en tête de chaque rappel. Sans emoji, comme côté serveur. */
export const REMINDER_TITLE = 'Tarteel';

/** Les messages français, mot pour mot, dans l'ordre du backend. */
export const REMINDER_MESSAGES: string[] = [
  "Tu as le temps de scroller des heures, mais pas 5 minutes pour réciter.",
  "Tu recharges ton téléphone chaque nuit, mais ton âme attend depuis des jours.",
  "“Demain je commence” — c’est ce que tu dis depuis des années.",
  "Tu attends d’être prêt. Le Coran t’attend, lui.",
  "Chaque sourate que tu repousses, c’est une lumière que tu éteins toi-même.",
  "Tu mémorises des paroles de chansons, mais le Coran “c’est trop difficile”.",
  "L’excuse du manque de temps ne tient pas face à celui qui voit tout.",
  "Tu es occupé Mais pour combien de temps encore ?",
  "La dunya ne te rendra jamais ce que le Coran peut te donner.",
  "Ta mémoire fonctionne parfaitement. Tu choisis juste quoi y mettre.",
  "4 heures d’écran par jour. 0 minute pour le coran.",
  "Tu consultes ton téléphone 100 fois par jour. Le Coran attend sa première.",
  "Chaque notification reçoit ta réponse. Allah attend la sienne.",
  "Tu vieillis. Chaque jour sans le Coran est un jour perdu pour toujours.",
  "Le Ramadan revient chaque année. Toi, peut-être pas.",
  "Tu remets à demain ce que la mort peut prendre ce soir.",
  "Tu te dis musulman, mais le Livre de l’Islam te connaît à peine.",
  "Le Coran ne te manque pas. C’est toi qui lui manques.",
  "Pas le temps ? Ou pas la priorité ?",
  "Occupé pour Allah. Disponible pour tout le monde.",
  "Ton enfant te demandera un jour de lui lire le Coran. Tu sauras quoi répondre ?",
  "2h sur ton téléphone. Pas 10 minutes pour Allah.",
  "Tu écoutes tout le monde. Écoute-Le, Lui.",
  "Des enfants de 7 ans mémorisent. Toi tu attends quoi ?",
  "Tu cherches la paix partout. Elle est dans ce Livre que tu n’ouvres pas.",
  "Tu te sens vide parfois. Tu sais pourquoi.",
  "Un verset par jour change une vie.",
  "Le regret de l’Akhira n’a pas de remède.",
  "Tu consommes sans fin parce que rien ne te rassasie. Tu cherches au mauvais endroit.",
  "Tu cherches qui tu es. Le Coran te le dit dès la première page.",
  "Tu lis des livres de développement personnel. Le premier self-help c’est le Coran.",
  "Tu mérites la paix. Mais tu fuis ce qui la donne.",
  "La tranquillité que tu achètes ne dure pas. Celle du Coran, si.",
  "Un verset suffit parfois à calmer ce que rien d’autre n’a pu.",
  "Perdu dans la vie ? Le Coran est le seul GPS qui ne recalcule jamais dans le mauvais sens.",
  "La douleur que tu noies dans le bruit — le Coran peut la guérir en silence.",
  "Revenir au Coran, c’est revenir à toi.",
  "Tu portes des choses lourdes. Le Coran n’est pas un poids de plus — c’est ce qui allège.",
  "Ce que les gens t’ont fait, Allah l’a vu. Il t’a laissé un Livre pour t’en relever.",
  "Tu peux être entouré de monde et mourir de solitude. Le Coran, lui, ne part jamais.",
  "Tu es épuisé de courir après ce monde. Pose-toi. Ouvre le Livre.",
  "La fatigue de l’âme ne se guérit pas avec du sommeil. Tu le sais déjà.",
  "Tu t’es construit une identité entière sans le Coran dedans. Quelque chose cloche, non ?",
  "Tu portes un prénom musulman, une histoire musulmane, un héritage musulman. Et le Livre de cet héritage te connaît à peine.",
  "Il y a des douleurs que la psychologie ne peut pas atteindre. Le Coran, si.",
  "Tu as tout essayé pour aller mieux. Tout sauf l’essentiel.",
  "La guérison que tu cherches depuis des années commence par Bismillah.",
  "Tu veux être aimé inconditionnellement. Cet amour existe. Il t’attend dans chaque verset.",
  "Tu cherches quelqu’un qui te comprend vraiment. Allah te connaît mieux que tu ne te connais.",
  "Le Coran n’a pas été révélé pour les anges. Il a été révélé pour toi.",
  "Le Coran ne te juge pas pour ton absence. Il se réjouit de ton retour.",
  "Revenir après longtemps, c’est peut-être la plus belle forme d’amour qu’on puisse offrir à Allah.",
  "Tu n’as pas à être parfait pour ouvrir ce Livre. Tu as juste à ouvrir ce Livre.",
  "Tu n’as pas à expliquer ton absence. Ouvre juste le Livre.",
  "Peu importe combien de temps tu es parti. La porte n’a pas de verrou.",
  "Le Coran ne te demande pas où tu étais. Il te demande juste d’être là maintenant.",
  "Qu’est-ce que tu vas transmettre à tes enfants si toi-même tu n’as rien reçu du coran?",
  "Tes parents ont porté cette religion jusqu’à toi. Tu la poses là ?",
  "Un verset. Juste un. Ce soir.",
  "Tu n’as pas besoin d’un plan. Tu as besoin d’une sourate.",
];

/** Les mêmes messages en anglais, dans le même ordre. */
export const REMINDER_MESSAGES_EN: string[] = [
  "You've got hours to scroll, but not five minutes to recite.",
  "You charge your phone every night. Your soul has been waiting for days.",
  "“I'll start tomorrow” — you've been saying that for years.",
  "You're waiting to be ready. The Qur'an is waiting for you.",
  "Every surah you put off is a light you put out yourself.",
  "You memorise song lyrics, but the Qur'an is “too hard”.",
  "The no-time excuse doesn't hold up in front of the One who sees everything.",
  "You're busy. But for how much longer?",
  "The dunya will never give you back what the Qur'an can give you.",
  "Your memory works fine. You just choose what goes in it.",
  "4 hours of screen a day. 0 minutes for the Qur'an.",
  "You check your phone 100 times a day. The Qur'an is still waiting for the first.",
  "Every notification gets your answer. Allah is waiting for His.",
  "You're getting older. Every day without the Qur'an is gone for good.",
  "Ramadan comes back every year. You might not.",
  "You're putting off until tomorrow what death can take tonight.",
  "You call yourself Muslim, but the Book of Islam barely knows you.",
  "The Qur'an doesn't miss you. You're the one missing it.",
  "No time? Or no priority?",
  "Busy for Allah. Available for everyone else.",
  "One day your child will ask you to read the Qur'an to them. Will you know what to say?",
  "2 hours on your phone. Not 10 minutes for Allah.",
  "You listen to everyone. Listen to Him.",
  "Seven-year-olds are memorising it. What are you waiting for?",
  "You're looking for peace everywhere. It's in the Book you don't open.",
  "You feel empty sometimes. You know why.",
  "One verse a day changes a life.",
  "There's no cure for the regret of the Akhirah.",
  "You consume endlessly because nothing fills you. You're looking in the wrong place.",
  "You're looking for who you are. The Qur'an tells you on the first page.",
  "You read self-help books. The first self-help was the Qur'an.",
  "You deserve peace. But you run from what gives it.",
  "The calm you buy doesn't last. The Qur'an's does.",
  "One verse is sometimes enough to settle what nothing else could.",
  "Lost in life? The Qur'an is the only GPS that never reroutes you wrong.",
  "The pain you drown in noise — the Qur'an can heal it in silence.",
  "Coming back to the Qur'an is coming back to yourself.",
  "You're carrying heavy things. The Qur'an isn't one more weight — it's what lifts them.",
  "What people did to you, Allah saw. He left you a Book to rise from it.",
  "You can be surrounded by people and dying of loneliness. The Qur'an never leaves.",
  "You're worn out chasing this world. Sit down. Open the Book.",
  "Tiredness of the soul doesn't heal with sleep. You already know that.",
  "You've built a whole identity with no Qur'an in it. Something's off, isn't it?",
  "You carry a Muslim name, a Muslim history, a Muslim heritage. And the Book of that heritage barely knows you.",
  "There are pains psychology can't reach. The Qur'an can.",
  "You've tried everything to feel better. Everything except the essential.",
  "The healing you've been looking for for years starts with Bismillah.",
  "You want to be loved unconditionally. That love exists. It's waiting in every verse.",
  "You're looking for someone who truly understands you. Allah knows you better than you know yourself.",
  "The Qur'an wasn't revealed for the angels. It was revealed for you.",
  "The Qur'an doesn't judge you for being away. It rejoices at your return.",
  "Coming back after a long time might be the most beautiful love you can offer Allah.",
  "You don't have to be perfect to open this Book. You just have to open this Book.",
  "You don't owe anyone an explanation for being away. Just open the Book.",
  "However long you've been gone. The door has no lock.",
  "The Qur'an doesn't ask where you were. It just asks you to be here now.",
  "What will you pass on to your children if you received nothing from the Qur'an yourself?",
  "Your parents carried this religion all the way to you. Are you setting it down here?",
  "One verse. Just one. Tonight.",
  "You don't need a plan. You need a surah.",
];

/**
 * Langue des rappels pour la langue d'interface.
 *
 * L'arabe reçoit l'anglais, comme le reste de l'app : `lib/i18n.ts` fait
 * déjà retomber `ar` sur le dictionnaire anglais.
 */
export function reminderLangFor(appLanguage: string): ReminderLang {
  return appLanguage === 'fr' ? 'fr' : 'en';
}

/**
 * Un message au hasard, dans la langue demandée — comme le fait le serveur à
 * chaque envoi.
 *
 * ⚠️ Une notification locale QUOTIDIENNE répète le même texte chaque jour : le
 * tirage a lieu au moment de la programmation, pas à chaque déclenchement. On
 * reprogramme donc à chaque ouverture de l'app (voir
 * `restoreLocalNotifications`), ce qui renouvelle le message.
 */
export function dailyReminderMessage(
  lang: ReminderLang = 'fr',
  rng: () => number = Math.random,
): { title: string; body: string } {
  const list = lang === 'en' ? REMINDER_MESSAGES_EN : REMINDER_MESSAGES;
  const body = list[Math.floor(rng() * list.length)] ?? list[0];
  return { title: REMINDER_TITLE, body };
}
