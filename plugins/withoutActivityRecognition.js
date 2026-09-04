const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Retire ACTIVITY_RECOGNITION du manifeste Android fusionné.
 *
 * expo-sensors declare cette permission dans son propre manifeste (pour le
 * podometre), et la fusion l'ajoute donc a l'app meme si on ne s'en sert pas.
 * Tarteel n'utilise d'expo-sensors que le Magnetometer, pour la boussole Qibla
 * (components/QiblaCompass.tsx) — le podometre n'est jamais appele.
 *
 * Google Play la classe parmi les permissions sante/fitness : la garder oblige
 * a remplir la declaration "Exigences du reglement concernant les applis de
 * sante", impossible a justifier pour une app d'apprentissage du Coran, et
 * expose au rejet lors de l'examen.
 *
 * `tools:node="remove"` demande au manifest merger de la supprimer du resultat
 * final, sans toucher au package lui-meme.
 */
module.exports = function withoutActivityRecognition(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    // Le namespace `tools` doit etre declare pour que tools:node soit compris.
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    manifest['uses-permission'] = manifest['uses-permission'] || [];

    const NAME = 'android.permission.ACTIVITY_RECOGNITION';

    // Retire une eventuelle declaration existante avant d'ajouter la notre,
    // sinon le merger voit deux entrees contradictoires pour la meme permission.
    manifest['uses-permission'] = manifest['uses-permission'].filter(
      (p) => p.$?.['android:name'] !== NAME,
    );

    manifest['uses-permission'].push({
      $: { 'android:name': NAME, 'tools:node': 'remove' },
    });

    return cfg;
  });
};
