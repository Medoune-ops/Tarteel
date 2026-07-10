import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useState, useMemo, useCallback, useEffect } from 'react';
import DeviceStatusBar from '../../../components/StatusBar';
import { useTheme } from '../../../utils/useTheme';
import {
  fetchRevisions, fetchSourates, fetchLettreRevisions,
  type SourateRevisionView, type SourateListItem, type LettreRevisionView,
} from '../../../lib/api';

// Couleurs par état SRS (maitrise/revoir/difficile) — même palette que le mock d'origine.
const ETAT_COLORS: Record<SourateRevisionView['etat'], { couleur: string; couleurDark: string; bg: string }> = {
  maitrise:  { couleur: '#34C724', couleurDark: '#2A9E1C', bg: '#E8F9E6' },
  revoir:    { couleur: '#6B4DFF', couleurDark: '#5438CC', bg: '#EDE8FF' },
  difficile: { couleur: '#F0820C', couleurDark: '#C06200', bg: '#FFF0E0' },
};
// Sourate trouvée par la recherche mais pas encore apprise : neutre, pas de SRS.
const NON_APPRISE_COLOR = { couleur: '#8A8F99', couleurDark: '#6B7078', bg: '#EDEEF1' };

/** "Aujourd'hui" / "Dans N jours" / "En retard" à partir d'une date ISO (ou null = jamais révisé → due maintenant). */
function formatProchaineRevision(iso: string | null): string {
  if (!iso) return "Aujourd'hui";
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Dans 1 jour';
  return `Dans ${days} jours`;
}

/** Fusion sourate (toujours présente) + état SRS (seulement si apprise). */
interface SourateRow {
  numero: number;
  nom: string;
  nomArabe: string;
  nombreVersets: number;
  apprise: boolean;
  revision: SourateRevisionView | null;
}

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

function EtatBadge({ etat }: { etat: string | null }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    maitrise: { label: '✓ Maîtrisé', color: '#2A9E1C', bg: '#DEF5E5' },
    revoir:   { label: '↺ À revoir', color: '#6B4DFF', bg: '#EDE8FF' },
    difficile:{ label: '⚡ Difficile', color: '#F0820C', bg: '#FFF0E0' },
  };
  const s = etat ? map[etat] : { label: 'Non apprise', color: '#8A8F99', bg: '#EDEEF1' };
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
  const [toutes, setToutes] = useState<SourateListItem[] | null>(null);
  const [revisions, setRevisions] = useState<SourateRevisionView[] | null>(null);
  const [lettres, setLettres] = useState<LettreRevisionView[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      const [s, r, l] = await Promise.all([fetchSourates(), fetchRevisions(), fetchLettreRevisions()]);
      setToutes(s);
      setRevisions(r);
      setLettres(l);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Fusionne LES 114 sourates avec l'état SRS des sourates apprises. Les
  // sourates non apprises restent trouvables (recherche) mais sans planning
  // de révision — l'utilisateur peut s'y entraîner, sans suivi SRS tant
  // qu'elles ne sont pas apprises dans le parcours.
  const sourates = useMemo<SourateRow[] | null>(() => {
    if (!toutes || !revisions) return null;
    const byNumero = new Map(revisions.map((r) => [r.numero, r]));
    return toutes.map((s) => {
      const revision = byNumero.get(s.numero) ?? null;
      return {
        numero: s.numero,
        nom: s.nom,
        nomArabe: s.nomArabe,
        nombreVersets: s.nombreVersets,
        apprise: revision !== null,
        revision,
      };
    });
  }, [toutes, revisions]);

  const stats = useMemo(() => {
    const learned = revisions ?? [];
    return {
      total: learned.length,
      maitrisees: learned.filter((s) => s.etat === 'maitrise').length,
      aRevoir: learned.filter((s) => s.etat !== 'maitrise').length,
    };
  }, [revisions]);
  const STATS = [
    { label: 'Sourates', value: String(stats.total), icon: 'book-open' as const, color: '#6B4DFF' },
    { label: 'Maîtrisées', value: String(stats.maitrisees), icon: 'award' as const, color: '#34C724' },
    { label: 'À revoir', value: String(stats.aRevoir), icon: 'alert-circle' as const, color: '#F0820C' },
  ];

  const urgentes = (revisions ?? []).filter((s) => formatProchaineRevision(s.prochaineRevision) === "Aujourd'hui");

  // Recherche sur TOUTES les sourates ; hors recherche, les sourates apprises
  // passent en premier (priorité de révision) — le reste garde l'ordre du Mushaf.
  const resultats = useMemo(() => {
    const all = sourates ?? [];
    const q = query.trim().toLowerCase();
    const filtered = !q ? all : all.filter(s =>
      s.nom.toLowerCase().includes(q) ||
      s.nomArabe.includes(query.trim()) ||
      String(s.numero).includes(q)
    );
    if (q) return filtered;
    return [...filtered].sort((a, b) => {
      if (a.apprise !== b.apprise) return a.apprise ? -1 : 1;
      return a.numero - b.numero;
    });
  }, [query, sourates]);

  const enRecherche = query.trim().length > 0;

  if (loadError) {
    return (
      <View style={[styles.screen, styles.centerState, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <Feather name="wifi-off" size={34} color="#9AA0AA" />
        <Text style={[styles.stateText, { color: T.text }]}>Impossible de charger tes révisions.</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryLabel}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
  if (!sourates || !lettres) {
    return (
      <View style={[styles.screen, styles.centerState, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <ActivityIndicator size="large" color="#6B4DFF" />
      </View>
    );
  }

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
                    params: { numero: urgentes[0].numero, apprise: '1' },
                  })}
                >
                  <Text style={styles.urgentBtnText}>Commencer</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Alphabet & Harakat */}
          {!enRecherche && lettres.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: T.text }]}>Alphabet & Harakat</Text>
              {lettres.map((l) => {
                const c = ETAT_COLORS[l.etat];
                return (
                  <Pressable
                    key={l.lessonId}
                    style={[styles.card, { backgroundColor: T.cardBg }]}
                    onPress={() => router.push({
                      pathname: '/(app)/revision/lettre',
                      params: { lessonId: l.lessonId, titre: l.titre },
                    })}
                  >
                    <View style={[styles.numBox, { backgroundColor: c.bg, borderColor: c.couleur }]}>
                      <Feather name="type" size={20} color={c.couleur} />
                    </View>
                    <View style={styles.cardBody}>
                      <View style={styles.cardTop}>
                        <Text style={[styles.cardNom, { color: T.text }]} numberOfLines={1}>{l.titre}</Text>
                      </View>
                      <View style={styles.cardMeta}>
                        <EtatBadge etat={l.etat} />
                        <Text style={styles.cardRevision}>
                          <Feather name="clock" size={11} color="#8A8F99" /> {formatProchaineRevision(l.prochaineRevision)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.cardRight}>
                      <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                        <ScoreRing score={l.score} color={c.couleur} trackColor={T.isDark ? '#2E2D3F' : '#E6E8ED'} />
                        <Text style={[styles.scoreText, { color: c.couleur }]}>{l.score}%</Text>
                      </View>
                      <Feather name="chevron-right" size={18} color="#C9CDD4" style={{ marginTop: 4 }} />
                    </View>
                  </Pressable>
                );
              })}
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
          ) : resultats.map((s) => {
            const c = s.revision ? ETAT_COLORS[s.revision.etat] : NON_APPRISE_COLOR;
            return (
            <Pressable
              key={s.numero}
              style={[styles.card, { backgroundColor: T.cardBg }, !s.apprise && styles.cardNonApprise]}
              onPress={() => router.push({
                pathname: '/(app)/revision/flashcard',
                params: { numero: s.numero, apprise: s.apprise ? '1' : '0' },
              })}
            >
              {/* Numéro */}
              <View style={[styles.numBox, { backgroundColor: c.bg, borderColor: c.couleur }]}>
                <Text style={[styles.numText, { color: c.couleur }]}>{s.numero}</Text>
              </View>

              {/* Infos */}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={[styles.cardNom, { color: T.text }]} numberOfLines={1}>{s.nom}</Text>
                  <Text style={styles.cardArabe}>{s.nomArabe}</Text>
                </View>
                <View style={styles.cardMeta}>
                  <EtatBadge etat={s.revision?.etat ?? null} />
                  {s.revision && (
                    <Text style={styles.cardRevision}>
                      <Feather name="clock" size={11} color="#8A8F99" /> {formatProchaineRevision(s.revision.prochaineRevision)}
                    </Text>
                  )}
                </View>
                <Text style={styles.cardVersets}>{s.nombreVersets} versets</Text>
              </View>

              {/* Score ring — seulement pour une sourate apprise (suivie en SRS) */}
              <View style={styles.cardRight}>
                {s.revision ? (
                  <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
                    <ScoreRing score={s.revision.score} color={c.couleur} trackColor={T.isDark ? '#2E2D3F' : '#E6E8ED'} />
                    <Text style={[styles.scoreText, { color: c.couleur }]}>{s.revision.score}%</Text>
                  </View>
                ) : (
                  <Feather name="headphones" size={22} color="#C9CDD4" />
                )}
                <Feather name="chevron-right" size={18} color="#C9CDD4" style={{ marginTop: 4 }} />
              </View>
            </Pressable>
            );
          })}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  stateText: { fontFamily: 'Nunito_700Bold', fontSize: 16, textAlign: 'center' },
  retryBtn: { marginTop: 6, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, backgroundColor: '#6B4DFF' },
  retryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
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
  // Sourate pas encore apprise : moins d'emphase visuelle que les apprises,
  // qui restent la priorité de révision.
  cardNonApprise: { opacity: 0.72, shadowOpacity: 0 },
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
