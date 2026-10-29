import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

type Theme = ReturnType<typeof useTheme>;
type Tr = ReturnType<typeof useT>;

// Couleurs par état SRS (maitrise/revoir/difficile) — même palette que le mock d'origine.
const ETAT_COLORS: Record<SourateRevisionView['etat'], { couleur: string; couleurDark: string; bg: string }> = {
  maitrise:  { couleur: '#34C724', couleurDark: '#2A9E1C', bg: '#E8F9E6' },
  revoir:    { couleur: '#6B4DFF', couleurDark: '#5438CC', bg: '#EDE8FF' },
  difficile: { couleur: '#F0820C', couleurDark: '#C06200', bg: '#FFF0E0' },
};
// Sourate trouvée par la recherche mais pas encore apprise : neutre, pas de SRS.
const NON_APPRISE_COLOR = { couleur: '#8A8F99', couleurDark: '#6B7078', bg: '#EDEEF1' };

type Onglet = 'guidee' | 'libre' | 'reconstituer';

/** Échéance passée (ou jamais révisé) → à réviser aujourd'hui. */
function isDue(iso: string | null): boolean {
  return !iso || new Date(iso).getTime() <= Date.now();
}

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

/** Anneau de l'en-tête : part des sourates apprises qui sont à jour. */
function HeroRing({ done, total, label }: { done: number; total: number; label: string }) {
  const size = 74;
  const r = 33;
  const circ = 2 * Math.PI * r;
  const frac = total > 0 ? done / total : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={37} cy={37} r={r} stroke="rgba(255,255,255,0.2)" strokeWidth={7} fill="none" />
        {frac > 0 && (
          <Circle
            cx={37} cy={37} r={r} stroke="#fff" strokeWidth={7} fill="none"
            strokeDasharray={`${frac * circ} ${circ}`} transform="rotate(-90 37 37)"
          />
        )}
      </Svg>
      <Text style={styles.ringVal}>{done}/{total}</Text>
      <Text style={styles.ringLbl}>{label}</Text>
    </View>
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

/** Contrôle segmenté Guidée / Libre / Construction. */
function TabSwitcher({ onglet, onChange, T }: { onglet: Onglet; onChange: (o: Onglet) => void; T: Theme }) {
  const tr = useT();
  const items: { key: Onglet; icon: 'zap' | 'repeat' | 'type'; label: string }[] = [
    { key: 'guidee', icon: 'zap', label: tr('revisions.segGuidee') },
    { key: 'libre', icon: 'repeat', label: tr('revisions.segLibre') },
    { key: 'reconstituer', icon: 'type', label: tr('revisions.segConstruction') },
  ];
  return (
    <View style={[styles.seg, { backgroundColor: T.selectorBg }]}>
      {items.map((it) => {
        const on = onglet === it.key;
        return (
          <Pressable
            key={it.key}
            style={[styles.segItem, on && [styles.segItemOn, { backgroundColor: T.cardBg }]]}
            onPress={() => onChange(it.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Feather name={it.icon} size={15} color={on ? '#6B4DFF' : T.textSecondary} />
            <Text
              style={[styles.segText, { color: on ? '#6B4DFF' : T.textSecondary }, on && { fontFamily: 'Nunito_900Black' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {it.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Ligne alphabet/harakat : glyphe teinté, titre, échéance en pastille. */
function LettreRow({ l, T }: { l: LettreRevisionView; T: Theme }) {
  const router = useRouter();
  const harakat = /haraka|fatha|kasra|damma|soukoun|sukun|tanwin|chadda|shadda/i.test(l.titre);
  const due = isDue(l.prochaineRevision);
  // Échue → orange (à faire), sinon bleu (plus tard).
  const c = due ? '#E0700A' : '#1E8FD0';
  const bg = due
    ? (T.isDark ? 'rgba(240,130,12,0.18)' : '#FFF1E0')
    : (T.isDark ? 'rgba(59,180,242,0.16)' : '#E6F5FD');
  return (
    <Pressable
      style={({ pressed }) => [styles.row, { backgroundColor: T.cardBg, borderColor: T.border }, pressed && { opacity: 0.85 }]}
      onPress={() => router.push({
        pathname: '/(app)/revision/lettre',
        params: { lessonId: l.lessonId, titre: l.titre },
      })}
    >
      <View style={[styles.glyphBox, { backgroundColor: bg }]}>
        <Text style={[styles.glyph, { color: c }]}>{harakat ? 'بَ بِ بُ' : 'ا ب ت'}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.rowTitle, { color: T.text }]} numberOfLines={1}>{l.titre}</Text>
        <Text style={[styles.rowSub, { color: T.textSecondary }]} numberOfLines={1}>
          {t(`revisions.etat.${l.etat}`)} · {l.score} %
        </Text>
      </View>
      <View style={[styles.tag, { backgroundColor: bg }]}>
        <Text style={[styles.tagText, { color: c }]}>{formatProchaineRevision(l.prochaineRevision)}</Text>
      </View>
    </Pressable>
  );
}

/**
 * Onglet « Construction » : présente l'exercice et le lance. Les mots et
 * versets sont tirés d'une sourate apprise (voir revision/reconstituer.tsx).
 */
function OngletReconstituer({ T, tr }: { T: Theme; tr: Tr }) {
  const router = useRouter();
  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.mainCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
        <View style={[styles.mainTag, { backgroundColor: T.isDark ? 'rgba(240,130,12,0.18)' : '#FFF1E0', alignSelf: 'flex-start' }]}>
          <Feather name="grid" size={12} color="#E0700A" />
          <Text style={[styles.mainTagText, { color: '#E0700A' }]}>{tr('revisions.reconstituerBadge').toUpperCase()}</Text>
        </View>
        <Text style={[styles.mainTitle, { color: T.text, marginTop: 12 }]}>{tr('revisions.reconstituerTitle')}</Text>
        <Text style={[styles.mainMeta, { color: T.textSecondary }]}>{tr('revisions.reconstituerSub')}</Text>
        <View style={[styles.reconDemo, { backgroundColor: T.inputBg }]}>
          <Text style={[styles.reconDemoModel, { color: '#F0720F' }]}>بِسْمِ</Text>
          <Feather name="arrow-left" size={18} color={T.textSecondary} />
          <View style={styles.reconDemoTiles}>
            {['ب', 'ـِ', 'س', 'ـْ', 'م', 'ـِ'].map((g, i) => (
              <View key={i} style={[styles.reconDemoTile, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                <Text style={styles.reconDemoTileTxt}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
        <StepButton color="#F0820C" shadow="#C2520A" label={tr('revisions.start')} onPress={() => router.push('/(app)/revision/reconstituer')} />
      </View>
      <Text style={[styles.hint, { color: T.textSecondary }]}>{tr('revisions.reconstituerHint')}</Text>
    </View>
  );
}

/** Bouton plein avec ombre « marche » (bord inférieur plus foncé). */
function StepButton({ color, shadow, label, onPress }: { color: string; shadow: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.stepBtnWrap, { backgroundColor: shadow }, pressed && { paddingBottom: 2, marginTop: 17 }]}>
      <View style={[styles.stepBtn, { backgroundColor: color }]}>
        <Text style={styles.stepBtnText}>{label}</Text>
      </View>
    </Pressable>
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
  T, tr, lettres, onSeeAll,
}: {
  T: Theme; tr: Tr; lettres: LettreRevisionView[]; onSeeAll: () => void;
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
  const lettresDues = lettres.filter((l) => isDue(l.prochaineRevision));

  const lettresSection = lettresDues.length > 0 && (
    <View style={{ gap: 10, marginTop: 4 }}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('revisions.alphabetHeading')}</Text>
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>{tr('revisions.seeAll')}</Text>
        </Pressable>
      </View>
      {lettresDues.map((l) => <LettreRow key={l.lessonId} l={l} T={T} />)}
    </View>
  );

  // Aucune sourate en cours de chaînage (ex: encore dans l'alphabet) — les
  // lettres/harakat dues restent affichées si elles existent.
  if (numero == null || !guided) {
    return (
      <View style={{ gap: 14 }}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📚</Text>
          <Text style={[styles.emptyTitle, { color: T.text }]}>{tr('revisions.guidedNoneTitle')}</Text>
          <Text style={[styles.emptySub, { color: T.textSecondary }]}>{tr('revisions.guidedNoneSub')}</Text>
        </View>
        {lettresSection}
      </View>
    );
  }

  const total = guided.lessonsTotal;
  const done = guided.lessonsConsolidees;
  const step = !guided.terminee ? guided.step : null;
  const versets = step?.nouveauxVersets;
  const open = () => router.push({ pathname: '/(app)/revision/guided', params: { numero: guided.numero } });

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.mainCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
        <View style={[styles.mainTag, { backgroundColor: T.isDark ? 'rgba(107,77,255,0.2)' : '#EFEBFF', alignSelf: 'flex-start' }]}>
          <Feather name="repeat" size={12} color="#6B4DFF" />
          <Text style={styles.mainTagText}>{tr('revisions.guidedTag')}</Text>
        </View>

        <View style={styles.mainHead}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.mainTitle, { color: T.text }]} numberOfLines={1}>{guided.nom}</Text>
            <Text style={[styles.mainMeta, { color: T.textSecondary }]}>
              {tr('revisions.guidedMeta', { n: guided.numero, total })}
            </Text>
          </View>
          <Text style={styles.mainArabic}>{guided.nomArabe}</Text>
        </View>

        {/* Un segment par étape tant que ça reste lisible, sinon une barre continue. */}
        {total > 0 && total <= 12 ? (
          <View style={styles.segBar}>
            {Array.from({ length: total }, (_, i) => (
              <View key={i} style={[styles.segBarItem, { backgroundColor: i < done ? '#6B4DFF' : T.selectorBg }]} />
            ))}
          </View>
        ) : (
          <View style={[styles.contBar, { backgroundColor: T.selectorBg }]}>
            <View style={[styles.contBarFill, { width: `${total > 0 ? Math.round((done / total) * 100) : 0}%` }]} />
          </View>
        )}
        <Text style={[styles.stepsDone, { color: T.textSecondary }]}>
          {tr('revisions.stepsDone', { done, total })}
        </Text>

        <View style={[styles.nextBox, { backgroundColor: T.inputBg }]}>
          <View style={styles.nextIcon}>
            <Feather name={versets ? 'mic' : 'award'} size={16} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            {versets ? (
              <>
                <Text style={[styles.nextTitle, { color: T.text }]}>
                  {versets.debut === versets.fin
                    ? tr('revisions.nextVerse', { n: versets.debut })
                    : tr('revisions.nextVerses', { debut: versets.debut, fin: versets.fin })}
                </Text>
                <Text style={[styles.nextSub, { color: T.textSecondary }]}>{tr('revisions.reciteHint')}</Text>
              </>
            ) : (
              <Text style={[styles.nextTitle, { color: T.text }]}>{tr('revisions.guidedDone', { nom: guided.nom })}</Text>
            )}
          </View>
        </View>

        <StepButton
          color="#6B4DFF"
          shadow="#4A2FC4"
          label={guided.terminee ? tr('revisions.guidedRestart') : tr('revisions.start')}
          onPress={open}
        />
      </View>
      {lettresSection}
    </View>
  );
}

export default function RevisionsScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
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

  const urgentes = useMemo(() => (revisions ?? []).filter((s) => isDue(s.prochaineRevision)), [revisions]);

  const stats = useMemo(() => {
    const learned = revisions ?? [];
    return {
      total: learned.length,
      maitrisees: learned.filter((s) => s.etat === 'maitrise').length,
      aRevoir: learned.filter((s) => s.etat !== 'maitrise').length,
    };
  }, [revisions]);

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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* En-tête */}
        <LinearGradient
          colors={T.isDark ? ['#6A4FE8', '#4E35C9', '#3A24A0'] : ['#8A6BFF', '#6B4DFF', '#5B3FD6']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 14 }]}
        >
          <View style={styles.glowA} pointerEvents="none" />
          <View style={styles.glowB} pointerEvents="none" />
          <Text style={styles.ghostLetter} pointerEvents="none">ر</Text>

          <View style={styles.headRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.kicker}>{tr('revisions.kicker')}</Text>
              <Text style={styles.headerTitle}>{tr('revisions.title')}</Text>
              <Text style={styles.headerSub}>{tr('revisions.tagline')}</Text>
            </View>
            <HeroRing done={stats.total - urgentes.length} total={stats.total} label={tr('revisions.ringLabel')} />
          </View>

          <View style={styles.statsStrip}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{stats.total}</Text>
              <Text style={styles.statLbl}>{tr('revisions.statSourates')}</Text>
            </View>
            <View style={[styles.stat, styles.statMid]}>
              <Text style={styles.statVal}>{stats.maitrisees}</Text>
              <Text style={styles.statLbl}>{tr('revisions.statMaitrisees')}</Text>
            </View>
            <View style={styles.stat}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.statVal}>{stats.aRevoir}</Text>
                {stats.aRevoir > 0 && <View style={styles.statDot} />}
              </View>
              <Text style={styles.statLbl}>{tr('revisions.statARevoir')}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>

          <TabSwitcher onglet={onglet} onChange={setOnglet} T={T} />

          {onglet === 'guidee' ? (
            <OngletGuidee T={T} tr={tr} lettres={lettres} onSeeAll={() => setOnglet('libre')} />
          ) : onglet === 'reconstituer' ? (
            <OngletReconstituer T={T} tr={tr} />
          ) : (
            <View style={{ gap: 10 }}>
              {/* Barre de recherche */}
              <View style={[styles.searchBar, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                <Feather name="search" size={18} color={T.textSecondary} />
                <TextInput
                  style={[styles.searchInput, { color: T.text }]}
                  placeholder={tr('revisions.searchPlaceholder')}
                  placeholderTextColor={T.textSecondary}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
                {enRecherche && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <Feather name="x-circle" size={18} color={T.textTertiary} />
                  </Pressable>
                )}
              </View>

              {/* Urgentes aujourd'hui */}
              {!enRecherche && urgentes.length > 0 && (
                <View style={[styles.urgentBanner, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                  <View style={[styles.urgentIcon, { backgroundColor: T.isDark ? 'rgba(255,93,115,0.16)' : '#FFE9EC' }]}>
                    <Feather name="bell" size={18} color="#FF5D73" />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.rowTitle, { color: T.text }]}>
                      {tr(urgentes.length > 1 ? 'revisions.todayPillMany' : 'revisions.todayPillOne', { n: urgentes.length })}
                    </Text>
                    <Text style={[styles.rowSub, { color: T.textSecondary }]} numberOfLines={1}>
                      {urgentes.map(s => s.nom).join(' · ')}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.urgentBtn}
                    onPress={() => router.push({
                      pathname: '/(app)/revision/flashcard',
                      params: { numero: urgentes[0]!.numero, apprise: '1' },
                    })}
                  >
                    <Text style={styles.urgentBtnText}>{tr('revisions.start')}</Text>
                  </Pressable>
                </View>
              )}

              {/* Alphabet & Harakat */}
              {!enRecherche && (
                <>
                  <Text style={[styles.sectionTitle, { color: T.text, marginTop: 6 }]}>{tr('revisions.alphabetHeading')}</Text>
                  {lettres.length === 0 && (
                    <Text style={[styles.hint, { color: T.textSecondary, textAlign: 'left' }]}>
                      {tr('revisions.alphabetEmpty')}
                    </Text>
                  )}
                  {lettres.map((l) => <LettreRow key={l.lessonId} l={l} T={T} />)}
                </>
              )}

              {/* Liste toutes sourates */}
              <Text style={[styles.sectionTitle, { color: T.text, marginTop: 6 }]}>
                {enRecherche ? tr('revisions.searchResults', { n: resultats.length }) : tr('revisions.mySourates')}
              </Text>

              {resultats.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>🔍</Text>
                  <Text style={[styles.emptyTitle, { color: T.text }]}>{tr('revisions.noneFound')}</Text>
                  <Text style={[styles.emptySub, { color: T.textSecondary }]}>{tr('revisions.tryAnother')}</Text>
                </View>
              ) : resultats.map((s) => {
                const c = s.revision ? ETAT_COLORS[s.revision.etat] : NON_APPRISE_COLOR;
                return (
                <Pressable
                  key={s.numero}
                  style={({ pressed }) => [
                    styles.row, { backgroundColor: T.cardBg, borderColor: T.border },
                    !s.apprise && styles.rowNonApprise, pressed && { opacity: 0.85 },
                  ]}
                  onPress={() => router.push({
                    pathname: '/(app)/revision/flashcard',
                    params: { numero: s.numero, apprise: s.apprise ? '1' : '0' },
                  })}
                >
                  {/* Numéro */}
                  <View style={[styles.numBox, { backgroundColor: T.isDark ? c.couleur + '2A' : c.bg }]}>
                    <Text style={[styles.numText, { color: c.couleur }]}>{s.numero}</Text>
                  </View>

                  {/* Infos */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardTop}>
                      <Text style={[styles.rowTitle, { color: T.text, flexShrink: 1 }]} numberOfLines={1}>{s.nom}</Text>
                      <Text style={styles.cardArabe}>{s.nomArabe}</Text>
                    </View>
                    <View style={styles.cardMeta}>
                      <EtatBadge etat={s.revision?.etat ?? null} />
                      {s.revision && (
                        <Text style={[styles.cardRevision, { color: T.textSecondary }]}>
                          <Feather name="clock" size={11} color={T.textSecondary} /> {formatProchaineRevision(s.revision.prochaineRevision)}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.cardVersets, { color: T.textTertiary }]}>
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
                        <ScoreRing score={s.revision.score} color={c.couleur} trackColor={T.selectorBg} />
                        <Text style={[styles.scoreText, { color: c.couleur }]}>{s.revision.score}%</Text>
                      </View>
                    ) : (
                      <Feather name="headphones" size={22} color={T.textTertiary} />
                    )}
                  </View>
                </Pressable>
                );
              })}
            </View>
          )}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centerState: { alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },

  // En-tête.
  header: {
    paddingBottom: 20, paddingHorizontal: 20, overflow: 'hidden',
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  glowA: { position: 'absolute', right: -40, top: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(255,255,255,0.08)' },
  glowB: { position: 'absolute', left: -30, bottom: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)' },
  ghostLetter: {
    position: 'absolute', right: 96, bottom: -50, fontFamily: 'ScheherazadeNew_700Bold',
    fontSize: 150, lineHeight: 230, color: 'rgba(255,255,255,0.07)',
  },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kicker: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 1.5, color: 'rgba(255,255,255,0.8)' },
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 32, lineHeight: 38, color: '#fff', marginTop: 2 },
  headerSub: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  ringVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 22, color: '#fff' },
  ringLbl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 9, color: 'rgba(255,255,255,0.8)' },
  statsStrip: {
    flexDirection: 'row', marginTop: 18, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
  },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 28, color: '#fff' },
  statLbl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11, color: 'rgba(255,255,255,0.85)' },
  statDot: {
    // Point de 8 px + halo de 3 px (la bordure se dessine vers l'intérieur).
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF5D73',
    borderWidth: 3, borderColor: 'rgba(255,170,182,0.9)',
  },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  // Contrôle segmenté.
  seg: { flexDirection: 'row', padding: 4, borderRadius: 16 },
  segItem: { flex: 1, height: 40, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  segItemOn: {
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  segText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },

  // Carte principale (guidée / construction).
  mainCard: {
    borderRadius: 24, borderWidth: 1, padding: 16,
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 3,
  },
  mainTag: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 10, borderRadius: 13 },
  mainTagText: { fontFamily: 'Nunito_900Black', fontSize: 11, letterSpacing: 0.4, color: '#6B4DFF' },
  mainHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8, marginTop: 12 },
  mainTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 28 },
  mainMeta: { fontFamily: 'Nunito_700Bold', fontSize: 13, marginTop: 2 },
  mainArabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 30, lineHeight: 46, color: '#6B4DFF' },
  segBar: { flexDirection: 'row', gap: 5, marginTop: 14 },
  segBarItem: { flex: 1, height: 8, borderRadius: 4 },
  contBar: { height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 14 },
  contBarFill: { height: 8, borderRadius: 4, backgroundColor: '#6B4DFF' },
  stepsDone: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, marginTop: 6 },
  nextBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14 },
  nextIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#6B4DFF', alignItems: 'center', justifyContent: 'center' },
  nextTitle: { fontFamily: 'Nunito_900Black', fontSize: 13 },
  nextSub: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  stepBtnWrap: { borderRadius: 16, paddingBottom: 5, marginTop: 14 },
  stepBtn: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, color: '#fff', letterSpacing: 0.3 },
  guidedErrorBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },

  // Construction.
  reconDemo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, borderRadius: 16, padding: 10 },
  reconDemoModel: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 26, lineHeight: 50 },
  reconDemoTiles: { flex: 1, flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 5 },
  reconDemoTile: { width: 30, height: 34, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  reconDemoTileTxt: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 18, lineHeight: 30, color: '#E0700A' },
  hint: { fontFamily: 'Nunito_700Bold', fontSize: 13, textAlign: 'center', paddingHorizontal: 4 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 6 },
  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, paddingHorizontal: 4 },
  seeAll: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#6B4DFF' },

  // Lignes (lettres et sourates).
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1 },
  // Sourate pas encore apprise : moins d'emphase visuelle que les apprises,
  // qui restent la priorité de révision.
  rowNonApprise: { opacity: 0.72 },
  glyphBox: { minWidth: 48, height: 48, paddingHorizontal: 9, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 20, lineHeight: 34 },
  rowTitle: { fontFamily: 'Nunito_900Black', fontSize: 15 },
  rowSub: { fontFamily: 'Nunito_700Bold', fontSize: 12, marginTop: 1 },
  tag: { height: 26, paddingHorizontal: 10, borderRadius: 13, justifyContent: 'center' },
  tagText: { fontFamily: 'Nunito_900Black', fontSize: 12 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, height: 50,
  },
  searchInput: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 15, padding: 0 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 17 },
  emptySub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, textAlign: 'center' },
  urgentBanner: { borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  urgentIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  urgentBtn: { backgroundColor: '#6B4DFF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 3, borderBottomColor: '#4A2FC4' },
  urgentBtnText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: '#fff' },
  numBox: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },
  cardBody: { flex: 1, gap: 4, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardArabe: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 18, lineHeight: 28, color: '#6B4DFF' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  etatBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  etatText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  cardRevision: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  cardVersets: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  cardRight: { alignItems: 'center', gap: 2 },
  scoreText: { position: 'absolute', fontFamily: 'Baloo2_800ExtraBold', fontSize: 11 },
});
