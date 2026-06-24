import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';

const META: Record<string, { label: string; icon: keyof typeof Feather.glyphMap; activeColor: string }> = {
  parcours: { label: 'Apprendre', icon: 'home', activeColor: '#2A9E1C' },
  revisions: { label: 'Révisions', icon: 'book', activeColor: '#6B4DFF' },
  ligues: { label: 'Ligues', icon: 'award', activeColor: '#E07A0C' },
  coran: { label: 'Coran', icon: 'book-open', activeColor: '#6B4DFF' },
  profil: { label: 'Profil', icon: 'user', activeColor: '#6B4DFF' },
};

const ORDER = ['parcours', 'revisions', 'ligues', 'coran', 'profil'];

export default function TabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.bar}>
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
              color={isActive ? meta.activeColor : '#44505F'}
              style={!isActive && { opacity: 0.55 }}
            />
            <Text
              style={[
                styles.label,
                isActive
                  ? { color: meta.activeColor, fontFamily: 'Nunito_800ExtraBold' }
                  : { opacity: 0.55 },
              ]}
            >
              {meta.label}
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
    borderTopColor: '#E6E8EC',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 4,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  label: { fontSize: 11, fontFamily: 'Nunito_700Bold', color: '#8A8F99' },
});
