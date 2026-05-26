// FoodWise uses a single dark theme — no light/dark switching
import { Colors } from '@/constants/theme';

export function useThemeColor(
  _props: { light?: string; dark?: string },
  colorName: keyof typeof Colors
): string {
  return Colors[colorName] as string;
}
