import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useState, useMemo } from 'react';
import DeviceStatusBar from '../../../components/StatusBar';
import { useTheme } from '../../../utils/useTheme';

// ── Données mock sourates terminées ────────────────────────────────────────
const SOURATES = [
  {
    id: 1, numero: 1, nom: 'Al-Fatiha', arabe: 'الفاتحة',
    versets: 7, score: 92, etat: 'maitrise',
    prochaineRevision: "Aujourd'hui",
    couleur: '#34C724', couleurDark: '#2A9E1C', bg: '#E8F9E6',
  },
  {
    id: 2, numero: 112, nom: 'Al-Ikhlas', arabe: 'الإخلاص',
    versets: 4, score: 78, etat: 'revoir',
    prochaineRevision: "Aujourd'hui",
    couleur: '#6B4DFF', couleurDark: '#5438CC', bg: '#EDE8FF',
  },
  {
    id: 3, numero: 113, nom: 'Al-Falaq', arabe: 'الفلق',
    versets: 5, score: 65, etat: 'difficile',
    prochaineRevision: 'Dans 2 jours',
    couleur: '#F0820C', couleurDark: '#C06200', bg: '#FFF0E0',
  },
  {
    id: 4, numero: 114, nom: 'An-Nas', arabe: 'الناس',
    versets: 6, score: 88, etat: 'maitrise',
    prochaineRevision: 'Dans 5 jours',
    couleur: '#34C724', couleurDark: '#2A9E1C', bg: '#E8F9E6',
  },
  {
    id: 5, numero: 108, nom: 'Al-Kawthar', arabe: 'الكوثر',
    versets: 3, score: 55, etat: 'difficile',
    prochaineRevision: 'Dans 1 jour',
    couleur: '#F0820C', couleurDark: '#C06200', bg: '#FFF0E0',
  },
];

const STATS = [
  { label: 'Sourates', value: '5', icon: 'book-open' as const, color: '#6B4DFF' },
  { label: 'Maîtrisées', value: '2', icon: 'award' as const, color: '#34C724' },
  { label: 'À revoir', value: '3', icon: 'alert-circle' as const, color: '#F0820C' },
];

function ScoreRing({ score, color, trackColor }: { score: number; color: string; trackColor: string }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <Svg width={44} height={44} viewBox="0 0 44 44">
      <Circle cx={22} cy={22} r={r} stroke={trackColor} strokeWidth={4} fill="none" />
      <Circle
        cx={22} cy={22} r={r}
        stroke={color} strokeWidth={4} fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 22 22)"
      />
    </Svg>
  );
}

function EtatBadge({ etat }: { etat: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    maitrise: { label: '✓ Maîtrisé', color: '#2A9E1C', bg: '#DEF5E5' },
    revoir:   { label: '↺ À revoir', color: '#6B4DFF', bg: '#EDE8FF' },
    difficile:{ label: '⚡ Difficile', color: '#F0820C', bg: '#FFF0E0' },
  };
  const s = map[etat];
  return (
    <View style={[styles.etatBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.etatText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

export default function RevisionsScreen() {
  const router = useRouter();
  const T = useTheme();
  const [query, setQuery] = useState('');
  const urgentes = SOURATES.filter(s => s.prochaineRevision === "Aujourd'hui");

  const resultats = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SOURATES;
    return SOURATES.filter(s =>
      s.nom.toLowerCase().includes(q) ||
      s.arabe.includes(query.trim()) ||
      String(s.numero).includes(q)
    );
  }, [query]);

  const enRecherche = query.trim().length > 0;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
          <Text style={styles.headerTitle}>Révisions</Text>
          <Text style={styles.headerSub}>Répétition espacée · SRS</Text>
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={styles.statBox}>
                <Feather name={s.icon} size={20} color="#fff" />
                <Text style={styles.statVal}>{s.value}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.body}>

          {/* Barre de recherche */}
          <View style={[styles.searchBar, { backgroundColor: T.cardBg }]}>
            <Feather name="search" size={18} color="#A0A5AE" />
            <TextInput
              style={[styles.searchInput, { color: T.text }]}
              placeholder="Rechercher une sourate…"
              placeholderTextColor="#A0A5AE"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
            {enRecherche && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Feather name="x-circle" size={18} color="#C9CDD4" />
              </Pressable>
            )}
          </View>

          {/* Urgentes aujourd'hui */}
          {!enRecherche && urgentes.length > 0 && (
            <>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { color: T.text }]}>À réviser aujourd'hui</Text>
                <View style={styles.urgentPill}>
                  <Text style={styles.urgentPillText}>{urgentes.length} sourate{urgentes.length > 1 ? 's' : ''}</Text>
                </View>
              </View>
              <View style={[styles.urgentBanner, { backgroundColor: T.cardBg }]}>
                <Text style={styles.urgentIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.urgentBannerTitle, { color: T.text }]}>C'est l'heure de réviser !</Text>
                  <Text style={styles.urgentBannerSub}>
                    {urgentes.map(s => s.nom).join(' · ')} t'attendent
                  </Text>
                </View>
                <Pressable
                  style={styles.urgentBtn}
                  onPress={() => router.push({
                    pathname: '/(app)/revision/flashcard',
                    params: { sourateId: urgentes[0].id },
                  })}
                >
                  <Text style={styles.urgentBtnText}>Commencer</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Liste toutes sourates */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>
            {enRecherche ? `Résultats (${resultats.length})` : 'Mes sourates'}
          </Text>

          {resultats.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: T.text }]}>Aucune sourate trouvée</Text>
              <Text style={styles.emptySub}>Essaie un autre nom ou numéro</Text>
            </View>
          ) : resultats.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.card, { backgroundColor: T.cardBg }]}
              onPress={() => router.push({
                pathname: '/(app)/revision/flashcard',
                params: { sourateId: s.id },
              })}
            >
              {/* Numéro */}
              <View style={[styles.numBox, { backgroundColor: s.bg, borderColor: s.couleur }]}>
                <Text style={[styles.numText, { color: s.couleur }]}>{s.numero}</Text>
              </View>

              {/* Infos */}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardNom, { color: T.text }]} numberOfLines={1}>{s.nom}</Text>
                  <Text style={styles.cardArabe}>{s.arabe}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <EtatBadge etat={s.etat} />
                  <Text style={styles.cardRevision}>
                    <Feather name="clock" size={11} color="#8A8F99" /> {s.prochaineRevision}
                  </Text>
                </View>
                <Text style={styles.cardVersets}>{s.versets} versets</Text>
              </View>

              {/* Score ring */}
              <View style={styles.cardRight}>
                <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                  <ScoreRing score={s.score} color={s.couleur} trackColor={T.isDark ? '#2E2D3F' : '#E6E8ED'} />
                  <Text style={[styles.scoreText, { color: s.couleur }]}>{s.score}%</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#C9CDD4" style={{ marginTop: 4 }} />
              </View>
            </Pressable>
          ))}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingTop: 16, paddingBottom: 28, paddingHorizontal: 24 },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 30, color: '#fff' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14,
    padding: 12, alignItems: 'center', gap: 4,
  },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff' },
  statLbl: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  body: { padding: 18 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, paddingHorizontal: 14, height: 50,
    marginTop: 4, marginBottom: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  searchInput: {
    flex: 1, fontFamily: 'Nunito_600SemiBold', fontSize: 15,
    padding: 0,
  },
  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  emptySub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, marginTop: 6, marginBottom: 10 },
  urgentPill: { backgroundColor: '#FF4B4B', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  urgentPillText: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: '#fff' },
  urgentBanner: {
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 24,
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
  },
  urgentIcon: { fontSize: 30 },
  urgentBannerTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  urgentBannerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#8A8F99', marginTop: 2 },
  urgentBtn: {
    backgroundColor: '#6B4DFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 3, borderBottomColor: '#4A30CC',
  },
  urgentBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },
  card: {
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  numBox: {
    width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },
  cardBody: { flex: 1, gap: 4 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardNom: { fontFamily: 'Nunito_800ExtraBold', fontSize: 16, flexShrink: 1 },
  cardArabe: { fontFamily: 'Nunito_700Bold', fontSize: 18, color: '#6B4DFF' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  etatBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  etatText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  cardRevision: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: '#8A8F99' },
  cardVersets: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: '#B0B5BE' },
  cardRight: { alignItems: 'center', gap: 2 },
  scoreText: {
    position: 'absolute', fontFamily: 'Baloo2_800ExtraBold', fontSize: 11,
  },
});
