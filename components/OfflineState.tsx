/**
 * État affiché quand un écran ne peut pas charger ses données.
 *
 * Deux raisons très différentes étaient jusqu'ici présentées à l'identique
 * (icône « wifi barré » + « Impossible de charger ») :
 *   - HORS-LIGNE : le téléphone n'a pas joint le serveur (ApiError status 0) ;
 *   - PANNE SERVEUR : le serveur a répondu, mais en erreur.
 * Dire « vérifie ta connexion » à quelqu'un dont la connexion marche est
 * trompeur, et l'invite à chercher un problème chez lui qui n'existe pas.
 *
 * Parti pris visuel : hors-ligne, l'erreur est réduite à une ligne discrète et
 * la place est donnée à ce qui FONCTIONNE — chaque destination reprend la
 * couleur et l'emblème de son écran, pour être reconnue au premier coup d'œil.
 * Un écran d'erreur qui n'offre aucune issue donne l'impression que toute
 * l'app est cassée, alors qu'une bonne partie reste utilisable.
 */
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { ApiError } from '../lib/api/client';
import { useTheme } from '../utils/useTheme';
import { useT, type I18nKey } from '../lib/i18n';

interface Props {
  /** L'erreur interceptée, pour distinguer hors-ligne et panne serveur. */
  error?: unknown;
  /** Relance le chargement. Absent = pas de bouton Réessayer. */
  onRetry?: () => void;
  /**
   * Propose les écrans qui fonctionnent sans réseau. À activer sur les écrans
   * qui sont un cul-de-sac hors-ligne, pas sur ceux qui gardent leur en-tête
   * et un retour.
   */
  showOfflineExits?: boolean;
}

/** Vrai quand la requête n'a jamais atteint le serveur. */
export function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

/**
 * Destinations proposées hors-ligne. Les dégradés reprennent EXACTEMENT ceux
 * des écrans visés (hadiths.tsx, asma.tsx, prieres.tsx, tajwid.tsx) : la carte
 * annonce visuellement où elle mène.
 */
const EXITS: {
  emoji: string;
  labelKey: I18nKey;
  descKey: I18nKey;
  route: Href;
  colors: readonly [string, string];
}[] = [
  { emoji: '📜', labelKey: 'offline.exitHadiths', descKey: 'offline.exitHadithsDesc', route: '/(app)/hadiths', colors: ['#3C8F6B', '#2E7355'] },
  { emoji: '🎧', labelKey: 'offline.exitTajwid', descKey: 'offline.exitTajwidDesc', route: '/(app)/tajwid', colors: ['#9A6CF5', '#7C3AED'] },
  { emoji: '✨', labelKey: 'offline.exitAsma', descKey: 'offline.exitAsmaDesc', route: '/(app)/asma', colors: ['#8B5CF6', '#6B4DFF'] },
  { emoji: '🕌', labelKey: 'offline.exitPrayer', descKey: 'offline.exitPrayerDesc', route: '/(app)/prieres', colors: ['#1F8A70', '#26A17B'] },
];

export default function OfflineState({ error, onRetry, showOfflineExits }: Props) {
  const T = useTheme();
  const tr = useT();
  const router = useRouter();

  const offline = isOffline(error);
  const withExits = offline && showOfflineExits;

  // Avec des destinations à proposer, l'erreur passe au second plan : une
  // ligne sobre en haut, puis la place aux écrans qui marchent.
  if (withExits) {
    return (
      <View style={styles.exitsScreen}>
        <View style={[styles.banner, { backgroundColor: T.cardBg }]}>
          <Feather name="wifi-off" size={16} color="#E0820C" />
          <Text style={[styles.bannerText, { color: T.textSecondary }]} numberOfLines={2}>
            {tr('offline.bannerShort')}
          </Text>
          {onRetry && (
            <Pressable onPress={onRetry} hitSlop={8}>
              <Feather name="refresh-cw" size={16} color="#6B4DFF" />
            </Pressable>
          )}
        </View>

        <Text style={[styles.exitsTitle, { color: T.text }]}>
          {tr('offline.availableTitle')}
        </Text>
        <Text style={[styles.exitsSub, { color: T.textTertiary }]}>
          {tr('offline.availableSub')}
        </Text>

        <View style={styles.grid}>
          {EXITS.map((e) => (
            <Pressable
              key={e.labelKey}
              style={({ pressed }) => [styles.cardWrap, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(e.route)}
            >
              <LinearGradient
                colors={e.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <Text style={styles.cardEmoji}>{e.emoji}</Text>
                <Text style={styles.cardLabel} numberOfLines={1}>{tr(e.labelKey)}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{tr(e.descKey)}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // Sans destinations (écran qui garde son en-tête, ou panne serveur) :
  // message centré classique.
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
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Version avec destinations ──
  exitsScreen: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11,
  },
  bannerText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 13, lineHeight: 18 },

  exitsTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, marginTop: 26 },
  exitsSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, marginTop: 3, lineHeight: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
  // 48 % laisse l'espace du `gap` entre deux cartes par ligne.
  cardWrap: { width: '48%' },
  card: {
    borderRadius: 18, padding: 14, minHeight: 118, justifyContent: 'flex-end',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14, shadowRadius: 10, elevation: 3,
  },
  cardEmoji: { fontSize: 26, marginBottom: 8 },
  cardLabel: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16, color: '#fff' },
  cardDesc: {
    fontFamily: 'Nunito_600SemiBold', fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)', marginTop: 2, lineHeight: 15,
  },

  // ── Version message centré ──
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
});
