const fs = require('fs');
const path = require('path');
const { withDangerousMod, withXcodeProject } = require('@expo/config-plugins');

/**
 * Active la localisation des widgets iOS.
 *
 * Les libelles des widgets vivent dans widgets/ios/TarteelWidgets/<lang>.lproj/
 * Localizable.strings (voir Localization.swift). expo-widget copie bien ces
 * dossiers et ajoute les .strings a la phase Resources, mais il ne declare la
 * langue nulle part — or iOS n'active un .lproj que si la langue est connue du
 * bundle. Sans cette declaration, un iPhone en anglais continue d'afficher le
 * francais : le systeme ignore purement et simplement en.lproj.
 *
 * Deux declarations sont necessaires, et elles ne se remplacent pas :
 *
 *  1. CFBundleLocalizations dans l'Info.plist de l'extension — c'est ce que le
 *     systeme lit au runtime pour savoir quelles langues le bundle propose.
 *  2. knownRegions dans le projet Xcode — sans quoi Xcode peut ne pas embarquer
 *     les .lproj dans le produit final.
 *
 * Le dossier ios/ est en prebuild (gitignore, regenere a chaque build), donc
 * ces deux fichiers ne peuvent pas etre versionnes : ce plugin les ajuste a
 * chaque prebuild.
 */

const LANGS = ['fr', 'en'];
const TARGET = 'TarteelWidgets';

/** Ajoute CFBundleLocalizations a l'Info.plist de l'extension widget. */
function withWidgetInfoPlistLocalizations(config) {
  return withDangerousMod(config, [
    'ios',
    (cfg) => {
      const plistPath = path.join(cfg.modRequest.platformProjectRoot, TARGET, 'Info.plist');

      // expo-widget cree ce fichier dans son propre mod ; s'il n'est pas encore
      // la, mieux vaut echouer bruyamment que produire un build ou les widgets
      // restent silencieusement en francais.
      if (!fs.existsSync(plistPath)) {
        throw new Error(
          `[withWidgetLocalizations] ${plistPath} introuvable. Le plugin doit passer ` +
            `APRES expo-widget dans app.json.`,
        );
      }

      let contents = fs.readFileSync(plistPath, 'utf-8');

      if (contents.includes('CFBundleLocalizations')) {
        return cfg; // deja declare (prebuild rejoue sur un dossier existant)
      }

      const entry =
        `\n\t<key>CFBundleLocalizations</key>\n\t<array>\n` +
        LANGS.map((l) => `\t\t<string>${l}</string>`).join('\n') +
        `\n\t</array>`;

      const at = contents.indexOf('<dict>');
      if (at === -1) {
        throw new Error(`[withWidgetLocalizations] ${plistPath} est malforme : pas de <dict>.`);
      }
      contents = contents.slice(0, at + 6) + entry + contents.slice(at + 6);
      fs.writeFileSync(plistPath, contents);

      return cfg;
    },
  ]);
}

/** Declare fr/en dans knownRegions du projet Xcode. */
function withWidgetKnownRegions(config) {
  return withXcodeProject(config, (cfg) => {
    const project = cfg.modResults;
    for (const lang of LANGS) {
      // addKnownRegion est idempotent (il verifie la presence avant d'ajouter).
      project.addKnownRegion(lang);
    }
    return cfg;
  });
}

module.exports = function withWidgetLocalizations(config) {
  return withWidgetKnownRegions(withWidgetInfoPlistLocalizations(config));
};
