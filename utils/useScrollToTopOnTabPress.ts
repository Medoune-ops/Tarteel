import { useEffect, useRef } from 'react';
import type { ScrollView } from 'react-native';
import { useNavigation } from 'expo-router';

/**
 * Retap sur l'onglet DÉJÀ actif → remonte la ScrollView en haut.
 *
 * La TabBar émet un événement custom `scrollToActive` (voir components/
 * TabBar.tsx) au lieu de re-naviguer, car re-naviguer vers l'écran courant
 * ne produit rien visuellement. Chaque écran d'onglet branche ce hook et
 * passe la ref rendue à sa <ScrollView>.
 */
export function useScrollToTopOnTabPress() {
  const navigation = useNavigation();
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    // @ts-expect-error événement custom émis par TabBar (hors event map du core)
    const unsubscribe = navigation.addListener('scrollToActive', () => {
      ref.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  return ref;
}
