/**
 * État d'erreur partagé, affiché quand un écran ne peut pas charger ses
 * données.
 *
 * Deux raisons très différentes étaient jusqu'ici présentées à l'identique
 * (icône « wifi barré » + « Impossible de charger ») :
 *   - HORS-LIGNE : le téléphone n'a pas joint le serveur (ApiError status 0) ;
 *   - PANNE SERVEUR : le serveur a répondu, mais en erreur.
 * Dire « vérifie ta connexion » à quelqu'un dont la connexion marche est
 * trompeur, et l'invite à chercher un problème chez lui qui n'existe pas.
 *
 * Le composant sert aussi à rappeler ce qui RESTE accessible sans réseau —
 * plutôt qu'un cul-de-sac, on propose une sortie.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ApiError } from '../lib/api/client';
import { useTheme } from '../utils/useTheme';
import { useT } from '../lib/i18n';

interface Props {
  /** L'erreur interceptée, pour distinguer hors-ligne et panne serveur. */
  error?: unknown;
  /** Relance le chargement. Absent = pas de bouton Réessayer. */
  onRetry?: () => void;
  /**
   * Propose les écrans qui fonctionnent sans réseau (Coran, 99 noms,
   * hadiths, prières…). À activer sur les écrans qui sont un cul-de-sac
   * hors-ligne, pas sur ceux qui gardent leur en-tête et un retour.
   */
  showOfflineExits?: boolean;
}

/** Vrai quand la requête n'a jamais atteint le serveur. */
export function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

export default function OfflineState({ error, onRetry, showOfflineExits }: Props) {
  const T = useTheme();
  const tr = useT();
  const router = useRouter();

  const offline = isOffline(error);

  return (
    <View style={styles.box}>
      <View style={[styles.iconWrap, { backgroundColor: offline ? '#FFF3E0' : '#FDECEA' }]}>
        <Feather
          name={offline ? 'wifi-off' : 'alert-circle'}
          size={30}
          color={offline ? '#E0820C' : '#E0584F'}
        />
      </View>

      <Text style={[styles.title, { color: T.text }]}>
        {offline ? tr('offline.title') : tr('offline.serverTitle')}
      </Text>

      <Text style={[styles.message, { color: T.textSecondary }]}>
        {offline ? tr('offline.message') : tr('offline.serverMessage')}
      </Text>

      {onRetry && (
        <Pressable style={styles.retryBtn} onPress={onRetry}>
          <Feather name="refresh-cw" size={15} color="#fff" />
          <Text style={styles.retryLabel}>{tr('common.retry')}</Text>
        </Pressable>
      )}

      {/* Hors-ligne, on rappelle ce qui reste utilisable — un écran d'erreur
          sans issue donne l'impression que toute l'app est cassée. */}
      {offline && showOfflineExits && (
        <View style={styles.exits}>
          <Text style={[styles.exitsTitle, { color: T.textTertiary }]}>
            {tr('offline.availableTitle')}
          </Text>

          <View style={styles.exitRow}>
            <ExitChip
              emoji="📜"
              label={tr('offline.exitHadiths')}
              onPress={() => router.push('/(app)/hadiths')}
              cardBg={T.cardBg}
              color={T.text}
            />
            <ExitChip
              emoji="✨"
              label={tr('offline.exitAsma')}
              onPress={() => router.push('/(app)/asma')}
              cardBg={T.cardBg}
              color={T.text}
            />
          </View>
          <View style={styles.exitRow}>
            <ExitChip
              emoji="🕌"
              label={tr('offline.exitPrayer')}
              onPress={() => router.push('/(app)/prieres')}
              cardBg={T.cardBg}
              color={T.text}
            />
            <ExitChip
              emoji="🎧"
              label={tr('offline.exitTajwid')}
              onPress={() => router.push('/(app)/tajwid')}
              cardBg={T.cardBg}
              color={T.text}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function ExitChip({
  emoji, label, onPress, cardBg, color,
}: {
  emoji: string; label: string; onPress: () => void; cardBg: string; color: string;
}) {
  return (
    <Pressable style={[styles.exitChip, { backgroundColor: cardBg }]} onPress={onPress}>
      <Text style={styles.exitEmoji}>{emoji}</Text>
      <Text style={[styles.exitLabel, { color }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  iconWrap: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  title: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, textAlign: 'center' },
  message: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#6B4DFF', paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: 14, marginTop: 6,
  },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },

  exits: { marginTop: 24, width: '100%', gap: 8 },
  exitsTitle: {
    fontFamily: 'Nunito_700Bold', fontSize: 12, textAlign: 'center', marginBottom: 4,
  },
  exitRow: { flexDirection: 'row', gap: 8 },
  exitChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 12, paddingVertical: 11, borderRadius: 12,
  },
  exitEmoji: { fontSize: 16 },
  exitLabel: { fontFamily: 'Nunito_700Bold', fontSize: 13, flex: 1 },
});
