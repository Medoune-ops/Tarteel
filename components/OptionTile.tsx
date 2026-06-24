import React from 'react';
import { Pressable, View, Text, StyleSheet, ViewStyle } from 'react-native';

interface OptionTileProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  selected?: boolean;
  /** couleur du ring de sélection : vert par défaut, violet possible */
  ringColor?: string;
  /** fond par défaut de la tile (certains écrans gardent des fonds pastel) */
  defaultBg?: string;
  selectedBg?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export default function OptionTile({
  icon, iconBg, title, subtitle, selected,
  ringColor = '#34C724', defaultBg = '#ECEEF2', selectedBg = '#E7F8E4',
  onPress, style,
}: OptionTileProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tile,
        { backgroundColor: selected ? selectedBg : defaultBg },
        selected && { borderWidth: 3, borderColor: ringColor, padding: 15 },
        style,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.textBox}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBox: { flex: 1 },
  title: { fontFamily: 'Nunito_800ExtraBold', fontSize: 18, color: '#1B2333' },
  subtitle: { fontFamily: 'Nunito_600SemiBold', fontSize: 14, color: '#8A8F99', marginTop: 2 },
});
