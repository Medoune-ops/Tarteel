import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../utils/useTheme';
import { useT, type I18nKey } from '../lib/i18n';

const META: Record<string, { labelKey: I18nKey; icon: keyof typeof Feather.glyphMap; activeColor: string }> = {
  parcours: { labelKey: 'tabs.parcours', icon: 'home', activeColor: '#2A9E1C' },
  revisions: { labelKey: 'tabs.revisions', icon: 'book', activeColor: '#6B4DFF' },
  ligues: { labelKey: 'tabs.ligues', icon: 'award', activeColor: '#E07A0C' },
  coran: { labelKey: 'tabs.coran', icon: 'book-open', activeColor: '#6B4DFF' },
  profil: { labelKey: 'tabs.profil', icon: 'user', activeColor: '#6B4DFF' },
};

const ORDER = ['parcours', 'revisions', 'ligues', 'coran', 'profil'];

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  const T = useTheme();
  const tr = useT();
  return (
    <View style={[styles.bar, { backgroundColor: T.tabBarBg, borderTopColor: T.tabBarBorder }]}>
      {ORDER.map((name) => {
        const route = state.routes.find((r: { name: string }) => r.name === name);
        if (!route) return null;
        const meta = META[name];
        const isActive = state.routes[state.index]?.name === name;

        return (
          <Pressable
            key={name}
            style={styles.tab}
            onPress={() => navigation.navigate(route.name)}
          >
            <Feather
              name={meta.icon}
              size={23}
              color={isActive ? meta.activeColor : (T.isDark ? '#8E8CB0' : '#44505F')}
              style={!isActive && { opacity: T.isDark ? 0.8 : 0.55 }}
            />
            <Text
              style={[
                styles.label,
                { color: T.textSecondary },
                isActive
                  ? { color: meta.activeColor, fontFamily: 'Nunito_800ExtraBold' }
                  : { opacity: T.isDark ? 0.85 : 0.55 },
              ]}
            >
              {tr(meta.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 76,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#8A8F99' },
});
