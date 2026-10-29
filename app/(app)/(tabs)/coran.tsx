import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  QuranIcon, CrescentStarIcon, ProphetsIcon,
  AblutionsIcon, MosqueIcon, HadithIcon,
} from '../../../components/IslamicIcons';
import { useTheme } from '../../../utils/useTheme';
import { useScrollToTopOnTabPress } from '../../../utils/useScrollToTopOnTabPress';
import { useLectureProgressStore } from '../../../store/lectureProgressStore';
import { useT, type I18nKey } from '../../../lib/i18n';

type ThemeIcon = (p: { size?: number; color?: string }) => React.ReactElement;

type Theme = {
  id: string;
  Icon: ThemeIcon;
  titreKey: I18nKey;
  sousKey: I18nKey;
  route: string;
  color: string;
};

/** MosqueIcon est dessinée pour les nœuds du parcours (viewBox 52, prop `locked`).
    Ici on la veut à la taille des autres icônes de tuile. */
const PriereIcon: ThemeIcon = ({ size = 28 }) => <MosqueIcon size={size + 10} />;

const THEMES: Theme[] = [
  { id: 'coran',     Icon: QuranIcon,        titreKey: 'coran.theme.coran.titre',     sousKey: 'coran.theme.coran.sous',     route: '/(app)/docs/coran',     color: '#6B4DFF' },
  { id: 'islam',     Icon: CrescentStarIcon, titreKey: 'coran.theme.islam.titre',     sousKey: 'coran.theme.islam.sous',     route: '/(app)/docs/islam',     color: '#2FA81F' },
  { id: 'prophetes', Icon: ProphetsIcon,     titreKey: 'coran.theme.prophetes.titre', sousKey: 'coran.theme.prophetes.sous', route: '/(app)/docs/prophetes', color: '#F0820C' },
  { id: 'ablutions', Icon: AblutionsIcon,    titreKey: 'coran.theme.ablutions.titre', sousKey: 'coran.theme.ablutions.sous', route: '/(app)/docs/ablutions', color: '#14A3B8' },
  { id: 'priere',    Icon: PriereIcon,       titreKey: 'coran.theme.priere.titre',    sousKey: 'coran.theme.priere.sous',    route: '/(app)/docs/priere',    color: '#E0407A' },
  { id: 'hadiths',   Icon: HadithIcon,       titreKey: 'coran.theme.hadiths.titre',   sousKey: 'coran.theme.hadiths.sous',   route: '/(app)/hadiths',        color: '#1F9A6E' },
];

export default function CoranScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const scrollRef = useScrollToTopOnTabPress();
  const last = useLectureProgressStore((s) => s.last);

  /*
   * Les chiffres de l'en-tête. « 114 sourates » ouvre la lecture libre,
   * « 25 prophètes » la page qui les présente ; les versets restent un repère.
   */
  const FAITS: { val: string; lbl: string; route?: string }[] = [
    { val: '114',   lbl: tr('coran.factSourates'),  route: '/(app)/lecture-libre' },
    { val: '6 236', lbl: tr('coran.factVersets') },
    { val: '25',    lbl: tr('coran.factProphetes'), route: '/(app)/docs/prophetes' },
  ];

  const pct = last ? Math.min(100, (last.verset / Math.max(1, last.total)) * 100) : 0;
  const openReading = () => router.push(
    (last ? `/(app)/lecture/${last.numero}?verset=${last.verset}` : '/(app)/lecture-libre') as never,
  );

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        <LinearGradient
          colors={T.isDark ? ['#6A4FE8', '#4E35C9', '#3A24A0'] : ['#8A6BFF', '#6B4DFF', '#5B3FD6']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroGlow} pointerEvents="none" />

          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>{tr('coran.title')}</Text>
            <Pressable
              style={styles.heroBtn}
              onPress={() => router.push('/(app)/lecture-libre')}
              accessibilityRole="button"
              accessibilityLabel={tr('coran.search')}
              hitSlop={6}
            >
              <Feather name="search" size={17} color="#fff" />
            </Pressable>
          </View>

          {/* Reprendre la lecture — ou l'ouvrir, la première fois */}
          <Pressable
            style={({ pressed }) => [styles.resume, pressed && { opacity: 0.85 }]}
            onPress={openReading}
            accessibilityRole="button"
          >
            <View style={styles.resumeTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeLabel}>{tr(last ? 'coran.resumeLabel' : 'coran.startLabel')}</Text>
                <Text style={styles.resumeName} numberOfLines={1}>{last ? last.nom : tr('coran.startTitle')}</Text>
                <Text style={styles.resumeMeta} numberOfLines={1}>
                  {last
                    ? tr('coran.resumeMeta', { n: last.numero, v: last.verset, t: last.total })
                    : tr('coran.startMeta')}
                </Text>
              </View>
              <Text style={styles.resumeArabic} numberOfLines={1}>{last ? last.nomArabe : 'القرآن'}</Text>
            </View>
            <View style={styles.resumeBottom}>
              <View style={styles.resumeTrack}>
                <View style={[styles.resumeFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.resumeBtn}>
                <Feather name="play" size={11} color="#4A2FC4" />
                <Text style={styles.resumeBtnText}>{tr(last ? 'coran.read' : 'coran.start')}</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.faits}>
            {FAITS.map((f, i) => {
              const contenu = (
                <>
                  <Text style={styles.faitVal}>{f.val}</Text>
                  <Text style={styles.faitLbl}>{f.lbl}</Text>
                </>
              );
              return (
                <View key={i} style={styles.faitRow}>
                  {i > 0 && <View style={styles.faitSep} />}
                  {f.route ? (
                    <Pressable
                      style={({ pressed }) => [styles.fait, pressed && { opacity: 0.7 }]}
                      onPress={() => router.push(f.route as never)}
                      accessibilityRole="button"
                      accessibilityLabel={`${f.val} ${f.lbl}`}
                    >
                      {contenu}
                    </Pressable>
                  ) : (
                    <View style={styles.fait}>{contenu}</View>
                  )}
                </View>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('coran.exploreThemes')}</Text>
          <View style={styles.grid}>
            {THEMES.map((t) => (
              <Pressable
                key={t.id}
                style={({ pressed }) => [styles.tileWrap, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push(t.route as never)}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[t.color + (T.isDark ? '2E' : '1C'), t.color + (T.isDark ? '10' : '08')]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.6, y: 1 }}
                  style={[styles.tile, { borderColor: t.color + (T.isDark ? '33' : '22') }]}
                >
                  {/* Grande icône fantôme dans le coin */}
                  <View style={[styles.ghost, { opacity: T.isDark ? 0.14 : 0.1 }]} pointerEvents="none">
                    <t.Icon size={80} color={t.color} />
                  </View>
                  <View style={[styles.tileIcon, { backgroundColor: t.color, shadowColor: t.color }]}>
                    <t.Icon size={20} color="#fff" />
                  </View>
                  <View style={{ marginTop: 'auto', paddingTop: 12 }}>
                    <Text style={[styles.tileTitle, { color: T.text }]} numberOfLines={1}>{tr(t.titreKey)}</Text>
                    <Text style={[styles.tileSub, { color: T.isDark ? '#B4B0C4' : '#77728A' }]} numberOfLines={2}>
                      {tr(t.sousKey)}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: {
    paddingHorizontal: 18, paddingBottom: 18, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  heroGlow: {
    position: 'absolute', right: -80, top: -100, width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff' },
  heroBtn: {
    width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  resume: {
    marginTop: 16, padding: 14, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  resumeTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  resumeLabel: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.1, color: 'rgba(255,255,255,0.8)' },
  resumeName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, lineHeight: 28, color: '#fff', marginTop: 4 },
  resumeMeta: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  resumeArabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, lineHeight: 44, color: '#fff', maxWidth: 130 },
  resumeBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  resumeTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  resumeFill: { height: '100%', borderRadius: 3, backgroundColor: '#fff' },
  resumeBtn: {
    height: 32, paddingHorizontal: 14, borderRadius: 11, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  resumeBtnText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#4A2FC4' },
  faits: { flexDirection: 'row', marginTop: 14 },
  faitRow: { flex: 1, flexDirection: 'row', alignItems: 'stretch' },
  faitSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  fait: { flex: 1, alignItems: 'center' },
  faitVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, color: '#fff' },
  faitLbl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: 'rgba(255,255,255,0.78)' },
  body: { paddingHorizontal: 16, paddingTop: 18 },
  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, marginBottom: 12, paddingHorizontal: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tileWrap: { width: '48.5%' },
  tile: {
    minHeight: 124, padding: 14, borderRadius: 22, borderWidth: 1, overflow: 'hidden',
  },
  ghost: { position: 'absolute', right: -16, bottom: -18 },
  tileIcon: {
    width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  tileTitle: { fontFamily: 'Nunito_900Black', fontSize: 14, lineHeight: 18 },
  tileSub: { fontFamily: 'Nunito_700Bold', fontSize: 11.5, lineHeight: 15, marginTop: 2 },
});
