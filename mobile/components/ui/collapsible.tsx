import { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Colors } from '@/constants/theme';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity style={styles.heading} onPress={() => setIsOpen(v => !v)} activeOpacity={0.8}>
        <Text style={styles.chevron}>{isOpen ? '▼' : '▶'}</Text>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chevron: { color: Colors.mutedForeground, fontSize: 12 },
  title: { color: Colors.foreground, fontFamily: 'PlusJakartaSans-SemiBold' },
  content: { marginTop: 6, marginLeft: 24 },
});
