import { useThemeColors } from '@/context/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
): string {
  const colors = useThemeColors();
  if (props.light || props.dark) {
    return (props.light ?? props.dark) as string;
  }
  return (colors as Record<string, string>)[colorName] ?? '#000000';
}
