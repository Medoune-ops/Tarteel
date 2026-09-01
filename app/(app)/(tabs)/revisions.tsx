import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { useState, useMemo, useCallback, useEffect } from 'react';
import DeviceStatusBar from '../../../components/StatusBar';
import { useTheme } from '../../../utils/useTheme';
import { useScrollToTopOnTabPress } from '../../../utils/useScrollToTopOnTabPress';
import {
  fetchRevisions, fetchSourates, fetchLettreRevisions, fetchSections, fetchGuidedRevision,
  type SourateRevisionView, type SourateListItem, type LettreRevisionView, type GuidedRevisionView,
} from '../../../lib/api';
import { swrFetch } from '../../../lib/api/swr';
import { useUserStore } from '../../../store/userStore';
import type { ParcoursSection } from '../../../constants/parcours';
import { useT, t } from '../../../lib/i18n';
import OfflineState from '../../../components/OfflineState';

// Couleurs par état SRS (maitrise/revoir/difficile) — même palette que le mock d'origine.
const ETAT_COLORS: Record<SourateRevisionView['etat'], { couleur: string; couleurDark: string; bg: string }> = {
  maitrise:  { couleur: '#34C724', couleurDark: '#2A9E1C', bg: '#E8F9E6' },
  revoir:    { couleur: '#6B4DFF', couleurDark: '#5438CC', bg: '#EDE8FF' },
  difficile: { couleur: '#F0820C', couleurDark: '#C06200', bg: '#FFF0E0' },
};
// Sourate trouvée par la recherche mais pas encore apprise : neutre, pas de SRS.
const NON_APPRISE_COLOR = { couleur: '#8A8F99', couleurDark: '#6B7078', bg: '#EDEEF1' };

type Onglet = 'guidee' | 'libre';

/** "Aujourd'hui" / "Dans N jours" à partir d'une date ISO (ou null = jamais révisé → due maintenant). */
function formatProchaineRevision(iso: string | null): string {
  if (!iso) return t('revisions.dueToday');
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return t('revisions.dueToday');
  if (days === 1) return t('revisions.dueInOneDay');
  return t('revisions.dueInDays', { n: days });
}

/**
 * Détermine la sourate à proposer en révision GUIDÉE : la plus RÉCEMMENT
 * COMMENCÉE (au moins une leçon `completed`), pas la prochaine à découvrir.
 * La révision guidée rejoue l'ordre réel d'apprentissage déjà entamé — la
 * proposer sur une sourate encore `active` (jamais commencée, y compris une
 * sourate sautée d'un coup à l'onboarding via une déclaration "déjà
 * maîtrisée") fait échouer GET .../guided avec 403 "Sourate not yet learned"
 * côté serveur (countLearnedChainLessons vaut 0 tant qu'aucune leçon de
 * cette sourate n'est complétée).
 *
 * Utilise `node.sourateNumero` (la sourate RÉELLEMENT enseignée par cette
 * leçon précise) — PAS l'index du nœud dans `section.sourates` : cette
 * hypothèse "1 nœud = 1 sourate" est fausse dès qu'une section regroupe
 * plusieurs sourates sur des nombres de leçons différents (ex: Al-Baqarah
 * ~150 leçons + Al-Fatiha 4 leçons dans la même section hizb), ce qui
 * faisait planter cette fonction en pratique (retournait null en boucle).
 * On parcourt les sections de la plus avancée à la moins avancée, et dans
 * chacune, le dernier nœud `completed` ayant une sourate associée.
 */
function findSourateEnCours(sections: ParcoursSection[]): number | null {
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]!;
    for (let idx = section.nodes.length - 1; idx >= 0; idx--) {
      const node = section.nodes[idx]!;
      if (node.state !== 'completed') continue;
      if (node.sourateNumero != null) return node.sourateNumero;
    }
  }
  return null;
}

/** Fusion sourate (toujours présente) + état SRS (seulement si apprise). */
interface SourateRow {
  numero: number;
  nom: string;
  nomArabe: string;
  nombreVersets: number;
  /** Position d'enseignement (0-based) — null si pas encore enseignée. */
  ordreParcours: number | null;
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
  const tr = useT();
  const map: Record<string, { label: string; color: string; bg: string }> = {
    maitrise: { label: tr('revisions.etat.maitrise'), color: '#2A9E1C', bg: '#DEF5E5' },
    revoir:   { label: tr('revisions.etat.revoir'), color: '#6B4DFF', bg: '#EDE8FF' },
    difficile:{ label: tr('revisions.etat.difficile'), color: '#F0820C', bg: '#FFF0E0' },
  };
  const s = etat ? map[etat] : { label: tr('revisions.etat.nonApprise'), color: '#8A8F99', bg: '#EDEEF1' };
  return (
    <View style={[styles.etatBadge, { backgroundColor: s.bg }]}>
      <Text style={[styles.etatText, { color: s.color }]}>{s.label}</Text>
    </View>
  );
}

/** Sélecteur d'onglets — Guidée mise en avant (plus grande, colorée) vs Libre. */
function TabSwitcher({ onglet, onChange }: { onglet: Onglet; onChange: (o: Onglet) => void }) {
  const tr = useT();
  return (
    <View style={styles.tabRow}>
      <Pressable
        style={[styles.tabBtn, styles.tabBtnGuidee, onglet === 'guidee' && styles.tabBtnGuideeActive]}
        onPress={() => onChange('guidee')}
      >
        <Feather name="zap" size={18} color={onglet === 'guidee' ? '#fff' : '#6B4DFF'} />
        <Text style={[styles.tabBtnGuideeText, onglet !== 'guidee' && { color: '#6B4DFF' }]}>
          {tr('revisions.tabGuidee')}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tabBtn, styles.tabBtnLibre, onglet === 'libre' && styles.tabBtnLibreActive]}
        onPress={() => onChange('libre')}
      >
        <Feather name="list" size={16} color={onglet === 'libre' ? '#1B2333' : '#8A8F99'} />
        <Text style={[styles.tabBtnLibreText, onglet === 'libre' && { color: '#1B2333' }]}>
          {tr('revisions.tabLibre')}
        </Text>
      </Pressable>
    </View>
  );
}

/** Aperçu du pas courant de la révision guidée, dans la carte mise en avant. */
function GuidedPreview({ guided }: { guided: GuidedRevisionView }) {
  const tr = useT();
  if (guided.terminee || !guided.step) {
    return (
      <View style={styles.guidedStepRow}>
        <Text style={styles.guidedStepEmoji}>🏆</Text>
        <Text style={styles.guidedStepText}>{tr('revisions.guidedDone', { nom: guided.nom })}</Text>
      </View>
    );
  }
  const { nouveauxVersets } = guided.step;
  return (
    <View style={styles.guidedStepRow}>
      <Feather name="mic" size={18} color="#fff" />
      <Text style={styles.guidedStepText}>
        {tr('revisions.guidedStepPreview', { debut: nouveauxVersets.debut, fin: nouveauxVersets.fin })}
      </Text>
    </View>
  );
}

/**
 * Onglet "Révision guidée" — chaînage progressif sur la sourate en cours
 * d'apprentissage, PLUS les leçons alphabet/harakat dues (SRS `LettreRevision`
 * existant, sans chaînage : l'alphabet/harakat n'est pas concerné par le
 * chaînage verset par verset, seulement mis en avant ici au même titre que
 * la sourate en cours).
 */
function OngletGuidee({
  T, tr, lettres,
}: {
  T: ReturnType<typeof useTheme>; tr: ReturnType<typeof useT>; lettres: LettreRevisionView[];
}) {
  const router = useRouter();
  const [numero, setNumero] = useState<number | null | undefined>(undefined); // undefined = pas encore su
  const [guided, setGuided] = useState<GuidedRevisionView | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const lang = useUserStore.getState().language;
      const sections = await swrFetch(`sections:${lang}`, () => fetchSections(lang));
      const current = findSourateEnCours(sections);
      setNumero(current);
      if (current != null) {
        setGuided(await fetchGuidedRevision(current));
      }
    } catch (e) {
      setLoadError(e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Bloc encadré dans l'écran : les onglets restent accessibles, donc pas de
  // raccourcis hors-ligne ici (contrairement aux écrans en cul-de-sac).
  if (loadError) {
    return (
      <View style={styles.guidedErrorBox}>
        <OfflineState error={loadError} onRetry={load} />
      </View>
    );
  }

  if (numero === undefined) {
    return (
      <View style={styles.guidedErrorBox}>
        <ActivityIndicator size="large" color="#6B4DFF" />
      </View>
    );
  }

  // Lettres/harakat DUES (échéance passée) — pas de chaînage ici, juste le
  // SRS LettreRevision existant mis en avant au même titre que la sourate.
  const lettresDues = lettres.filter(
    (l) => !l.prochaineRevision || new Date(l.prochaineRevision).getTime() <= Date.now(),
  );

  const lettresSection = lettresDues.length > 0 && (
    <View style={{ gap: 10, marginTop: 18 }}>
      <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('revisions.alphabetTitle')}</Text>
      {lettresDues.map((l) => {
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
    </View>
  );

  // Aucune sourate en cours de chaînage (ex: encore dans l'alphabet) — les
  // lettres/harakat dues restent affichées si elles existent.
  if (numero == null || !guided) {
    return (
      <View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={[styles.emptyTitle, { color: T.text }]}>{tr('revisions.guidedNoneTitle')}</Text>
          <Text style={styles.emptySub}>{tr('revisions.guidedNoneSub')}</Text>
        </View>
        {lettresSection}
      </View>
    );
  }

  return (
    <View>
      <Pressable
        style={styles.guidedCard}
        onPress={() => router.push({ pathname: '/(app)/revision/guided', params: { numero: guided.numero } })}
      >
        <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.guidedGrad}>
          <View style={styles.guidedHeaderRow}>
            <View style={styles.guidedBadgePill}>
              <Feather name="link" size={12} color="#fff" />
              <Text style={styles.guidedBadgePillText}>{tr('revisions.guidedBadge')}</Text>
            </View>
          </View>
          <Text style={styles.guidedNom}>{guided.nom} · {guided.nomArabe}</Text>
          <Text style={styles.guidedProgress}>
            {tr('guided.progress', { done: guided.lessonsConsolidees, total: guided.lessonsTotal })}
          </Text>
          <View style={styles.guidedProgWrap}>
            <View style={[styles.guidedProgBar, {
              width: `${guided.lessonsTotal > 0 ? Math.round((guided.lessonsConsolidees / guided.lessonsTotal) * 100) : 0}%`,
            }]} />
          </View>
          <GuidedPreview guided={guided} />
          <View style={styles.guidedCta}>
            <Text style={styles.guidedCtaText}>
              {guided.terminee ? tr('revisions.guidedRestart') : tr('revisions.start')}
            </Text>
            <Feather name="arrow-right" size={16} color="#6B4DFF" />
          </View>
        </LinearGradient>
      </Pressable>
      {lettresSection}
    </View>
  );
}

export default function RevisionsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const scrollRef = useScrollToTopOnTabPress();
  const [onglet, setOnglet] = useState<Onglet>('guidee');
  const [query, setQuery] = useState('');
  const [toutes, setToutes] = useState<SourateListItem[] | null>(null);
  const [revisions, setRevisions] = useState<SourateRevisionView[] | null>(null);
  const [lettres, setLettres] = useState<LettreRevisionView[] | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [s, r, l] = await Promise.all([fetchSourates(), fetchRevisions(), fetchLettreRevisions()]);
      setToutes(s);
      setRevisions(r);
      setLettres(l);
    } catch (e) {
      setLoadError(e);
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
        ordreParcours: s.ordreParcours,
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
    { label: tr('revisions.statSourates'), value: String(stats.total), icon: 'book-open' as const, color: '#6B4DFF' },
    { label: tr('revisions.statMaitrisees'), value: String(stats.maitrisees), icon: 'award' as const, color: '#34C724' },
    { label: tr('revisions.statARevoir'), value: String(stats.aRevoir), icon: 'alert-circle' as const, color: '#F0820C' },
  ];

  const urgentes = (revisions ?? []).filter((s) => formatProchaineRevision(s.prochaineRevision) === "Aujourd'hui");

  // Recherche sur TOUTES les sourates ; hors recherche, les sourates apprises
  // passent en premier (priorité de révision), dans l'ordre de mémorisation du
  // parcours : Al-Fatiha, puis An-Nas (114), Al-Falaq (113)… en remontant
  // depuis la fin du Coran — PAS l'ordre du Mushaf.
  const ordreMemorisation = (numero: number) => (numero === 1 ? 0 : 115 - numero);
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
      return ordreMemorisation(a.numero) - ordreMemorisation(b.numero);
    });
  }, [query, sourates]);

  const enRecherche = query.trim().length > 0;

  if (loadError) {
    return (
      <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
        <DeviceStatusBar />
        <OfflineState error={loadError} onRetry={load} showOfflineExits />
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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <LinearGradient colors={['#7C5CFF', '#6B4DFF']} style={styles.header}>
          <Text style={styles.headerTitle}>{tr('revisions.headerTitle')}</Text>
          <Text style={styles.headerSub}>{tr('revisions.headerSub')}</Text>
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

          <TabSwitcher onglet={onglet} onChange={setOnglet} />

          {onglet === 'guidee' ? (
            <OngletGuidee T={T} tr={tr} lettres={lettres} />
          ) : (
            <>
              {/* Barre de recherche */}
              <View style={[styles.searchBar, { backgroundColor: T.cardBg }]}>
                <Feather name="search" size={18} color="#A0A5AE" />
                <TextInput
                  style={[styles.searchInput, { color: T.text }]}
                  placeholder={tr('revisions.searchPlaceholder')}
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
                    <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('revisions.todayTitle')}</Text>
                    <View style={styles.urgentPill}>
                      <Text style={styles.urgentPillText}>
                        {tr(urgentes.length > 1 ? 'revisions.todayPillMany' : 'revisions.todayPillOne', { n: urgentes.length })}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.urgentBanner, { backgroundColor: T.cardBg }]}>
                    <Text style={styles.urgentIcon}>🔔</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.urgentBannerTitle, { color: T.text }]}>{tr('revisions.todayBannerTitle')}</Text>
                      <Text style={styles.urgentBannerSub}>
                        {tr('revisions.todayBannerSub', { noms: urgentes.map(s => s.nom).join(' · ') })}
                      </Text>
                    </View>
                    <Pressable
                      style={styles.urgentBtn}
                      onPress={() => router.push({
                        pathname: '/(app)/revision/flashcard',
                        params: { numero: urgentes[0].numero, apprise: '1' },
                      })}
                    >
                      <Text style={styles.urgentBtnText}>{tr('revisions.start')}</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* Alphabet & Harakat */}
              {!enRecherche && (
                <>
                  <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('revisions.alphabetTitle')}</Text>
                  {lettres.length === 0 && (
                    <Text style={[styles.emptySub, { textAlign: 'left', paddingHorizontal: 2, marginBottom: 16 }]}>
                      {tr('revisions.alphabetEmpty')}
                    </Text>
                  )}
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
                {enRecherche ? tr('revisions.searchResults', { n: resultats.length }) : tr('revisions.mySourates')}
              </Text>

              {resultats.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={[styles.emptyTitle, { color: T.text }]}>{tr('revisions.noneFound')}</Text>
                  <Text style={styles.emptySub}>{tr('revisions.tryAnother')}</Text>
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
                    <Text style={styles.cardVersets}>
                      {tr('revisions.versets', { n: s.nombreVersets })}
                      {s.revision && s.revision.segmentsTotal > 1
                        ? ` · ${tr('revisions.segmentsBadge', { due: s.revision.segmentsDue, total: s.revision.segmentsTotal })}`
                        : ''}
                    </Text>
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
            </>
          )}

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

  // Sélecteur d'onglets — Guidée mise en avant (plus grande, colorée pleine).
  tabRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  tabBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 16, paddingVertical: 14,
  },
  tabBtnGuidee: {
    flex: 1.3, backgroundColor: '#EDE8FF', borderWidth: 2, borderColor: '#6B4DFF',
  },
  tabBtnGuideeActive: {
    backgroundColor: '#6B4DFF',
    shadowColor: '#6B4DFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  tabBtnGuideeText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#fff' },
  tabBtnLibre: { flex: 1, backgroundColor: '#EDEEF1' },
  tabBtnLibreActive: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#E2E4EA' },
  tabBtnLibreText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#8A8F99' },

  // Onglet guidée — carte mise en avant.
  guidedCard: { borderRadius: 22, overflow: 'hidden', marginBottom: 8 },
  guidedGrad: { padding: 20 },
  guidedHeaderRow: { flexDirection: 'row', marginBottom: 10 },
  guidedBadgePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  guidedBadgePillText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: '#fff' },
  guidedNom: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, color: '#fff', marginBottom: 4 },
  guidedProgress: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  guidedProgWrap: { height: 8, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 4, overflow: 'hidden', marginBottom: 14 },
  guidedProgBar: { height: 8, backgroundColor: '#fff', borderRadius: 4 },
  guidedStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 12, marginBottom: 14,
  },
  guidedStepEmoji: { fontSize: 18 },
  guidedStepText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#fff', flex: 1 },
  guidedCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 13,
  },
  guidedCtaText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#6B4DFF' },
  guidedErrorBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },

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
  emptySub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: '#8A8F99', textAlign: 'center' },
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
