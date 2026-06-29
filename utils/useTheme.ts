import { useColorScheme } from 'react-native';
import { useUserStore } from '../store/userStore';
import { LightTheme, DarkTheme, type ThemeColors } from '../constants/colors';

export function useTheme(): ThemeColors & { isDark: boolean } {
  const theme = useUserStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemScheme === 'dark');

  return { ...(isDark ? DarkTheme : LightTheme), isDark };
}
