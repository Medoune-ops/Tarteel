import { View, Text } from 'react-native';

const PALETTE = ['#6B4DFF', '#2C9CE0', '#E0387E', '#F0820C', '#2A9E1C', '#C0392B', '#16A085', '#8E44AD'];

/** Initiales depuis le nom complet (fallback avatar, comme edit-profile). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Pastille avatar colorée à partir du nom/identifiant de l'ami. */
export default function FriendAvatar({ name, id, size = 46 }: { name: string; id?: string; size?: number }) {
  let hash = 0;
  const seed = id ?? name;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const color = PALETTE[Math.abs(hash) % PALETTE.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: 'Baloo2_800ExtraBold', fontSize: size * 0.38, color: '#fff' }}>
        {initials(name)}
      </Text>
    </View>
  );
}