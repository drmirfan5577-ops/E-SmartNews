import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LauncherTheme } from '@/constants/launchers';

type Props = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  theme: LauncherTheme;
  badge?: string;
  onPress: () => void;
};

export function AdminCard({ icon, title, description, theme, badge, onPress }: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: theme.primary + '22' }]}>
        <MaterialIcons name={icon} size={22} color={theme.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.cardDesc, { color: theme.textMuted }]} numberOfLines={2}>{description}</Text>
      </View>
      {badge !== undefined && (
        <View style={[styles.badge, { backgroundColor: theme.primary + '33' }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{badge}</Text>
        </View>
      )}
      <MaterialIcons name="chevron-right" size={18} color={theme.textDim} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 8,
  },
  iconWrap: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  textWrap: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  cardDesc: { fontSize: 11, lineHeight: 16 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
});
