import { View, Text } from 'react-native';
import Avatar, { type AvatarConfig } from './Avatar';

const PALETTE = ['#6B4DFF', '#2C9CE0', '#E0387E', '#F0820C', '#2A9E1C', '#C0392B', '#16A085', '#8E44AD'];

/** Initiales depuis le nom complet (fallback avatar, comme edit-profile). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Couleur stable dérivée du nom/identifiant de l'ami. */
export function friendColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/**
 * Avatar d'un ami : l'avatar qu'il a composé s'il en a un, sinon une pastille
 * colorée à ses initiales.
 */
export default function FriendAvatar({
  name, id, size = 46, avatarStyle,
}: { name: string; id?: string; size?: number; avatarStyle?: AvatarConfig | null }) {
  if (avatarStyle) return <Avatar config={avatarStyle} size={size} />;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: friendColor(id ?? name),
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
