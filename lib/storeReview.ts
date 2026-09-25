import { Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';

/**
 * Déclenche la popup de notation NATIVE (étoiles in-app, sans quitter l'app).
 *
 * ⚠️ On ne contrôle pas son affichage et on n'a AUCUN retour : l'OS décide.
 * Apple plafonne à ~3 popups par an et par utilisateur, Google a son propre
 * quota ; au-delà, l'appel ne fait rien, silencieusement. Impossible donc de
 * savoir si l'utilisateur a vraiment noté — d'où les garde-fous en amont
 * (voir reviewPromptStore) pour ne dépenser ces occasions qu'à bon escient.
 *
 * Ne fonctionne ni en Expo Go, ni sur simulateur, ni sur TestFlight
 * (`isAvailableAsync()` y renvoie false) : tester sur un vrai build store.
 *
 * Repli : ouvrir la fiche du store. Il lit `ios.appStoreUrl` /
 * `android.playStoreUrl` dans app.json — les deux y sont renseignés, sans URL
 * de pays pour qu'Apple redirige chacun vers sa boutique locale.
 */
export async function requestStoreReview(): Promise<void> {
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return;
    }
    const url = StoreReview.storeUrl();
    if (url) await Linking.openURL(url);
  } catch {
    // Jamais bloquant : une notation ratée ne doit pas casser l'écran appelant.
  }
}
