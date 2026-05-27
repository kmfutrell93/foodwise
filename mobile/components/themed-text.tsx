import { Text, type TextProps } from 'react-native';
import { Colors, Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'label' | 'caption' | 'muted';
};

export function ThemedText({ style, type = 'default', ...rest }: ThemedTextProps) {
  const typeStyle =
    type === 'title'          ? Typography.displayLG :
    type === 'defaultSemiBold'? { ...Typography.body, fontWeight: '600' as const } :
    type === 'subtitle'       ? Typography.heading :
    type === 'link'           ? { ...Typography.body, color: Colors.teal } :
    type === 'label'          ? Typography.label :
    type === 'caption'        ? Typography.caption :
    type === 'muted'          ? { ...Typography.bodySmall, color: Colors.textMuted } :
    /* default */               Typography.body;

  return <Text style={[typeStyle, style]} {...rest} />;
}
