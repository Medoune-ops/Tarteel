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
 * Parti pris visuel : hors-ligne, l'erreur tient dans une seule carte et la
 * place est donnée à ce qui FONCTIONNE — chaque destination reprend la
 * couleur et l'emblème de son écran, pour être reconnue au premier coup d'œil.
 * Un écran d'erreur qui n'offre aucune issue donne l'impression que toute
 * l'app est cassée, alors qu'une bonne partie reste utilisable.
 */
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '../lib/api/client';
import { useTheme } from '../utils/useTheme';
import { useT, type I18nKey } from '../lib/i18n';

/** Onglet d'où vient l'écran : adapte la phrase d'explication et la carte « en pause ». */
export type OfflineContext = 'learn' | 'review' | 'league';

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
  /** Titre affiché en haut avec la pastille « Hors ligne » (onglets sans en-tête). */
  title?: string;
  context?: OfflineContext;
}

/** Vrai quand la requête n'a jamais atteint le serveur. */
export function isOffline(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

type Glyph = keyof typeof Feather.glyphMap;

/** Destinations qui fonctionnent sans réseau, chacune dans la couleur de son écran. */
const EXITS: { glyph: Glyph; labelKey: I18nKey; descKey: I18nKey; route: Href; color: string }[] = [
  { glyph: 'book-open', labelKey: 'offline.exitHadiths', descKey: 'offline.exitHadithsDesc', route: '/(app)/hadiths', color: '#1F9A6E' },
  { glyph: 'music', labelKey: 'offline.exitTajwid', descKey: 'offline.exitTajwidDesc', route: '/(app)/tajwid', color: '#7A55F0' },
  { glyph: 'star', labelKey: 'offline.exitAsma', descKey: 'offline.exitAsmaDesc', route: '/(app)/asma', color: '#2FA81F' },
  { glyph: 'moon', labelKey: 'offline.exitPrayer', descKey: 'offline.exitPrayerDesc', route: '/(app)/prieres', color: '#14A3B8' },
];

const CONTEXT: Record<OfflineContext, { note: I18nKey; glyph: Glyph; lockTitle: I18nKey; lockSub: I18nKey }> = {
  learn: { note: 'offline.noteLearn', glyph: 'lock', lockTitle: 'offline.lockLearnTitle', lockSub: 'offline.lockLearnSub' },
  review: { note: 'offline.noteReview', glyph: 'repeat', lockTitle: 'offline.lockReviewTitle', lockSub: 'offline.lockReviewSub' },
  league: { note: 'offline.noteLeague', glyph: 'award', lockTitle: 'offline.lockLeagueTitle', lockSub: 'offline.lockLeagueSub' },
};

// Forme d'onde décorative de la carte d'écoute (fixe : 40 barres, 16 « jouées »).
const WAVE = Array.from({ length: 40 }, (_, i) => ({
  h: Math.round(6 + Math.abs(Math.sin(i * 1.7) * 14 + Math.sin(i * 0.6) * 8)),
  played: i < 16,
}));

export default function OfflineState({ error, onRetry, showOfflineExits, title, context }: Props) {
  const T = useTheme();
  const tr = useT();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const offline = isOffline(error);
  const withExits = offline && showOfflineExits;

  // Hors-ligne avec destinations : l'erreur tient dans une carte, le reste de
  // l'écran montre ce qui marche encore sans réseau.
  if (withExits) {
    const ctx = context ? CONTEXT[context] : null;
    const chipBg = T.isDark ? '#1E1C2B' : '#EFECF6';
    return (
      <ScrollView
        contentContainerStyle={[styles.exitsScreen, title ? { paddingTop: insets.top + 14 } : null]}
        showsVerticalScrollIndicator={false}
      >
        {title && (
          <View style={styles.headRow}>
            <Text style={[styles.headTitle, { color: T.text }]} numberOfLines={1}>{title}</Text>
            <View style={[styles.chip, { backgroundColor: chipBg }]}>
              <View style={styles.chipDot} />
              <Text style={[styles.chipText, { color: T.textSecondary }]}>{tr('offline.chip')}</Text>
            </View>
          </View>
        )}

        <LinearGradient
          colors={['#3A3658', '#2A2744', '#1F1C36']}
          locations={[0, 0.6, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBlob} />
          <View style={styles.heroIcon}>
            <Feather name="wifi-off" size={22} color="#fff" />
          </View>
          <View style={styles.flexText}>
            <Text style={styles.heroTitle}>{tr('offline.heroTitle')}</Text>
            <Text style={styles.heroNote}>{tr(ctx?.note ?? 'offline.noteDefault')}</Text>
          </View>
          {onRetry && (
            <Pressable onPress={onRetry} hitSlop={10} style={styles.heroRetry} accessibilityLabel={tr('common.retry')}>
              <Feather name="refresh-cw" size={15} color="#fff" />
            </Pressable>
          )}
        </LinearGradient>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('offline.availableHeading')}</Text>
          <Text style={[styles.sectionCount, { color: T.textSecondary }]}>{tr('offline.spaces', { n: EXITS.length })}</Text>
        </View>

        <View style={styles.grid}>
          {EXITS.map((e) => (
            <Pressable
              key={e.labelKey}
              style={({ pressed }) => [styles.tileWrap, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(e.route)}
            >
              <LinearGradient
                colors={T.isDark ? [`${e.color}2E`, `${e.color}10`] : [`${e.color}1C`, `${e.color}08`]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 1 }}
                style={[styles.tile, { borderColor: T.isDark ? `${e.color}33` : `${e.color}22` }]}
              >
                <View style={[styles.tileGhost, { opacity: T.isDark ? 0.14 : 0.1 }]}>
                  <Feather name={e.glyph} size={84} color={e.color} />
                </View>
                <View style={styles.tileTop}>
                  <View style={[styles.tileIcon, { backgroundColor: e.color, shadowColor: e.color }]}>
                    <Feather name={e.glyph} size={18} color="#fff" />
                  </View>
                  <View style={[styles.tileCheck, { backgroundColor: T.cardBg }]}>
                    <Feather name="check" size={12} color="#2FA81F" />
                  </View>
                </View>
                <View style={styles.tileText}>
                  <Text style={[styles.tileLabel, { color: T.text }]} numberOfLines={1}>{tr(e.labelKey)}</Text>
                  <Text style={[styles.tileDesc, { color: T.isDark ? '#B4B0C4' : '#77728A' }]} numberOfLines={2}>
                    {tr(e.descKey)}
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => router.push('/(app)/tajwid')} style={({ pressed }) => pressed && { opacity: 0.9 }}>
          <LinearGradient
            colors={['#9B7BFF', '#7A55F0', '#5A33D6']}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.listen}
          >
            <View style={styles.listenGhost}>
              <Feather name="music" size={150} color="#fff" />
            </View>
            <View style={styles.listenHead}>
              <View style={styles.flexText}>
                <Text style={styles.listenKicker}>{tr('offline.listenKicker')}</Text>
                <Text style={styles.listenTitle}>{tr('offline.listenTitle')}</Text>
                <Text style={styles.listenSub}>{tr('offline.listenSub')}</Text>
              </View>
              <Text style={styles.listenAr}>القرآن</Text>
            </View>
            <View style={styles.wave}>
              {WAVE.map((w, i) => (
                <View
                  key={i}
                  style={[styles.waveBar, { height: w.h, backgroundColor: w.played ? '#fff' : 'rgba(255,255,255,0.35)' }]}
                />
              ))}
            </View>
            <View style={styles.listenFoot}>
              <View style={styles.playBtn}>
                <Feather name="play" size={17} color="#5A33D6" style={{ marginLeft: 2 }} />
              </View>
              <View style={styles.listenPill}>
                <Feather name="check" size={12} color="#fff" />
                <Text style={styles.listenPillText} numberOfLines={1}>{tr('offline.listenPill')}</Text>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        {ctx && (
          <Pressable
            onPress={onRetry}
            disabled={!onRetry}
            style={({ pressed }) => [styles.lock, { borderColor: T.border }, pressed && { opacity: 0.8 }]}
          >
            <View style={[styles.lockIcon, { backgroundColor: chipBg }]}>
              <Feather name={ctx.glyph} size={18} color={T.textSecondary} />
            </View>
            <View style={styles.flexText}>
              <Text style={[styles.lockTitle, { color: T.text }]}>{tr(ctx.lockTitle)}</Text>
              <Text style={[styles.lockSub, { color: T.textSecondary }]}>{tr(ctx.lockSub)}</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>
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
  exitsScreen: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 14 },
  flexText: { flex: 1, minWidth: 0 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  headTitle: { flexShrink: 1, fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, lineHeight: 36 },
  chip: { height: 30, paddingHorizontal: 11, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A39EB0' },
  chipText: { fontFamily: 'Nunito_900Black', fontSize: 12 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 24, overflow: 'hidden',
    borderBottomWidth: 6, borderBottomColor: '#15132A',
  },
  heroBlob: {
    position: 'absolute', right: -40, top: -50, width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroIcon: {
    width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, lineHeight: 22, color: '#fff' },
  heroNote: { fontFamily: 'Nunito_700Bold', fontSize: 12.5, lineHeight: 17, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  heroRetry: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start',
  },

  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 4 },
  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19 },
  sectionCount: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  // Deux tuiles par ligne, l'écart restant sert de gouttière.
  tileWrap: { width: '48.5%' },
  tile: { minHeight: 124, padding: 14, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  tileGhost: { position: 'absolute', right: -16, bottom: -18 },
  tileTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tileIcon: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.33, shadowRadius: 7, elevation: 3,
  },
  tileCheck: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tileText: { marginTop: 'auto', paddingTop: 12 },
  tileLabel: { fontFamily: 'Nunito_900Black', fontSize: 14.5, lineHeight: 18 },
  tileDesc: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, lineHeight: 15, marginTop: 2 },

  listen: { padding: 16, borderRadius: 24, overflow: 'hidden' },
  listenGhost: { position: 'absolute', right: -26, top: -26, opacity: 0.16 },
  listenHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listenKicker: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: 'rgba(255,255,255,0.92)' },
  listenTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 27, color: '#fff', marginTop: 4 },
  listenSub: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 3 },
  listenAr: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 26, color: '#fff', opacity: 0.95 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 30, marginTop: 14 },
  waveBar: { flex: 1, borderRadius: 2 },
  listenFoot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#280A78', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  listenPill: {
    flex: 1, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  listenPillText: { flexShrink: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: '#fff' },

  lock: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed' },
  lockIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lockTitle: { fontFamily: 'Nunito_900Black', fontSize: 14 },
  lockSub: { fontFamily: 'Nunito_700Bold', fontSize: 12, marginTop: 1 },

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
