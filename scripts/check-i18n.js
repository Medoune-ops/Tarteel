#!/usr/bin/env node
/**
 * Détecte le texte français en dur dans le JSX (app/**\/*.tsx) — tout ce qui
 * n'est pas passé par tr('clé')/t('clé') restera figé en français quand
 * l'utilisateur bascule l'app en anglais.
 *
 * Heuristique volontairement simple : repère un mot capitalisé (donc probable
 * début de phrase/label) suivi de minuscules dans un enfant direct de balise
 * JSX (`>Texte<`). Quelques faux positifs assumés (noms propres, marques
 * comme "Tarteel") — à exclure ci-dessous plutôt qu'à ignorer le script.
 *
 * Usage : node scripts/check-i18n.js   (exit 1 si du texte est trouvé)
 *         npm run check:i18n
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'app');

// Mots/expressions qui ne sont jamais des fautes (noms propres, marques,
// termes arabes translittérés qui ne se traduisent pas d'un point de vue UI).
const ALLOWLIST = [
  'Tarteel',
];

const PATTERN = />[A-ZÀ-Ü][a-zà-ÿ' ]{3,}</g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
}

function check() {
  const files = walk(ROOT);
  const findings = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      // Ignore les lignes de style (styles.xxx, StyleSheet.create…) — le
      // motif ne les cible normalement pas, mais on protège contre les faux
      // positifs sur des valeurs de style textuelles improbables.
      if (/styles\.|StyleSheet\.create/.test(line)) return;
      const matches = line.match(PATTERN);
      if (!matches) return;
      for (const m of matches) {
        const text = m.slice(1, -1);
        if (ALLOWLIST.some((allowed) => text.includes(allowed))) continue;
        findings.push({ file: path.relative(process.cwd(), file), line: i + 1, text });
      }
    });
  }

  if (findings.length === 0) {
    console.log('✓ Aucun texte français en dur détecté dans app/**/*.tsx');
    return 0;
  }

  console.error(`✗ ${findings.length} texte(s) en dur détecté(s) — utilise tr('clé')/t('clé') à la place :\n`);
  for (const f of findings) {
    console.error(`  ${f.file}:${f.line}  →  "${f.text}"`);
  }
  console.error(
    '\nSi un de ces textes ne doit vraiment pas être traduit (nom propre, marque),' +
    '\najoute-le à ALLOWLIST dans scripts/check-i18n.js.',
  );
  return 1;
}

process.exit(check());
