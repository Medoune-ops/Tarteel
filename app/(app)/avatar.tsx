/**
 * « Mon avatar » : composer son avatar onglet par onglet.
 *
 * Le brouillon reste local à l'écran ; rien n'est écrit tant que
 * l'utilisateur n'a pas appuyé sur « Enregistrer ».
 */
import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar, { AVATAR_TABS, DEFAULT_AVATAR, randomAvatar, type AvatarConfig, type AvatarTab } from '../../components/Avatar';
import { useUserStore } from '../../store/userStore';
import { updateProfile } from '../../lib/api/me';
import { useTheme } from '../../utils/useTheme';
import { useT, type I18nKey } from '../../lib/i18n';

const PURPLE = '#7357ff';
// Pastilles claires : la coche y est foncée pour rester visible.
const LIGHT_SWATCHES = ['#f4f3fa', '#f6d7bf', '#e9b98f', '#e2b04a'];

export default function AvatarScreen() {
  const router = useRouter();
  const T = useTheme();
  const tr = useT();
  const insets = useSafeAreaInsets();
  const saved = useUserStore((s) => s.avatarStyle);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState<AvatarConfig>(saved ?? DEFAULT_AVATAR);
  const [tabKey, setTabKey] = useState<AvatarTab['key']>('hair');
  const tab = AVATAR_TABS.find((x) => x.key === tabKey)!;

  const set = (k: keyof AvatarConfig, v: string) => setDraft((d) => ({ ...d, [k]: v }));
  // Enregistré côté serveur (les amis et les ligues le voient) : le store est
  // réhydraté par la réponse de PATCH /me.
  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updateProfile({ avatarStyle: draft });
      router.back();
    } catch {
      Alert.alert(tr('avatar.saveErrorTitle'), tr('avatar.saveErrorMsg'));
    } finally {
      setSaving(false);
    }
  };

  const colorLabel = tab.colorKey === 'skin' ? tr('avatar.skin') : tr('avatar.color');
  const shadow = T.isDark ? null : styles.cardShadow;

  return (
    <View style={[styles.screen, { backgroundColor: T.pageBg, paddingTop: insets.top + 6 }]}>
      {/* En-tête */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.backBtn, { backgroundColor: T.cardBg }, shadow]}
          accessibilityRole="button"
        >
          <Feather name="chevron-left" size={22} color={T.text} />
        </Pressable>
        <Text style={[styles.title, { color: T.text }]}>{tr('avatar.title')}</Text>
        <Pressable
          onPress={() => setDraft(randomAvatar())}
          style={({ pressed }) => [styles.randomBtn, { backgroundColor: pressed ? '#7357ff3a' : '#7357ff24' }]}
          accessibilityRole="button"
        >
          <Feather name="shuffle" size={16} color={T.isDark ? '#9d88ff' : '#6a4fe6'} />
          <Text style={[styles.randomText, { color: T.isDark ? '#9d88ff' : '#6a4fe6' }]}>{tr('avatar.random')}</Text>
        </Pressable>
      </View>

      {/* Aperçu */}
      <View style={styles.preview}>
        <View style={styles.glow} />
        <View style={styles.floor} />
        <View style={[styles.previewRing, { borderColor: T.cardBg }]}>
          <Avatar config={draft} size={190} />
        </View>
      </View>

      {/* Onglets */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {AVATAR_TABS.map((x) => {
            const on = x.key === tabKey;
            return (
              <Pressable
                key={x.key}
                onPress={() => setTabKey(x.key)}
                style={[
                  styles.tab,
                  on ? styles.tabOn : [{ backgroundColor: T.cardBg }, shadow],
                ]}
              >
                <Text style={[styles.tabText, { color: on ? '#fff' : T.textSecondary }]}>
                  {tr(`avatar.tab.${x.key}` as I18nKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Couleurs */}
      {tab.colors && tab.colorKey && (
        <View style={styles.colorsBlock}>
          <Text style={[styles.label, { color: T.textSecondary }]}>{colorLabel}</Text>
          <View style={styles.swatches}>
            {tab.colors.map((v) => {
              const on = draft[tab.colorKey!] === v;
              return (
                <Pressable
                  key={v}
                  onPress={() => set(tab.colorKey!, v)}
                  hitSlop={4}
                  style={[
                    styles.swatchRing,
                    { borderColor: on ? PURPLE : 'transparent' },
                  ]}
                >
                  <View style={[styles.swatch, { backgroundColor: v }]}>
                    {on && <Feather name="check" size={16} color={LIGHT_SWATCHES.includes(v) ? '#16142b' : '#fff'} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Options */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.optionsScroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: T.textSecondary }]}>
          {tab.key === 'bg' ? tr('avatar.bgColor') : tr('avatar.style')}
        </Text>
        <View style={styles.grid}>
          {tab.options.map((v) => {
            const on = draft[tab.key] === v;
            return (
              <Pressable
                key={v}
                onPress={() => set(tab.key, v)}
                style={({ pressed }) => [
                  styles.option,
                  { backgroundColor: T.cardBg, borderColor: on ? PURPLE : 'transparent' },
                  shadow,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
              >
                <Avatar config={{ ...draft, [tab.key]: v }} size={76} />
                {tab.key !== 'bg' && (
                  <Text style={[styles.optionText, { color: T.text }]} numberOfLines={1}>
                    {tr(`avatar.opt.${tab.key}.${v}` as I18nKey)}
                  </Text>
                )}
                {on && (
                  <View style={styles.optionCheck}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Enregistrer */}
      <LinearGradient
        colors={[T.pageBg + '00', T.pageBg, T.pageBg]}
        locations={[0, 0.3, 1]}
        style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}
        pointerEvents="box-none"
      >
        <Pressable onPress={save} style={({ pressed }) => [styles.saveStep, pressed && { paddingBottom: 2, marginTop: 3 }]}>
          <View style={styles.saveBtn}>
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveText}>{tr('avatar.save')}</Text>}
          </View>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  cardShadow: {
    shadowColor: '#16142b', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontFamily: 'Baloo2_800ExtraBold', fontSize: 20 },
  randomBtn: { height: 40, paddingHorizontal: 12, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  randomText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14 },

  preview: { height: 232, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(115,87,255,0.1)' },
  floor: { position: 'absolute', bottom: 14, width: 170, height: 20, borderRadius: 85, backgroundColor: 'rgba(22,20,43,0.12)' },
  previewRing: {
    borderRadius: 101, borderWidth: 6,
    shadowColor: '#16142b', shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },

  tabs: { gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 6 },
  tab: { paddingVertical: 8, paddingHorizontal: 13, borderRadius: 14 },
  tabOn: {
    backgroundColor: PURPLE,
    shadowColor: '#5038d0', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3,
  },
  tabText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 14 },

  colorsBlock: { paddingHorizontal: 16, paddingTop: 14 },
  label: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12, letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 8 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  swatchRing: { padding: 2, borderRadius: 22, borderWidth: 2.5 },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(22,20,43,0.13)' },

  optionsScroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    width: '31.4%', borderRadius: 20, borderWidth: 2.5,
    paddingTop: 10, paddingBottom: 8, paddingHorizontal: 6, alignItems: 'center', gap: 6,
  },
  optionText: { fontFamily: 'Nunito_800ExtraBold', fontSize: 12 },
  optionCheck: {
    position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10,
    backgroundColor: PURPLE, alignItems: 'center', justifyContent: 'center',
  },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 28, paddingHorizontal: 16 },
  saveStep: { borderRadius: 18, paddingBottom: 5, backgroundColor: '#1d8516' },
  saveBtn: { height: 52, borderRadius: 18, backgroundColor: '#3fcb2f', alignItems: 'center', justifyContent: 'center' },
  saveText: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 18, color: '#fff' },
});
