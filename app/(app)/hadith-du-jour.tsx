/**
 * Le hadith du jour — version lecture.
 *
 * Remplace l'ancien écran de QCM quotidien. Plus de question, plus de bonne
 * ou mauvaise réponse, plus de gemmes gagnées : on lit une carte, on la met
 * de côté ou on la partage, c'est tout. Le rendez-vous sans l'examen.
 *
 * Le hadith ne change pas dans la journée (tirage dérivé de la date, voir
 * `lib/hadithDuJour.ts`) : revenir dans l'après-midi rend la même carte, ce
 * qui est tout l'intérêt d'un rendez-vous.
 *
 * Sous la carte, un réglage discret permet d'activer une notification à
 * l'heure de son choix. Elle est LOCALE : le hadith se calcule sur
 * l'appareil, donc pas de serveur, pas de token, et ça marche hors ligne.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Switch,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import DeviceStatusBar from '../../components/StatusBar';
import HadithCard from '../../components/HadithCard';
import { useTheme } from '../../utils/useTheme';
import {
  loadCollection, hadithLangFor, themeOfHadith, themeStyle,
  type CollectionId,
} from '../../lib/hadiths';
import { hadithOfDay } from '../../lib/hadithDuJour';
import { useHadithDaily, scheduleDailyHadith } from '../../store/hadithDailyStore';
import { useHadithFavorites } from '../../store/hadithFavoritesStore';
import { useHadithProgress, today } from '../../store/hadithProgressStore';
import { useHadithShare } from '../../hooks/useHadithShare';
import { useUserStore } from '../../store/userStore';
import { useT } from '../../lib/i18n';
import type { ThemeId } from '../../constants/hadithChapters';

/** Signature du visuel partagé. Une marque ne se traduit pas. */
const APP_NAME = 'TARTEEL';

/** Recueils où l'on pioche. Tous étiquetés, donc tous de bons candidats. */
const POOL: CollectionId[] = ['nawawi', 'qudsi', 'bukhari', 'muslim'];

/** Heures proposées : le matin large, quand on ouvre sa journée. */
const HOURS = [5, 6, 7, 8, 9, 10, 12, 18, 20, 21];

interface Daily {
  collectionId: CollectionId;
  n: number;
  text: string;
  theme: ThemeId;
  themeColor: string;
}

export default function HadithDuJourScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const hadithLang = hadithLangFor(useUserStore((s) => s.language));

  const enabled = useHadithDaily((s) => s.enabled);
  const hour = useHadithDaily((s) => s.hour);
  const setEnabled = useHadithDaily((s) => s.setEnabled);
  const setHour = useHadithDaily((s) => s.setHour);
  const markOpened = useHadithDaily((s) => s.markOpened);

  const isFavorite = useHadithFavorites((s) => s.isFavorite);
  const toggleFavorite = useHadithFavorites((s) => s.toggleFavorite);
  const markReadToday = useHadithFavorites((s) => s.markReadToday);
  const markRead = useHadithProgress((s) => s.markRead);
  const shareHadith = useHadithShare();

  const [daily, setDaily] = useState<Daily | null>(null);
  const [loading, setLoading] = useState(true);
  const [favTick, setFavTick] = useState(0);

  const day = useMemo(() => today(), []);

  // Charge le hadith du jour : on résout d'abord la référence, puis on
  // n'ouvre QUE le recueil concerné — inutile de charger Bukhari (4,5 Mo)
  // pour un hadith d'an-Nawawi.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const ref = hadithOfDay(day, POOL);
        if (!ref) { if (!cancelled) { setDaily(null); setLoading(false); } return; }

        const collectionId = ref.collection as CollectionId;
        const c = await loadCollection(collectionId, hadithLang);
        const h = c.hadiths.find((x) => x.n === ref.n);
        if (cancelled) return;

        if (!h) { setDaily(null); setLoading(false); return; }

        const theme = themeOfHadith(collectionId, h.s);
        setDaily({
          collectionId, n: h.n, text: h.t,
          theme, themeColor: themeStyle(theme).color,
        });

        // Lu : alimente la série de lecture douce, sans score ni récompense.
        markRead(collectionId, h.n);
        markReadToday();
        markOpened(day);
      } catch {
        if (!cancelled) setDaily(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [day, hadithLang, markRead, markReadToday, markOpened]);

  /** Textes de la notification, dans la langue courante. */
  const notifTexts = useCallback(() => ({
    title: tr('hadiths.daily.notifTitle'),
    body: tr('hadiths.daily.notifBody'),
  }), [tr]);

  const onToggle = useCallback((on: boolean) => {
    void Haptics.selectionAsync();
    setEnabled(on);
    void scheduleDailyHadith(on, hour, notifTexts());
  }, [setEnabled, hour, notifTexts]);

  const onPickHour = useCallback((h: number) => {
    void Haptics.selectionAsync();
    setHour(h);
    // Reprogramme immédiatement si le rappel est actif.
    if (enabled) void scheduleDailyHadith(true, h, notifTexts());
  }, [setHour, enabled, notifTexts]);

  const onFavorite = useCallback(() => {
    if (!daily) return;
    const added = toggleFavorite(daily.collectionId, daily.n);
    void Haptics.impactAsync(
      added ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
    );
    setFavTick((v) => v + 1);
  }, [daily, toggleFavorite]);

  const onShare = useCallback(() => {
    if (!daily) return;
    void shareHadith.share(
      {
        text: daily.text,
        collectionLabel: tr(`hadiths.collection.${daily.collectionId}`),
        number: daily.n,
        themeColor: daily.themeColor,
      },
      APP_NAME,
    );
  }, [daily, shareHadith, tr]);

  const soft = T.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(23,28,38,0.04)';
  const border = T.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(23,28,38,0.07)';

  // La carte occupe la plus grande partie de l'écran, mais laisse voir qu'il
  // y a quelque chose en dessous : sans cet indice, personne ne défile.
  const cardHeight = Math.max(360, height * 0.72);

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={[styles.center, { height: cardHeight }]}>
            <ActivityIndicator color={T.textSecondary} />
          </View>
        ) : daily ? (
          <HadithCard
            text={daily.text}
            collectionLabel={tr(`hadiths.collection.${daily.collectionId}`)}
            number={daily.n}
            theme={daily.theme}
            themeColor={daily.themeColor}
            height={cardHeight}
            favorite={isFavorite(daily.collectionId, daily.n)}
            onFavorite={onFavorite}
            onShare={shareHadith.available ? onShare : undefined}
            insetTop={insets.top + 34}
            insetBottom={0}
          />
        ) : (
          <View style={[styles.center, { height: cardHeight }]}>
            <Feather name="cloud-off" size={26} color={T.textSecondary} />
            <Text style={[styles.centerText, { color: T.textSecondary }]}>
              {tr('hadiths.daily.unavailable')}
            </Text>
          </View>
        )}

        <View style={styles.below}>
          {/* Vers le flux : on peut continuer à lire si la carte a donné envie. */}
          <Pressable
            onPress={() => router.push('/hadiths')}
            style={[styles.more, { backgroundColor: soft }]}
          >
            <Feather name="layers" size={16} color={T.textSecondary} />
            <Text style={[styles.moreText, { color: T.text }]}>
              {tr('hadiths.daily.readMore')}
            </Text>
            <Feather name="chevron-right" size={16} color={T.textSecondary} />
          </Pressable>

          {/* Rappel quotidien. */}
          <View style={[styles.remind, { backgroundColor: T.cardBg, borderColor: border }]}>
            <View style={styles.remindHead}>
              <View style={styles.remindLabel}>
                <Text style={[styles.remindTitle, { color: T.text }]}>
                  {tr('hadiths.daily.remindTitle')}
                </Text>
                <Text style={[styles.remindSub, { color: T.textSecondary }]}>
                  {tr('hadiths.daily.remindSub')}
                </Text>
              </View>
              <Switch
                value={enabled}
                onValueChange={onToggle}
                trackColor={{ false: soft, true: '#6B4DFF' }}
              />
            </View>

            {enabled && (
              <View style={styles.hours}>
                {HOURS.map((h) => {
                  const active = h === hour;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => onPickHour(h)}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: active ? '#6B4DFF' : soft,
                          borderColor: active ? '#6B4DFF' : border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.hourText,
                          { color: active ? '#FFFFFF' : T.textSecondary },
                        ]}
                      >
                        {tr('hadiths.daily.hour', { h })}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Retour, posé par-dessus la carte. */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={tr('hadiths.flow.backA11y')}
        style={[
          styles.back,
          { top: insets.top + 6, backgroundColor: T.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(23,28,38,0.05)' },
        ]}
      >
        <Feather name="chevron-left" size={21} color={T.textSecondary} />
      </Pressable>

      {/* `favTick` force le re-rendu quand le favori change. */}
      <View style={styles.hidden} accessibilityElementsHidden>
        <Text>{favTick}</Text>
      </View>

      {/* Visuel de partage, rendu hors champ le temps de la capture. */}
      {shareHadith.portal}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  center: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  centerText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14.5, textAlign: 'center' },

  back: {
    position: 'absolute', left: 16,
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  below: { paddingHorizontal: 22, paddingTop: 18, gap: 14 },

  more: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16,
  },
  moreText: { flex: 1, fontFamily: 'Nunito_700Bold', fontSize: 14.5 },

  remind: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  remindHead: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  remindLabel: { flex: 1, gap: 3 },
  remindTitle: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  remindSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, lineHeight: 19 },

  hours: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hourChip: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 13, paddingVertical: 8,
  },
  hourText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },

  hidden: { position: 'absolute', opacity: 0, width: 0, height: 0 },
});
