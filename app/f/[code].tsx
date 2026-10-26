import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Lien universel / App Link `https://tarteel.sn/f/:code` (lien partagé ou QR
 * scanné avec l'appareil photo) : même traitement que `tarteel://add?code=`.
 * Tant que les fichiers .well-known ne sont pas en ligne, le lien ouvre la
 * page web tarteel.sn/f/:code, qui renvoie ici via tarteel://add.
 */
export default function InviteLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  return <Redirect href={{ pathname: '/add', params: code ? { code } : {} }} />;
}
