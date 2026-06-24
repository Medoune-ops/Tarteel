import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DeviceStatusBarProps {
  /** Conservé pour compat — la vraie barre d'état système gère déjà le contenu. */
  dark?: boolean;
}

/**
 * Réserve l'espace de la vraie barre d'état du téléphone (encoche / Dynamic Island).
 * Remplace l'ancienne barre factice "9:41 / 100%" de la maquette, inutile sur appareil réel.
 */
export default function DeviceStatusBar(_props: DeviceStatusBarProps) {
  const insets = useSafeAreaInsets();
  return <View style={{ height: insets.top || 12 }} />;
}
