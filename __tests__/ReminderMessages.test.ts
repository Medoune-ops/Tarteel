/**
 * Messages du rappel quotidien, copiés du backend.
 *
 * Ces textes ont été écrits par l'utilisateur et doivent rester intacts : le
 * fichier source porte un « NE PAS reformuler » explicite. Ces tests
 * vérifient que la copie côté client n'a pas dérivé.
 */
import {
  REMINDER_TITLE,
  REMINDER_MESSAGES,
  REMINDER_MESSAGES_EN,
  reminderLangFor,
  dailyReminderMessage,
} from '../constants/reminderMessages';

describe('Les textes sont intacts', () => {
  it('reprend les 60 messages du backend', () => {
    expect(REMINDER_MESSAGES.length).toBe(60);
  });

  it('garde le titre sans emoji, comme côté serveur', () => {
    expect(REMINDER_TITLE).toBe('Tarteel');
  });

  it('conserve les apostrophes typographiques et guillemets d’origine', () => {
    // Un passage par un éditeur qui « corrige » la ponctuation se verrait ici.
    expect(REMINDER_MESSAGES).toContain(
      '“Demain je commence” — c’est ce que tu dis depuis des années.',
    );
    expect(REMINDER_MESSAGES).toContain('Un verset. Juste un. Ce soir.');
  });

  it('n’a ni doublon ni message vide', () => {
    expect(new Set(REMINDER_MESSAGES).size).toBe(REMINDER_MESSAGES.length);
    for (const m of REMINDER_MESSAGES) expect(m.trim().length).toBeGreaterThan(0);
  });

  it('garde des messages assez courts pour une notification', () => {
    // Au-delà, iOS et Android tronquent : le message perdrait sa chute.
    for (const m of REMINDER_MESSAGES) expect(m.length).toBeLessThan(200);
  });
});

describe('La version anglaise', () => {
  it('couvre exactement les mêmes messages', () => {
    expect(REMINDER_MESSAGES_EN.length).toBe(REMINDER_MESSAGES.length);
  });

  it('n’a ni doublon, ni message vide, ni français oublié', () => {
    expect(new Set(REMINDER_MESSAGES_EN).size).toBe(REMINDER_MESSAGES_EN.length);
    for (const m of REMINDER_MESSAGES_EN) {
      expect(m.trim().length).toBeGreaterThan(0);
      // Un message laissé en français se verrait à ces mots-là.
      expect(m).not.toMatch(/\b(Tu|tu es|Coran|téléphone|jamais)\b/);
    }
  });

  it('garde les termes arabes, comme en français', () => {
    const tous = REMINDER_MESSAGES_EN.join(' ');
    for (const mot of ['dunya', 'Akhirah', 'Bismillah', 'surah', 'Ramadan']) {
      expect(tous).toContain(mot);
    }
  });

  it('reste assez court pour une notification', () => {
    for (const m of REMINDER_MESSAGES_EN) expect(m.length).toBeLessThan(200);
  });
});

describe('Choix de la langue', () => {
  it('sert le français en français', () => {
    expect(reminderLangFor('fr')).toBe('fr');
  });

  it('sert l’anglais en anglais — et en arabe, comme le reste de l’app', () => {
    expect(reminderLangFor('en')).toBe('en');
    expect(reminderLangFor('ar')).toBe('en');
  });
});

describe('Tirage du message', () => {
  it('rend toujours un message de la liste demandée', () => {
    for (let i = 0; i < 40; i++) {
      const fr = dailyReminderMessage('fr');
      expect(fr.title).toBe(REMINDER_TITLE);
      expect(REMINDER_MESSAGES).toContain(fr.body);

      const en = dailyReminderMessage('en');
      expect(REMINDER_MESSAGES_EN).toContain(en.body);
    }
  });

  it('respecte le générateur fourni, pour être testable', () => {
    expect(dailyReminderMessage('fr', () => 0).body).toBe(REMINDER_MESSAGES[0]);
    expect(dailyReminderMessage('en', () => 0).body).toBe(REMINDER_MESSAGES_EN[0]);
    expect(dailyReminderMessage('fr', () => 0.999999).body).toBe(
      REMINDER_MESSAGES[REMINDER_MESSAGES.length - 1],
    );
  });

  it('les deux langues restent alignées : même rang, même message', () => {
    // Le message n° 3 en français doit être le message n° 3 en anglais.
    for (const i of [0, 12, 30, 59]) {
      const r = () => i / REMINDER_MESSAGES.length;
      expect(dailyReminderMessage('fr', r).body).toBe(REMINDER_MESSAGES[i]);
      expect(dailyReminderMessage('en', r).body).toBe(REMINDER_MESSAGES_EN[i]);
    }
  });

  it('ne rend pas toujours le même message', () => {
    const vus = new Set<string>();
    for (let i = 0; i < 60; i++) vus.add(dailyReminderMessage('fr').body);
    // Sur 60 tirages dans 60 messages, on attend une bonne variété.
    expect(vus.size).toBeGreaterThan(20);
  });
});
