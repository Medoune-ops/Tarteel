import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter, useFocusEffect, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '../../../components/Avatar';
import PrayerCard from '../../../components/PrayerCard';
import { QuranIcon, StarIslamIcon, FlameIcon, TrophyIcon, PuzzleIcon } from '../../../components/IslamicIcons';
import { useUserStore } from '../../../store/userStore';
import { useTheme } from '../../../utils/useTheme';
import { useScrollToTopOnTabPress } from '../../../utils/useScrollToTopOnTabPress';
import { fetchActivity, type LeagueView } from '../../../lib/api';
import { swrFetch, getCached } from '../../../lib/api/swr';
import { useT, t, type I18nKey } from '../../../lib/i18n';

/*
 * Les tuiles portent une icône SVG, pas un emoji : un emoji change d'un
 * téléphone à l'autre et ignore la couleur de la tuile.
 */
type Badge = {
  Icon: (p: { size?: number; color?: string }) => React.ReactElement;
  color: string;
  title: string;
  sub: string;
  route: Href;
  /** Tuile pleine largeur (la dernière de la grille). */
  wide?: boolean;
};

// Libellé du badge d'objectif de série.
function streakGoalLabel(streak: number, goal: number | null): string {
  if (goal == null) return t('profil.badge.streakGoalSet');
  if (streak >= goal) return t('profil.badge.streakGoalReached');
  return t('profil.badge.streakGoalProgress', { streak, goal });
}

function streakLine(n: number): string {
  return t(n > 1 ? 'profil.streakLine' : 'profil.streakLineOne', { n });
}

function buildBadges(streak: number, streakGoal: number | null): Badge[] {
  return [
    { Icon: QuranIcon,     color: '#6B4DFF', title: t('profil.badge.lectureLibre'), sub: t('profil.badgeSub.lecture'), route: '/(app)/lecture-libre' },
    { Icon: FlameIcon,     color: '#F2702A', title: streakGoalLabel(streak, streakGoal), sub: streakLine(streak), route: '/(app)/streak-goal' },
    { Icon: StarIslamIcon, color: '#2FA81F', title: t('profil.badge.asma'), sub: t('profil.badgeSub.asma'), route: '/(app)/asma' },
    { Icon: TrophyIcon,    color: '#E5A400', title: t('profil.badge.podiums'), sub: t('profil.badgeSub.podiums'), route: '/(app)/podiums' },
    { Icon: PuzzleIcon,    color: '#14A3B8', title: t('profil.badge.widgets'), sub: t('profil.badgeSub.widgets'), route: '/(app)/widgets', wide: true },
  ];
}

/** Libellé de ligue traduit à partir du nom backend (français). */
const LEAGUE_NAME_KEYS: Record<string, I18nKey> = {
  bronze: 'ligues.name.bronze', argent: 'ligues.name.argent', or: 'ligues.name.or',
  emeraude: 'ligues.name.emeraude', saphir: 'ligues.name.saphir', rubis: 'ligues.name.rubis',
  diamant: 'ligues.name.diamant',
};
function leagueLabel(nom?: string | null): string | null {
  if (!nom) return null;
  const key = nom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return LEAGUE_NAME_KEYS[key] ? t(LEAGUE_NAME_KEYS[key]!) : nom;
}

/** Barres décoratives de la carte d'écoute (forme d'onde figée). */
const WAVE = Array.from({ length: 40 }, (_, j) =>
  Math.round(6 + 22 * Math.abs(Math.sin(j * 0.9) * Math.cos(j * 0.37))));

export default function ProfilScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const language = useUserStore((s) => s.language);
  const logout = useUserStore((s) => s.logout);
  const name = useUserStore((s) => s.name);
  const username = useUserStore((s) => s.username);
  const streak = useUserStore((s) => s.streak);
  const xp = useUserStore((s) => s.xp);
  const streakGoal = useUserStore((s) => s.streakGoal);
  const sourates = useUserStore((s) => s.sourates);
  const precision = useUserStore((s) => s.precision);
  const avatarStyle = useUserStore((s) => s.avatarStyle);

  // Confirmation brève au retour de « Mon avatar », quand l'avatar vient de changer.
  const [avatarToast, setAvatarToast] = useState(false);
  // Comparaison par contenu : chaque GET /me renvoie un nouvel objet identique.
  const avatarKey = JSON.stringify(avatarStyle);
  const prevAvatar = useRef(avatarKey);
  useEffect(() => {
    if (prevAvatar.current === avatarKey) return;
    prevAvatar.current = avatarKey;
    setAvatarToast(true);
    const id = setTimeout(() => setAvatarToast(false), 2500);
    return () => clearTimeout(id);
  }, [avatarKey]);

  const badges = buildBadges(streak, streakGoal);
  const scrollRef = useScrollToTopOnTabPress();

  // Ligue de la semaine : déjà en cache dès que l'onglet Ligues a été ouvert.
  // On ne déclenche pas d'appel ici, le profil n'en a pas besoin pour s'afficher.
  const [league, setLeague] = useState<LeagueView | undefined>(() => getCached<LeagueView>('league'));
  const leagueName = leagueLabel(league?.league?.nom);

  // ── Vrai calendrier du mois en cours ──
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Décalage pour démarrer la semaine le lundi (getDay(): 0 = dimanche).
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
  const localeTag = language === 'en' ? 'en-US' : language === 'ar' ? 'ar' : 'fr-FR';
  const monthLabel = now.toLocaleDateString(localeTag, { month: 'long', year: 'numeric' });
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`; // "YYYY-MM"
  const calCells: (number | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const WEEKDAY_KEYS: I18nKey[] = [
    'profil.weekday.mon', 'profil.weekday.tue', 'profil.weekday.wed',
    'profil.weekday.thu', 'profil.weekday.fri', 'profil.weekday.sat', 'profil.weekday.sun',
  ];

  // Jours RÉELLEMENT actifs du mois (GET /me/activity) — set des numéros de jour.
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set());
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLeague(getCached<LeagueView>('league'));
      const apply = (days: string[]) => {
        if (!cancelled) setActiveDays(new Set(days.map((d) => Number(d.slice(8, 10)))));
      };
      swrFetch(`activity:${monthKey}`, () => fetchActivity(monthKey), apply)
        .then(apply)
        .catch(() => { /* hors-ligne : calendrier vide, pas d'erreur bloquante */ });
      return () => { cancelled = true; };
    }, [monthKey]),
  );

  const handleLogout = () => {
    Alert.alert(
      tr('profil.logoutConfirmTitle'),
      tr('profil.logoutConfirmMsg'),
      [
        { text: tr('profil.logoutCancel'), style: 'cancel' },
        {
          text: tr('profil.logoutAction'),
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(onboarding)/signup');
          },
        },
      ],
    );
  };

  const STATS = [
    { icon: 'zap' as const, value: xp.toLocaleString(localeTag), label: tr('profil.xpTotal'), color: '#E5A400', fill: true },
    { icon: null, value: String(streak), label: tr('profil.streakDays'), color: '#F0820C', fill: true },
    { icon: 'book-open' as const, value: String(sourates), label: tr('profil.sourates'), color: '#2FA81F', fill: false },
    { icon: 'target' as const, value: precision > 0 ? `${precision} %` : '—', label: tr('profil.precision'), color: '#6B4DFF', fill: false },
  ];

  const subLine = [streakLine(streak), leagueName && tr('profil.leagueRow', { nom: leagueName })].filter(Boolean).join(' · ');

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ── En-tête ── */}
        <LinearGradient
          colors={T.isDark ? ['#6A4FE8', '#4E35C9', '#3A24A0'] : ['#8A6BFF', '#6B4DFF', '#5B3FD6']}
          locations={[0, 0.55, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 12 }]}
        >
          <View style={styles.heroGlow} pointerEvents="none" />
          <View style={styles.heroTop}>
            <Text style={styles.heroTitle}>{tr('profil.title')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable style={styles.heroBtn} onPress={() => router.push('/(app)/referral')} accessibilityLabel={tr('profil.share')} hitSlop={6}>
                <Feather name="share" size={16} color="#fff" />
              </Pressable>
              <Pressable style={styles.heroBtn} onPress={() => router.push('/(app)/settings')} accessibilityLabel="Paramètres" hitSlop={6}>
                <Feather name="settings" size={17} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.idRow}>
            <Pressable style={styles.avatarWrap} onPress={() => router.push('/(app)/avatar')} accessibilityLabel={tr('profil.editAvatar')}>
              <View style={styles.avatarRing}>
                <UserAvatar size={72} />
              </View>
              <View style={styles.editBadge}>
                <Feather name="edit-2" size={12} color="#5B3FD6" />
              </View>
            </Pressable>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.name} numberOfLines={1}>{name || tr('profil.defaultName')}</Text>
              {!!username && <Text style={styles.handle} numberOfLines={1}>@{username}</Text>}
              <View style={styles.subRow}>
                <FlameIcon size={13} color="#FFB27A" />
                <Text style={styles.subText} numberOfLines={1}>{subLine}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* ── Statistiques ── */}
          <View style={[styles.statsCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
            <View style={styles.statsRow}>
              {STATS.map((s, i) => (
                <View key={i} style={styles.stat}>
                  <Text style={[styles.statVal, { color: T.text }]} numberOfLines={1} adjustsFontSizeToFit>{s.value}</Text>
                  <View style={styles.statLblRow}>
                    {s.icon ? <Feather name={s.icon} size={11} color={s.color} /> : <FlameIcon size={11} color={s.color} />}
                    <Text style={[styles.statLbl, { color: T.textSecondary }]} numberOfLines={1}>{s.label}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Pressable
              style={[styles.leagueRow, { borderTopColor: T.border, backgroundColor: T.inputBg }]}
              onPress={() => router.push('/(app)/(tabs)/ligues')}
              accessibilityRole="button"
            >
              <Feather name="award" size={16} color="#17A062" />
              <Text style={[styles.leagueText, { color: T.text }]} numberOfLines={1}>
                {leagueName ? tr('profil.leagueRow', { nom: leagueName }) : tr('profil.leagueSee')}
                {leagueName && league?.myRank != null && (
                  <Text style={{ color: T.textSecondary, fontFamily: 'Nunito_700Bold' }}> {tr('profil.leagueRank', { n: league.myRank })}</Text>
                )}
              </Text>
              <Feather name="chevron-right" size={16} color={T.textSecondary} />
            </Pressable>
          </View>

          {/* ── Ton style (avatar) ── */}
          {avatarStyle && (
            <>
              <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('profil.yourStyle')}</Text>
              <View style={[styles.styleCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
                {([
                  ['avatar.tab.hair', `avatar.opt.hair.${avatarStyle.hair}`, avatarStyle.hairColor],
                  ['avatar.tab.eyes', `avatar.opt.eyes.${avatarStyle.eyes}`, '#2a1d17'],
                  ['avatar.tab.mouth', `avatar.opt.mouth.${avatarStyle.mouth}`, '#7a2e2e'],
                  ['avatar.tab.outfit', `avatar.opt.outfit.${avatarStyle.outfit}`, avatarStyle.outfitColor],
                  ['avatar.tab.bg', null, avatarStyle.bg],
                ] as [I18nKey, string | null, string][]).map(([k, v, color], i, all) => (
                  <View
                    key={k}
                    style={[styles.styleRow, i < all.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}
                  >
                    <Text style={[styles.styleKey, { color: T.textSecondary }]}>{tr(k)}</Text>
                    <View style={styles.styleVal}>
                      <Text style={[styles.styleValText, { color: T.text }]}>{v ? tr(v as I18nKey) : '—'}</Text>
                      <View style={[styles.styleDot, { backgroundColor: color, borderColor: T.border }]} />
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
          <Pressable
            onPress={() => router.push('/(app)/avatar')}
            style={({ pressed }) => [styles.avatarBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
          >
            <Feather name="edit-2" size={16} color={T.isDark ? '#9d88ff' : '#6a4fe6'} />
            <Text style={[styles.avatarBtnText, { color: T.isDark ? '#9d88ff' : '#6a4fe6' }]}>
              {tr(avatarStyle ? 'profil.editAvatar' : 'profil.createAvatar')}
            </Text>
          </Pressable>

          {/* ── Prochaine prière ── */}
          <PrayerCard onPress={() => router.push('/(app)/prieres')} localeTag={localeTag} />

          {/* ── Mes espaces ── */}
          <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('profil.spaces')}</Text>

          <Pressable onPress={() => router.push('/(app)/tajwid')} style={({ pressed }) => pressed && { opacity: 0.9 }} accessibilityRole="button">
            <LinearGradient colors={['#9B7BFF', '#7A55F0', '#5A33D6']} locations={[0, 0.5, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.listen}>
              <View style={styles.listenGhost} pointerEvents="none">
                <Feather name="music" size={150} color="rgba(255,255,255,0.16)" />
              </View>
              <View style={styles.listenTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listenLabel}>{tr('profil.tajwidLabel')}</Text>
                  <Text style={styles.listenTitle}>{tr('profil.tajwidTitle')}</Text>
                  <Text style={styles.listenSub}>{tr('profil.tajwidSub')}</Text>
                </View>
                <Text style={styles.listenArabic}>تجويد</Text>
              </View>
              <View style={styles.wave}>
                {WAVE.map((h, j) => (
                  <View key={j} style={[styles.waveBar, { height: h, backgroundColor: j < 16 ? '#fff' : 'rgba(255,255,255,0.35)' }]} />
                ))}
              </View>
              <View style={styles.listenBottom}>
                <View style={styles.playBtn}>
                  <Feather name="play" size={17} color="#5A33D6" style={{ marginLeft: 2 }} />
                </View>
                <View style={styles.listenPill}>
                  <Feather name="lock" size={12} color="#fff" />
                  <Text style={styles.listenPillText} numberOfLines={1}>{tr('profil.tajwidBg')}</Text>
                </View>
              </View>
            </LinearGradient>
          </Pressable>

          <View style={styles.grid}>
            {badges.map((b, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [{ width: b.wide ? '100%' : '48.5%' }, pressed && { transform: [{ scale: 0.97 }] }]}
                onPress={() => router.push(b.route)}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={[b.color + (T.isDark ? '2E' : '1C'), b.color + (T.isDark ? '10' : '08')]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0.6, y: 1 }}
                  style={[styles.tile, { borderColor: b.color + (T.isDark ? '33' : '22') }]}
                >
                  <View style={[styles.tileGhost, { opacity: T.isDark ? 0.14 : 0.1 }]} pointerEvents="none">
                    <b.Icon size={88} color={b.color} />
                  </View>
                  <View style={[styles.tileIcon, { backgroundColor: b.color, shadowColor: b.color }]}>
                    <b.Icon size={19} color="#fff" />
                  </View>
                  <View style={{ marginTop: 14 }}>
                    <Text style={[styles.tileTitle, { color: T.text }]} numberOfLines={1}>{b.title}</Text>
                    <Text style={[styles.tileSub, { color: T.isDark ? '#B4B0C4' : '#77728A' }]} numberOfLines={1}>{b.sub}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>

          {/* ── Calendrier du mois en cours ── */}
          <View style={[styles.calCard, { backgroundColor: T.cardBg, borderColor: T.border }]}>
            <View style={styles.calTitleRow}>
              <Text style={[styles.calTitle, { color: T.text }]}>{monthLabel}</Text>
              <FlameIcon size={18} color="#F0820C" />
            </View>
            <View style={styles.calWeekHeader}>
              {WEEKDAY_KEYS.map((w, i) => (
                <Text key={i} style={[styles.calWeekday, { color: T.textTertiary }]}>{tr(w)}</Text>
              ))}
            </View>
            <View style={styles.calGrid}>
              {calCells.map((d, i) => {
                if (d === null) return <View key={`b${i}`} style={styles.calCell} />;
                const isToday = d === today;
                const isActive = activeDays.has(d);
                const future = d > today;
                return (
                  <View key={d} style={styles.calCell}>
                    <View
                      style={[
                        styles.calCellInner,
                        isActive && { backgroundColor: '#FF9A3D' },
                        isToday && !isActive && { borderWidth: 2, borderColor: '#FF9A3D' },
                        !isActive && !isToday && { backgroundColor: T.selectorBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.calNum,
                          { color: isActive ? '#fff' : future ? T.textTertiary : T.textSecondary },
                        ]}
                      >
                        {d}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* ── Déconnexion ── */}
          <Pressable
            style={[styles.logoutBtn, { backgroundColor: T.cardBg, borderColor: T.isDark ? '#4A2330' : '#FFD9D9' }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={18} color="#FF4B4B" />
            <Text style={styles.logoutText}>{tr('profil.logout')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      {avatarToast && (
        <View style={[styles.toast, { top: insets.top + 8 }]} pointerEvents="none">
          <Feather name="check" size={16} color="#fff" />
          <Text style={styles.toastText}>{tr('profil.avatarSaved')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  hero: {
    paddingHorizontal: 18, paddingBottom: 22, overflow: 'hidden',
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
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18 },
  avatarWrap: { width: 78, height: 78 },
  avatarRing: {
    width: 78, height: 78, borderRadius: 39, padding: 3, backgroundColor: 'rgba(255,255,255,0.9)',
  },
  styleCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
  styleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  styleKey: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  styleVal: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  styleValText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14 },
  styleDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  avatarBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 18, borderWidth: 2, borderColor: '#7357ff', paddingVertical: 12,
  },
  avatarBtnText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 16 },
  toast: {
    position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3fcb2f', borderRadius: 99, paddingVertical: 8, paddingHorizontal: 16,
    shadowColor: '#16142b', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 6,
  },
  toastText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14, color: '#fff' },
  editBadge: {
    position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16142B', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  name: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 22, lineHeight: 26, color: '#fff' },
  handle: { fontFamily: 'Nunito_700Bold', fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  subText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 13, color: 'rgba(255,255,255,0.95)' },

  body: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  statsCard: {
    borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#1E1446', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.07, shadowRadius: 20, elevation: 3,
  },
  statsRow: { flexDirection: 'row', paddingTop: 14, paddingBottom: 12, paddingHorizontal: 4 },
  stat: { flex: 1, alignItems: 'center', gap: 3 },
  statVal: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 21, lineHeight: 25 },
  statLblRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLbl: { fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },
  leagueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 14, borderTopWidth: 1,
  },
  leagueText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 12.5 },

  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 19, paddingHorizontal: 4, marginTop: 6 },

  listen: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  listenGhost: { position: 'absolute', right: -26, top: -26 },
  listenTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  listenLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, color: 'rgba(255,255,255,0.92)' },
  listenTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, lineHeight: 28, color: '#fff', marginTop: 4 },
  listenSub: { fontFamily: 'Nunito_700Bold', fontSize: 12, color: 'rgba(255,255,255,0.88)', marginTop: 3 },
  listenArabic: { fontFamily: 'ScheherazadeNew_700Bold', fontSize: 26, lineHeight: 40, color: 'rgba(255,255,255,0.95)' },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 30, marginTop: 14 },
  waveBar: { flex: 1, borderRadius: 2 },
  listenBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#280A78', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
  },
  listenPill: {
    flex: 1, height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  listenPillText: { flex: 1, fontFamily: 'Nunito_800ExtraBold', fontSize: 11.5, color: '#fff' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  tile: { minHeight: 118, padding: 14, borderRadius: 22, borderWidth: 1, overflow: 'hidden', justifyContent: 'space-between' },
  tileGhost: { position: 'absolute', right: -18, bottom: -22 },
  tileIcon: {
    width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 4,
  },
  tileTitle: { fontFamily: 'Nunito_900Black', fontSize: 14, lineHeight: 18 },
  tileSub: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, marginTop: 2 },

  calCard: { borderRadius: 24, borderWidth: 1, padding: 14, marginTop: 4 },
  calTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  calTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, textTransform: 'capitalize' },
  calWeekHeader: { flexDirection: 'row', marginBottom: 4 },
  // 7 colonnes = 100 %/7, sans `gap` (sinon la 7ᵉ colonne passe à la ligne).
  calWeekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: 'Nunito_800ExtraBold', fontSize: 11 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  calCellInner: { flex: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  calNum: { fontFamily: 'Nunito_800ExtraBold', fontSize: 13 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 18, paddingVertical: 14, borderWidth: 1.5, marginTop: 4,
  },
  logoutText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#FF4B4B' },
});
