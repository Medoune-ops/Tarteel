export const Colors = {
  primary: '#6B4DFF',
  primaryLight: '#8A6BFF',
  primaryDark: '#5B3FD6',

  green: '#34C724',
  greenDark: '#2A9E1C',
  greenLight: '#DCF5D6',
  greenBg: '#DEF5E5',

  red: '#FF4B4B',
  redDark: '#D43A3A',
  redBg: '#FFE7E7',

  orange: '#F0820C',
  orangeLight: '#FF9A3D',
  orangeDark: '#E0560E',

  xp: '#E8A800',
  gold: '#F0A41E',
  goldDark: '#E07A0C',

  pageBg: '#EDEDF2',
  grayBg: '#E4E5EA',
  cardBg: '#FFFFFF',

  text: '#1B2333',
  textSecondary: '#7A828F',
  textTertiary: '#9AA0AA',
  border: '#E6E8EC',

  inputBg: '#F2F3F6',
  selectorBg: '#ECEEF2',
  selectedBg: '#E7F8E4',
} as const;

export const LightTheme = {
  pageBg: '#EDEDF2',
  cardBg: '#FFFFFF',
  inputBg: '#F2F3F6',
  border: '#E6E8EC',
  divider: '#F0F1F4',
  text: '#1B2333',
  textSecondary: '#7A828F',
  textTertiary: '#9AA0AA',
  sectionLabel: '#9AA0AA',
  headerBg: '#FFFFFF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E6E8EC',
  selectorBg: '#ECEEF2',
  selectedBg: '#E7F8E4',
  profileCardBg: '#E8E2FB',
  // ── Décor / éléments graphiques ──
  skyline: '#B0B8C4',        // traits du panorama La Mecque
  skylineShadow: '#EDEDF2',  // ombre de lune (= pageBg en clair)
  lockedBg: '#D5D8DF',       // nœud verrouillé (fond)
  lockedBorder: '#B0B5BE',   // nœud verrouillé (bordure)
  lockedBorderDark: '#9EA3AC', // nœud verrouillé (bordure basse)
  lockedIcon: '#9AA0AA',     // icône d'un nœud verrouillé
  dashedLine: '#C9CDD4',     // pointillés entre les nœuds
  shadow: '#000000',         // couleur d'ombre portée
  statusBar: 'dark' as const,
};

export const DarkTheme = {
  pageBg: '#0F0E17',
  cardBg: '#1C1B28',
  inputBg: '#252436',
  border: '#2E2D3F',
  divider: '#2A2940',
  text: '#F0EFFF',
  textSecondary: '#9896B8',
  textTertiary: '#6B6A88',
  sectionLabel: '#6B6A88',
  headerBg: '#1C1B28',
  tabBarBg: '#1C1B28',
  tabBarBorder: '#2E2D3F',
  selectorBg: '#252436',
  selectedBg: '#1E3320',
  profileCardBg: '#221F38',
  // ── Décor / éléments graphiques ──
  skyline: '#4A4866',        // traits du panorama — violet-gris désaturé, discret sur fond nuit
  skylineShadow: '#0F0E17',  // ombre de lune (= pageBg en sombre, donc invisible/fondue)
  lockedBg: '#2A2940',       // nœud verrouillé — sombre, dans la palette nuit
  lockedBorder: '#383655',
  lockedBorderDark: '#1F1E30',
  lockedIcon: '#6B6A88',     // icône verrouillée — gris violacé
  dashedLine: '#383655',     // pointillés discrets
  shadow: '#000000',
  statusBar: 'light' as const,
};

export type ThemeColors = Omit<typeof LightTheme, 'statusBar'> & {
  statusBar: 'light' | 'dark';
};
