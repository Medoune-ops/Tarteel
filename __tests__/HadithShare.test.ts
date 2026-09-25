/**
 * Logique du visuel de partage : mise en page et troncature.
 *
 * Ces fonctions décident de ce que verront les gens à qui on envoie un
 * hadith. Une coupe au milieu d'un mot, ou un texte illisible parce que trop
 * dense, se voit immédiatement — d'où ces tests sur le corpus réel.
 */
import fs from 'fs';

/**
 * Copies des fonctions internes de `components/HadithShareCard.tsx`.
 *
 * Elles n'y sont pas exportées (elles ne servent qu'au rendu). Les dupliquer
 * ici permet de les tester sans monter un composant React Native, dont le
 * rendu natif n'existe pas sous jest. Si les seuils changent là-bas, ces
 * tests doivent être mis à jour de la même façon.
 */
function layoutFor(length: number): { fontSize: number; lineHeight: number; max: number } {
  if (length < 200) return { fontSize: 62, lineHeight: 96, max: 200 };
  if (length < 400) return { fontSize: 52, lineHeight: 82, max: 400 };
  if (length < 700) return { fontSize: 44, lineHeight: 70, max: 700 };
  if (length < 1100) return { fontSize: 37, lineHeight: 59, max: 1100 };
  return { fontSize: 33, lineHeight: 53, max: 1250 };
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const body = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}

/** Les 82 hadiths étiquetés, en français. */
function corpus(): { n: number; t: string }[] {
  const out: { n: number; t: string }[] = [];
  for (const c of ['nawawi', 'qudsi']) {
    const d = JSON.parse(fs.readFileSync(`assets/hadiths/${c}.fr.hadith`, 'utf8'));
    out.push(...d.hadiths);
  }
  return out;
}

describe('Mise en page du visuel de partage', () => {
  it('un texte court est présenté en grand', () => {
    expect(layoutFor(150).fontSize).toBe(62);
  });

  it('un texte long est resserré, sans devenir illisible', () => {
    expect(layoutFor(2000).fontSize).toBe(33);
    expect(layoutFor(2000).fontSize).toBeGreaterThanOrEqual(30);
  });

  it('la police décroît quand le texte s’allonge', () => {
    const sizes = [150, 300, 500, 900, 1500].map((l) => layoutFor(l).fontSize);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeLessThan(sizes[i - 1]);
    }
  });

  it('l’interlignage reste confortable à toute taille', () => {
    for (const l of [150, 300, 500, 900, 1500]) {
      const { fontSize, lineHeight } = layoutFor(l);
      expect(lineHeight / fontSize).toBeGreaterThan(1.4);
    }
  });
});

describe('Troncature : jamais un mot coupé en deux', () => {
  it('laisse un texte court intact', () => {
    expect(truncate('Un hadith bref.', 200)).toBe('Un hadith bref.');
  });

  it('ajoute les points de suspension quand ça dépasse', () => {
    expect(truncate('a'.repeat(300), 200).endsWith('…')).toBe(true);
  });

  it('coupe au dernier espace, pas au milieu d’un mot', () => {
    const text = 'Le Prophète a dit une parole particulièrement longue et bien construite';
    const cut = truncate(text, 40);
    const body = cut.slice(0, -1); // sans le « … »

    expect(text.startsWith(body)).toBe(true);
    // Le caractère suivant dans l'original doit être un espace : c'est la
    // preuve qu'on s'est arrêté sur une fin de mot.
    expect(text[body.length]).toBe(' ');
    expect(cut).toBe('Le Prophète a dit une parole…');
  });

  it('ne coupe jamais un mot, sur toutes les limites', () => {
    const text = 'Le Prophète a dit une parole particulièrement longue et bien construite';
    // On balaie toutes les limites possibles : aucune ne doit produire un
    // mot tronqué.
    for (let max = 5; max < text.length; max++) {
      const body = truncate(text, max).slice(0, -1);
      if (body.length === 0) continue; // pas d'espace avant la limite
      expect(text[body.length]).toBe(' ');
    }
  });

  it('ne laisse jamais d’espace avant les points de suspension', () => {
    for (const h of corpus()) {
      const { max } = layoutFor(h.t.length);
      const cut = truncate(h.t, max);
      expect(cut).not.toMatch(/\s…$/);
    }
  });
});

describe('Sur le corpus réel (82 hadiths)', () => {
  it('la grande majorité passe sans troncature', () => {
    const all = corpus();
    const kept = all.filter((h) => h.t.length <= layoutFor(h.t.length).max);
    // Au moins 90 % doivent tenir entiers : tronquer doit rester l'exception.
    expect(kept.length / all.length).toBeGreaterThan(0.9);
  });

  it('aucun visuel ne dépasse la limite de sa mise en page', () => {
    for (const h of corpus()) {
      const { max } = layoutFor(h.t.length);
      expect(truncate(h.t, max).length).toBeLessThanOrEqual(max + 1); // +1 pour « … »
    }
  });

  it('chaque hadith produit un texte non vide', () => {
    for (const h of corpus()) {
      const { max } = layoutFor(h.t.length);
      expect(truncate(h.t, max).trim().length).toBeGreaterThan(0);
    }
  });
});
