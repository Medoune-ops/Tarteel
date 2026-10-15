/**
 * Écran « Heures de prière » — les 5 prières du jour, la prochaine mise en
 * avant (le Chourouq rattaché au Fajr), plus le choix de la position.
 *
 * Tout est calculé localement (`constants/prayerTimes.ts`) : aucun appel
 * réseau, l'écran fonctionne hors-ligne dès que la position est connue.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert, Switch, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedScrollHandler, useAnimatedStyle,
  interpolate, Extrapolation,
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import HeaderPattern from '../../components/HeaderPattern';
import DeviceStatusBar from '../../components/StatusBar';
import QiblaCompass from '../../components/QiblaCompass';
import { useTheme } from '../../utils/useTheme';
import { usePrayerStore } from '../../store/prayerStore';
import { useUserStore } from '../../store/userStore';
import {
  computePrayerTimes,
  computeSunrise,
  nextPrayer,
  formatPrayerTime,
  timeUntil,
  FALLBACK_CITIES,
  PRAYER_NAMES,
  type PrayerSlot,
} from '../../constants/prayerTimes';
import { requestReminderPermission } from '../../lib/prayerReminders';
import { useT } from '../../lib/i18n';

const LOCALE_BY_LANG: Record<string, string> = { fr: 'fr-FR', en: 'en-US', ar: 'ar' };

export default function PrieresScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const { width } = useWindowDimensions();

  /*
   * En-tête qui se comprime au défilement, comme sur les pages de contenu.
   * Il passe de 190 à 92 pixels : le médaillon et le sous-titre se replient,
   * le titre rétrécit et vient se poser à côté de la flèche de retour.
   *
   * Replier la HAUTEUR du médaillon et du sous-titre, pas seulement leur
   * opacité : un élément transparent occupe toujours sa place, et le titre
   * se retrouverait écrasé à zéro.
   */
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const COURSE = 98;

  const hdrHauteur = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, COURSE], [190, 92], Extrapolation.CLAMP),
  }));
  /*
   * Le titre est positionné ABSOLUMENT, pas laissé au flux.
   *
   * Avec `justifyContent: flex-end` et des marges animées, sa place dépendait
   * du repli du médaillon et du sous-titre : il se faisait écraser à zéro, ou
   * trancher par le bord. En le posant à une coordonnée calculée, il glisse
   * simplement de sa position centrée vers la barre, à hauteur de la flèche.
   */
  const hdrTitre = useAnimatedStyle(() => ({
    top: interpolate(scrollY.value, [0, COURSE], [118, 50], Extrapolation.CLAMP),
    left: interpolate(scrollY.value, [0, COURSE], [20, 56], Extrapolation.CLAMP),
    // Au repos la boite occupe toute la largeur et `textAlign: center` centre
    // le titre. Repliee, on l'elargit tres au-dela du bord droit : le centrage
    // ne joue plus, le texte se cale a gauche apres la fleche et sa position
    // cesse de dependre de sa longueur (sinon FR et EN n'atterrissent pas au
    // meme endroit). numberOfLines={1} empeche tout debordement visible.
    right: interpolate(scrollY.value, [0, COURSE], [20, -220], Extrapolation.CLAMP),
    // La reduction part du bord GAUCHE (transformOrigin dans headerTitleAbs) :
    // sans cela elle part du centre, et le titre recule vers la droite d'autant
    // que sa demi-largeur — un texte long comme « Heures de prière » se
    // desaligne alors de la fleche retour, un texte court presque pas.
    transform: [
      { scale: interpolate(scrollY.value, [0, COURSE], [1, 0.74], Extrapolation.CLAMP) },
    ],
  }));
  const hdrMedaillon = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COURSE * 0.5], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, COURSE], [62, 0], Extrapolation.CLAMP),
  }));
  const hdrSous = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COURSE * 0.5], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, COURSE], [20, 0], Extrapolation.CLAMP),
    // La hauteur du titre est deja reservee par la marge haute du filet
    // ci-dessus : la compter ici aussi poussait le sous-titre hors du cadre,
    // ou il se faisait trancher par le bord bas de l'en-tete.
    marginTop: interpolate(scrollY.value, [0, COURSE], [2, 0], Extrapolation.CLAMP),
  }));
  const hdrRule = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COURSE * 0.4], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, COURSE], [3, 0], Extrapolation.CLAMP),
    // Le titre est absolu (118 -> ~150) : il ne pousse rien, donc le filet doit
    // reserver lui-meme la hauteur qu'il occupe, sinon il lui passe au travers.
    marginTop: interpolate(scrollY.value, [0, COURSE], [40, 0], Extrapolation.CLAMP),
    marginBottom: interpolate(scrollY.value, [0, COURSE], [8, 0], Extrapolation.CLAMP),
  }));
  const language = useUserStore((s) => s.language);
  const localeTag = LOCALE_BY_LANG[language] ?? 'fr-FR';

  const latitude = usePrayerStore((s) => s.latitude);
  const longitude = usePrayerStore((s) => s.longitude);
  const cityName = usePrayerStore((s) => s.cityName);
  const source = usePrayerStore((s) => s.source);
  const setFromGps = usePrayerStore((s) => s.setFromGps);
  const setFromCity = usePrayerStore((s) => s.setFromCity);
  const remindersEnabled = usePrayerStore((s) => s.remindersEnabled);
  const reminderPrayers = usePrayerStore((s) => s.reminderPrayers);
  const setRemindersEnabled = usePrayerStore((s) => s.setRemindersEnabled);
  const toggleReminderPrayer = usePrayerStore((s) => s.toggleReminderPrayer);

  // Aperçu du son de rappel (le même fichier que la notification).
  const preview = useAudioPlayer(require('../../assets/sounds/prayer_reminder.wav'));
  const previewStatus = useAudioPlayerStatus(preview);
  const togglePreview = useCallback(() => {
    if (previewStatus.playing) {
      preview.pause();
    } else {
      preview.seekTo(0);
      preview.play();
    }
  }, [preview, previewStatus.playing]);

  // La programmation elle-même est faite par usePrayerRemindersSync (layout
  // racine) dès que le réglage change ; ici on ne gère que la permission.
  const onToggleReminders = useCallback(async (value: boolean) => {
    if (!value) {
      setRemindersEnabled(false);
      return;
    }
    const granted = await requestReminderPermission().catch(() => false);
    if (!granted) {
      Alert.alert(tr('prayer.reminder.permissionTitle'), tr('prayer.reminder.permissionDenied'));
      return;
    }
    setRemindersEnabled(true);
  }, [setRemindersEnabled, tr]);

  const [locating, setLocating] = useState(false);
  const [showCities, setShowCities] = useState(false);

  // Re-rendu chaque minute pour le compte à rebours.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const useGps = useCallback(async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Refus : on ne bloque pas, on propose la liste de villes.
        setShowCities(true);
        Alert.alert(tr('prayer.permissionTitle'), tr('prayer.permissionDenied'));
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setFromGps(pos.coords.latitude, pos.coords.longitude);
      setShowCities(false);
    } catch {
      // GPS indisponible (intérieur, appareil sans capteur…) : repli manuel.
      setShowCities(true);
      Alert.alert(tr('prayer.permissionTitle'), tr('prayer.locationFailed'));
    } finally {
      setLocating(false);
    }
  }, [setFromGps, tr]);

  const slots: PrayerSlot[] = useMemo(() => {
    if (latitude == null || longitude == null) return [];
    return computePrayerTimes(latitude, longitude, now);
  }, [latitude, longitude, now]);

  // Chourouq : fin du temps du Fajr, affiché sous sa ligne (pas une prière).
  const sunrise = useMemo(() => {
    if (latitude == null || longitude == null) return null;
    return computeSunrise(latitude, longitude, now);
  }, [latitude, longitude, now]);

  const upcoming = useMemo(() => {
    if (slots.length === 0) return null;
    const next = nextPrayer(slots, now);
    if (next) return next;
    // Après l'Isha : le Fajr de demain.
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return latitude != null && longitude != null
      ? computePrayerTimes(latitude, longitude, tomorrow)[0] ?? null
      : null;
  }, [slots, now, latitude, longitude]);

  const remaining = upcoming ? timeUntil(upcoming.time, now) : null;
  const hasLocation = latitude != null && longitude != null;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg }]}>
      <DeviceStatusBar />
      <Animated.View style={[styles.headerWrap, hdrHauteur]}>
        <LinearGradient colors={['#1F8A70', '#26A17B']} style={StyleSheet.absoluteFill} />
        <HeaderPattern width={width} height={180} variant="arcs" />
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
          <Feather name="chevron-left" size={26} color="#fff" />
        </Pressable>
        <Animated.View style={[styles.headerMedallionWrap, hdrMedaillon]}>
          <View style={styles.headerMedallion}>
            <Text style={styles.headerEmoji}>🕌</Text>
          </View>
        </Animated.View>

        <Animated.Text
          style={[styles.headerTitle, styles.headerTitleAbs, hdrTitre]}
          numberOfLines={1}
        >
          {tr('prayer.headerTitle')}
        </Animated.Text>

        <Animated.View style={[styles.headerRule, hdrRule]} />
        <Animated.Text style={[styles.headerSub, hdrSous]} numberOfLines={1}>
          {tr('prayer.headerSub')}
        </Animated.Text>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!hasLocation ? (
          <View style={styles.setupBox}>
            <Feather name="map-pin" size={32} color={T.textTertiary} />
            <Text style={[styles.setupText, { color: T.textSecondary }]}>
              {tr('prayer.setupExplain')}
            </Text>
            <Pressable style={styles.primaryBtn} onPress={useGps} disabled={locating}>
              {locating
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryLabel}>{tr('prayer.useGps')}</Text>}
            </Pressable>
            <Pressable onPress={() => setShowCities((v) => !v)}>
              <Text style={[styles.linkBtn, { color: T.textSecondary }]}>{tr('prayer.chooseCity')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Prochaine prière, mise en avant. */}
            {upcoming && (
              <LinearGradient
                colors={['#1F8A70', '#26A17B']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.nextCard}
              >
                <Text style={styles.nextLabel}>{tr('prayer.nextPrayer')}</Text>
                <Text style={styles.nextName}>{tr(`prayer.name.${upcoming.name}`)}</Text>
                <Text style={styles.nextTime}>{formatPrayerTime(upcoming.time, localeTag)}</Text>
                {remaining && (
                  <Text style={styles.nextRemaining}>
                    {remaining.hours > 0
                      ? tr('prayer.inHoursMinutes', { h: remaining.hours, m: remaining.minutes })
                      : tr('prayer.inMinutes', { m: remaining.minutes })}
                  </Text>
                )}
              </LinearGradient>
            )}

            {/* Les 5 prières du jour. */}
            <View style={[styles.list, { backgroundColor: T.cardBg }]}>
              {slots.map((s, i) => {
                const isNext = upcoming?.name === s.name && s.time.getTime() === upcoming.time.getTime();
                const passed = s.time.getTime() <= now.getTime();
                return (
                  <View
                    key={s.name}
                    style={[
                      i > 0 && [styles.divider, { borderTopColor: T.divider }],
                      isNext && styles.rowActive,
                    ]}
                  >
                    <View style={styles.row}>
                      <Text style={[styles.rowName, { color: passed && !isNext ? T.textTertiary : T.text }]}>
                        {tr(`prayer.name.${s.name}`)}
                      </Text>
                      <Text style={[styles.rowTime, { color: passed && !isNext ? T.textTertiary : T.text }]}>
                        {formatPrayerTime(s.time, localeTag)}
                      </Text>
                    </View>
                    {/* Chourouq DANS le bloc du Fajr, sans séparateur, en retrait
                        et en plus petit : il se lit comme la fin du temps du
                        Fajr, pas comme une sixième prière. */}
                    {s.name === 'fajr' && sunrise && (
                      <View style={styles.subRow}>
                        <Feather name="corner-down-right" size={14} color={T.textTertiary} />
                        <View style={styles.subTextCol}>
                          <Text style={[styles.subName, { color: T.textSecondary }]}>{tr('prayer.sunrise')}</Text>
                          <Text style={[styles.subHint, { color: T.textTertiary }]}>{tr('prayer.sunriseHint')}</Text>
                        </View>
                        <Text style={[styles.subTime, { color: T.textSecondary }]}>
                          {formatPrayerTime(sunrise, localeTag)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Rappels sonores à l'heure de la prière. */}
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('prayer.reminder.sectionTitle')}</Text>
            <View style={[styles.list, { backgroundColor: T.cardBg }]}>
              <View style={styles.row}>
                <View style={styles.reminderTextCol}>
                  <Text style={[styles.rowName, { color: T.text }]}>{tr('prayer.reminder.toggle')}</Text>
                  <Text style={[styles.reminderHint, { color: T.textTertiary }]}>{tr('prayer.reminder.toggleHint')}</Text>
                </View>
                {/*
                  L'état ÉTEINT doit avoir sa propre couleur : sans `false`,
                  React Native retombe sur un gris très clair, invisible sur
                  la carte blanche du mode clair — bouton blanc sur piste
                  quasi blanche. Mêmes valeurs que le composant `Toggle`.
                */}
                <Switch
                  value={remindersEnabled}
                  onValueChange={onToggleReminders}
                  trackColor={{ false: T.isDark ? '#3A3950' : '#D4D7DD', true: '#1F8A70' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={T.isDark ? '#3A3950' : '#D4D7DD'}
                />
              </View>
              {remindersEnabled && PRAYER_NAMES.map((name) => (
                <Pressable
                  key={name}
                  style={[styles.row, styles.divider, { borderTopColor: T.divider }]}
                  onPress={() => toggleReminderPrayer(name)}
                >
                  <Text style={[styles.rowName, { color: reminderPrayers[name] ? T.text : T.textTertiary }]}>
                    {tr(`prayer.name.${name}`)}
                  </Text>
                  <Feather
                    name={reminderPrayers[name] ? 'bell' : 'bell-off'}
                    size={18}
                    color={reminderPrayers[name] ? '#1F8A70' : T.textTertiary}
                  />
                </Pressable>
              ))}
              <Pressable
                style={[styles.row, styles.divider, { borderTopColor: T.divider }]}
                onPress={togglePreview}
              >
                <Text style={[styles.rowName, { color: '#1F8A70' }]}>
                  {previewStatus.playing ? tr('prayer.reminder.stop') : tr('prayer.reminder.preview')}
                </Text>
                <Feather name={previewStatus.playing ? 'pause' : 'play'} size={18} color="#1F8A70" />
              </Pressable>
            </View>

            {/* Position courante + moyen d'en changer. */}
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('prayer.locationTitle')}</Text>
            <View style={[styles.locationBox, { backgroundColor: T.cardBg }]}>
              <Feather name="map-pin" size={16} color={T.textSecondary} />
              <Text style={[styles.locationText, { color: T.textSecondary }]}>
                {cityName ?? (source === 'gps' ? tr('prayer.gpsPosition') : '—')}
              </Text>
            </View>
            <View style={styles.locationActions}>
              <Pressable style={styles.secondaryBtn} onPress={useGps} disabled={locating}>
                {locating
                  ? <ActivityIndicator color="#1F8A70" size="small" />
                  : <Text style={styles.secondaryLabel}>{tr('prayer.useGps')}</Text>}
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => setShowCities((v) => !v)}>
                <Text style={styles.secondaryLabel}>{tr('prayer.chooseCity')}</Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Liste des villes de repli. */}
        {showCities && (
          <View style={[styles.list, { backgroundColor: T.cardBg, marginTop: 12 }]}>
            {FALLBACK_CITIES.map((c, i) => (
              <Pressable
                key={c.id}
                style={[styles.row, i > 0 && [styles.divider, { borderTopColor: T.divider }]]}
                onPress={() => { setFromCity(c); setShowCities(false); }}
              >
                <Text style={[styles.rowName, { color: T.text }]}>{c.nom}</Text>
                {cityName === c.nom && <Feather name="check" size={18} color="#1F8A70" />}
              </Pressable>
            ))}
          </View>
        )}

        {/* Qibla — même position, même besoin : on évite un écran séparé. */}
        {hasLocation && (
          <>
            <Text style={[styles.sectionTitle, { color: T.text }]}>{tr('qibla.sectionTitle')}</Text>
            <QiblaCompass
              latitude={latitude}
              longitude={longitude}
              colors={{
                text: T.text,
                textSecondary: T.textSecondary,
                textTertiary: T.textTertiary,
                cardBg: T.cardBg,
              }}
            />
          </>
        )}

        <Text style={[styles.note, { color: T.textTertiary }]}>{tr('prayer.footerNote')}</Text>
        <View style={{ height: 28 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // Enveloppe de hauteur animee ; rogne son contenu pendant la compression.
  headerWrap: { overflow: 'hidden', alignItems: 'center' },
  // Le medaillon se replie en hauteur : son enveloppe rogne pendant l'animation.
  headerMedallionWrap: { overflow: 'hidden', marginTop: 54, alignItems: 'center' },
  // Titre pose a une coordonnee animee (voir hdrTitre) plutot que laisse au
  // flux : sa place ne depend plus du repli des autres elements.
  // transformOrigin ancre la reduction a GAUCHE, sinon un titre long se decale
  // vers la droite en se reduisant et ne suit plus la fleche retour.
  headerTitleAbs: { position: 'absolute', textAlign: 'center', transformOrigin: 'left center' },
  // Les marges verticales et la gauche sont animees (voir hdrMarges) :
  // seule la droite est fixe, pour garder le titre centre au repos.
  header: { flex: 1, paddingRight: 20, alignItems: 'center', justifyContent: 'flex-end' },
  back: { position: 'absolute', left: 14, top: 54, zIndex: 2 },
  headerMedallion: {
    width: 62, borderRadius: 31, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerEmoji: { fontSize: 30 },
  // marginTop est animé (voir hdrTitre) : il se résorbe à la compression.
  headerTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 24, color: '#fff' },
  // Les marges sont animees (voir hdrRule) : aucune marge statique ici, elle
  // s'ajouterait a la marge animee et decalerait tout le flux vers le bas.
  headerRule: { width: 42, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
  headerSub: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)' },

  content: { paddingHorizontal: 20, paddingTop: 18 },

  setupBox: { alignItems: 'center', gap: 14, paddingVertical: 40, paddingHorizontal: 20 },
  setupText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  primaryBtn: {
    backgroundColor: '#1F8A70', paddingHorizontal: 28, paddingVertical: 14,
    borderRadius: 14, minWidth: 200, alignItems: 'center',
  },
  primaryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15, color: '#fff' },
  linkBtn: { fontFamily: 'Nunito_700Bold', fontSize: 14, textDecorationLine: 'underline' },

  nextCard: { borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 18 },
  nextLabel: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  nextName: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 26, color: '#fff', marginTop: 2 },
  nextTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 40, color: '#fff', marginTop: 4 },
  nextRemaining: { fontFamily: 'Nunito_600SemiBold', fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 },

  list: { borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  rowActive: { backgroundColor: 'rgba(31,138,112,0.10)' },
  divider: { borderTopWidth: 1 },
  rowName: { fontFamily: 'Nunito_800ExtraBold', fontSize: 15 },
  rowTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 22, paddingRight: 16, paddingBottom: 12, marginTop: -6 },
  subTextCol: { flex: 1 },
  subName: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  subHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, marginTop: 1 },
  subTime: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14 },

  sectionTitle: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 17, marginTop: 22, marginBottom: 10 },

  reminderTextCol: { flex: 1, paddingRight: 12 },
  reminderHint: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, marginTop: 2, lineHeight: 17 },

  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  locationText: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  locationActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#1F8A70', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  secondaryLabel: { fontFamily: 'Nunito_800ExtraBold', fontSize: 14, color: '#1F8A70' },

  note: { fontFamily: 'Nunito_600SemiBold', fontSize: 12, textAlign: 'center', marginTop: 20, paddingHorizontal: 12, lineHeight: 17 },
});
