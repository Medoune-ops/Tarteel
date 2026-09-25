/**
 * Partage d'un hadith en image.
 *
 * Les gens partagent déjà des hadiths, mais en captures d'écran moches. On
 * leur donne du beau : le hadith rendu sur un visuel propre, prêt pour une
 * story ou WhatsApp. C'est aussi le canal d'acquisition le plus naturel de
 * l'app — chaque partage la montre à des gens qui ne la connaissent pas.
 *
 * Fonctionnement : le visuel (`HadithShareCard`) est monté HORS DU CHAMP
 * VISIBLE, capturé en PNG, puis passé à la feuille de partage du système.
 * L'utilisateur ne voit jamais la carte apparaître à l'écran.
 *
 * ⚠️ CODE NATIF. `react-native-view-shot` ne fonctionne pas dans Expo Go : il
 * faut un build de développement (`npx expo prebuild` puis un build EAS).
 * D'où les gardes ci-dessous — sur un environnement sans le module natif, le
 * bouton de partage est simplement masqué plutôt que de planter.
 */
import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import HadithShareCard, { SHARE_WIDTH } from '../components/HadithShareCard';

/** Ce qu'il faut pour composer le visuel. */
export interface ShareTarget {
  text: string;
  collectionLabel: string;
  number: number;
  themeColor: string;
}

/**
 * Chargement paresseux des deux modules natifs du partage.
 *
 * Un `import` direct ferait planter l'ÉCRAN ENTIER dans Expo Go et dans les
 * tests, où ces modules n'existent pas — et comme l'écran du flux les charge
 * au montage, c'est toute la section Hadiths qui deviendrait inaccessible.
 * On les résout donc à la demande, en renvoyant `null` s'ils manquent : le
 * bouton de partage disparaît, le reste fonctionne.
 */
function loadViewShot(): { captureRef: (ref: unknown, opts: object) => Promise<string> } | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-view-shot') as {
      captureRef?: (ref: unknown, opts: object) => Promise<string>;
    };
    return mod.captureRef ? { captureRef: mod.captureRef } : null;
  } catch {
    return null;
  }
}

/** Feuille de partage du système. Absente d'Expo Go, comme `view-shot`. */
interface SharingModule {
  isAvailableAsync: () => Promise<boolean>;
  shareAsync: (url: string, options?: { mimeType?: string; UTI?: string }) => Promise<void>;
}

function loadSharing(): SharingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-sharing') as Partial<SharingModule>;
    return mod.isAvailableAsync && mod.shareAsync ? (mod as SharingModule) : null;
  } catch {
    return null;
  }
}

export interface UseHadithShare {
  /** Le partage est-il possible sur cet appareil ? */
  available: boolean;
  /** Un partage est-il en cours ? (pour désactiver le bouton) */
  sharing: boolean;
  /** Lance le partage du hadith donné. */
  share: (target: ShareTarget, appName: string) => Promise<void>;
  /**
   * À rendre quelque part dans l'écran : le visuel hors champ qui sera
   * capturé. Sans lui, `share` n'a rien à photographier.
   */
  portal: React.ReactNode;
}

export function useHadithShare(): UseHadithShare {
  const shotRef = useRef<View>(null);
  const [target, setTarget] = useState<{ t: ShareTarget; appName: string } | null>(null);
  const [sharing, setSharing] = useState(false);

  // Résolus une fois : soit les modules natifs sont là, soit ils ne le
  // seront pas. Les deux sont nécessaires — capturer sans pouvoir partager
  // ne sert à rien.
  const viewShot = useRef(loadViewShot()).current;
  const sharingModule = useRef(loadSharing()).current;
  const available = viewShot !== null && sharingModule !== null;

  const share = useCallback(async (t: ShareTarget, appName: string) => {
    if (!viewShot || !sharingModule || sharing) return;
    setSharing(true);
    setTarget({ t, appName });

    try {
      // Laisse un cycle de rendu au visuel pour être monté et mesuré avant
      // la capture — sans cette attente, on photographie une vue vide.
      await new Promise((r) => setTimeout(r, 60));

      const uri = await viewShot.captureRef(shotRef, {
        format: 'png',
        quality: 1,
        width: SHARE_WIDTH,
        result: 'tmpfile',
      });

      if (await sharingModule.isAvailableAsync()) {
        await sharingModule.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
        });
      }
    } catch {
      // Partage annulé ou capture impossible : on ne dérange pas
      // l'utilisateur avec une alerte, il verra simplement qu'il ne s'est
      // rien passé.
    } finally {
      setSharing(false);
      setTarget(null);
    }
  }, [viewShot, sharingModule, sharing]);

  /*
   * Le visuel, monté hors du champ visible.
   *
   * `left: -9999` plutôt que `opacity: 0` ou `display: none` : une vue
   * transparente ou masquée se capture vide sur Android, alors qu'une vue
   * simplement déportée est bien composée.
   */
  const portal = target ? (
    <View style={styles.offscreen} pointerEvents="none">
      <View ref={shotRef} collapsable={false}>
        <HadithShareCard
          text={target.t.text}
          collectionLabel={target.t.collectionLabel}
          number={target.t.number}
          themeColor={target.t.themeColor}
          appName={target.appName}
        />
      </View>
    </View>
  ) : null;

  return { available, sharing, share, portal };
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', left: -9999, top: 0 },
});
