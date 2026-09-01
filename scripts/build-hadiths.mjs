/**
 * Prépare les recueils de hadiths embarqués dans l'app.
 *
 * Source : hadith-api (fawazahmed0), fichiers JSON statiques sur jsDelivr,
 * licence Unlicense. On télécharge une fois, on nettoie, et on écrit dans
 * assets/hadiths/ — les hadiths ne changent jamais, aucune raison qu'ils
 * dépendent du réseau à l'exécution.
 *
 * Nettoyage appliqué :
 *  - suppression des entrées vides (Muslim en compte ~256, soit 3,4 %) ;
 *  - on ne garde que numéro + texte + chapitre, le reste est inutile ici ;
 *  - les chapitres sont regroupés pour permettre une navigation par thème.
 *
 * Usage : node scripts/build-hadiths.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const OUT_DIR = path.join(process.cwd(), 'assets', 'hadiths');

/** Recueils retenus, dans l'ordre d'affichage souhaité. */
const COLLECTIONS = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

/** Langues servies : le préfixe correspond à celui des éditions source. */
const LANGS = [
  { lang: 'fr', prefix: 'fra' },
  { lang: 'en', prefix: 'eng' },
];

const EDITIONS = LANGS.flatMap(({ lang, prefix }) =>
  COLLECTIONS.map((id) => ({ id, lang, file: `${prefix}-${id}` })),
);

async function fetchEdition(file) {
  const res = await fetch(`${BASE}/${file}.min.json`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return res.json();
}

/**
 * Chapitre d'un hadith, d'après les bornes de section_details.
 *
 * Quelques numéros tombent entre deux bornes (6 cas dans Bukhari : des
 * hadiths à numéro intercalaire). Les laisser au chapitre 0 les rendait
 * invisibles dans la navigation par chapitre, alors que leur texte est
 * valide — on les rattache donc au dernier chapitre commencé avant eux.
 */
function sectionOf(details, num) {
  let fallback = 0;
  for (const [key, d] of Object.entries(details ?? {})) {
    if (num >= d.hadithnumber_first && num <= d.hadithnumber_last) return Number(key);
    if (d.hadithnumber_first <= num && Number(key) > fallback) fallback = Number(key);
  }
  return fallback;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { id, lang, file } of EDITIONS) {
    process.stdout.write(`${lang}/${id}… `);
    const raw = await fetchEdition(file);

    const sections = raw.metadata?.sections ?? {};
    const details = raw.metadata?.section_details ?? {};

    // Entrées vides écartées : elles afficheraient une carte blanche.
    const hadiths = raw.hadiths
      .filter((h) => h.text && h.text.trim().length >= 10)
      .map((h) => ({
        n: h.hadithnumber,
        s: sectionOf(details, h.hadithnumber),
        t: h.text.trim(),
      }));

    // Seuls les chapitres réellement porteurs de hadiths sont conservés.
    const used = new Set(hadiths.map((h) => h.s));
    const chapters = Object.entries(sections)
      .filter(([key, label]) => label && label.trim() && used.has(Number(key)))
      .map(([key, label]) => ({ id: Number(key), en: label.trim() }));

    // Extension `.hadith` et non `.json` : Metro traite le JSON comme un
    // module source, ce qui inlinerait les 7,7 Mo dans le bundle et les
    // chargerait à chaque démarrage. En asset, ils sont livrés avec l'app
    // mais lus seulement à l'ouverture de l'écran (voir metro.config.js).
    const payload = { id, lang, name: raw.metadata?.name ?? id, chapters, hadiths };
    const out = path.join(OUT_DIR, `${id}.${lang}.hadith`);
    fs.writeFileSync(out, JSON.stringify(payload));

    const kb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${hadiths.length} hadiths, ${chapters.length} chapitres, ${kb} Ko`);

  }

  console.log('\nÉcrit dans assets/hadiths/');
}

main().catch((e) => { console.error(e); process.exit(1); });
