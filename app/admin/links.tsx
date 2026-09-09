import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { AppLink } from '@/constants/theme';
import T from '@/constants/translations';
import { useAlert } from '@/template';

const TYPE_OPTIONS: AppLink['type'][] = ['website', 'email', 'social', 'media'];
const TYPE_ICONS: Record<AppLink['type'], any> = {
  website: 'language', email: 'email', social: 'share', media: 'live-tv',
};
const TYPE_COLORS: Record<AppLink['type'], string> = {
  website: '#1976d2', email: '#388e3c', social: '#7b1fa2', media: '#c8102e',
};

export default function LinksManager() {
  const { isAdminLoggedIn, links, updateLink, activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openLink = async (url: string, type: AppLink['type']) => {
    if (!url.trim()) { showAlert('Empty', 'No URL configured for this slot.'); return; }
    try {
      let finalUrl = url.trim();
      if (type === 'email') { finalUrl = finalUrl.startsWith('mailto:') ? finalUrl : `mailto:${finalUrl}`; }
      else if (!finalUrl.startsWith('http')) { finalUrl = `https://${finalUrl}`; }
      const ok = await Linking.canOpenURL(finalUrl);
      if (ok) await Linking.openURL(finalUrl);
      else showAlert('Cannot Open', `Unable to open: ${finalUrl}`);
    } catch { showAlert('Error', 'Could not open link.'); }
  };

  const activeCount = links.filter(l => l.isActive && l.url).length;
  const inp = { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.linksManager}</Text>
          <View style={[styles.countBadge, { backgroundColor: theme.primary + '33' }]}>
            <Text style={[styles.countText, { color: theme.primary }]}>{activeCount}/20</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
            <MaterialIcons name="info-outline" size={14} color={theme.gold} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              {language === 'ur'
                ? '۲۰ لنک سلاٹس۔ ای میل، ویب سائٹ، سوشل میڈیا، میڈیا چینل لنکس ایڈ کریں اور کلک کر کے کھولیں۔'
                : '20 link slots for emails, websites, social media & media channels. Tap any active link to open it directly.'}
            </Text>
          </View>

          {links.map((link, idx) => {
            const isExpanded = expandedId === link.id;
            const hasContent = !!(link.url || link.label);
            const typeColor = TYPE_COLORS[link.type];
            return (
              <View key={link.id} style={[styles.linkCard, {
                backgroundColor: theme.surface,
                borderColor: link.isActive && link.url ? typeColor + '77' : theme.primary + '25',
              }]}>
                {/* Card row */}
                <TouchableOpacity
                  style={styles.linkRow}
                  onPress={() => setExpandedId(isExpanded ? null : link.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.slotNum, { backgroundColor: link.isActive && link.url ? typeColor + '22' : theme.surface2 }]}>
                    <Text style={[styles.slotNumText, { color: link.isActive && link.url ? typeColor : theme.textDim }]}>
                      {String(idx + 1).padStart(2, '0')}
                    </Text>
                  </View>
                  <View style={[styles.typeIcon, { backgroundColor: typeColor + '22' }]}>
                    <MaterialIcons name={TYPE_ICONS[link.type]} size={16} color={typeColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.linkLabel, { color: hasContent ? theme.text : theme.textDim }]} numberOfLines={1}>
                      {link.label || t.linkEmpty}
                    </Text>
                    {link.url ? (
                      <Text style={[styles.linkUrl, { color: typeColor }]} numberOfLines={1}>{link.url}</Text>
                    ) : (
                      <Text style={[styles.linkUrl, { color: theme.textDim }]}>No URL</Text>
                    )}
                  </View>
                  {link.isActive && link.url && (
                    <TouchableOpacity onPress={() => openLink(link.url, link.type)} style={[styles.openBtn, { backgroundColor: typeColor + '22' }]}>
                      <MaterialIcons name="open-in-new" size={16} color={typeColor} />
                    </TouchableOpacity>
                  )}
                  <MaterialIcons name={isExpanded ? 'expand-less' : 'expand-more'} size={18} color={theme.textDim} />
                </TouchableOpacity>

                {/* Expanded editor */}
                {isExpanded && (
                  <View style={[styles.expandedArea, { borderTopColor: theme.primary + '22' }]}>
                    {/* Type selector */}
                    <Text style={[styles.fieldLabel, { color: theme.primary }]}>TYPE</Text>
                    <View style={styles.typeRow}>
                      {TYPE_OPTIONS.map(tp => (
                        <TouchableOpacity
                          key={tp}
                          onPress={() => updateLink(link.id, { type: tp })}
                          style={[styles.typeBtn, { backgroundColor: link.type === tp ? TYPE_COLORS[tp] + '33' : theme.surface2, borderColor: TYPE_COLORS[tp] + '66' }]}
                        >
                          <MaterialIcons name={TYPE_ICONS[tp]} size={12} color={TYPE_COLORS[tp]} />
                          <Text style={[styles.typeBtnText, { color: TYPE_COLORS[tp] }]}>{tp}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t.linkLabel}</Text>
                    <TextInput
                      style={[styles.fieldInput, inp]}
                      value={link.label}
                      onChangeText={v => updateLink(link.id, { label: v })}
                      placeholder="Name / Label..."
                      placeholderTextColor={theme.textDim}
                    />
                    <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t.linkUrl}</Text>
                    <TextInput
                      style={[styles.fieldInput, inp]}
                      value={link.url}
                      onChangeText={v => updateLink(link.id, { url: v })}
                      placeholder={link.type === 'email' ? 'email@example.com' : 'https://...'}
                      placeholderTextColor={theme.textDim}
                      autoCapitalize="none"
                      keyboardType={link.type === 'email' ? 'email-address' : 'url'}
                    />
                    <View style={styles.expandActions}>
                      <View style={styles.activeRow}>
                        <Text style={[styles.activeLabel, { color: theme.text }]}>{t.active}</Text>
                        <TouchableOpacity
                          onPress={() => updateLink(link.id, { isActive: !link.isActive })}
                          style={[styles.toggleChip, { backgroundColor: link.isActive ? theme.primary + '33' : theme.surface2, borderColor: theme.primary + '55' }]}
                        >
                          <View style={[styles.toggleDot, { backgroundColor: link.isActive ? theme.primary : theme.textDim }]} />
                          <Text style={[styles.toggleChipText, { color: link.isActive ? theme.primary : theme.textDim }]}>
                            {link.isActive ? t.on : t.off}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      {link.url ? (
                        <TouchableOpacity
                          onPress={() => openLink(link.url, link.type)}
                          style={[styles.openFullBtn, { backgroundColor: TYPE_COLORS[link.type] + '22', borderColor: TYPE_COLORS[link.type] + '66' }]}
                        >
                          <MaterialIcons name="open-in-new" size={14} color={TYPE_COLORS[link.type]} />
                          <Text style={[styles.openFullText, { color: TYPE_COLORS[link.type] }]}>{t.openLink}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countText: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: 14, gap: 8 },
  infoCard: { borderRadius: 6, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10, alignItems: 'flex-start', marginBottom: 4 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17 },
  linkCard: { borderRadius: 6, borderWidth: 1, overflow: 'hidden' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 },
  slotNum: { width: 34, height: 34, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  slotNumText: { fontSize: 12, fontWeight: '800' },
  typeIcon: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  linkLabel: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  linkUrl: { fontSize: 10, letterSpacing: 0.3 },
  openBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  expandedArea: { borderTopWidth: 1, padding: 12 },
  fieldLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 8, textTransform: 'uppercase' },
  fieldInput: { borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 13, marginBottom: 4 },
  typeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, borderWidth: 1 },
  typeBtnText: { fontSize: 10, fontWeight: '600' },
  expandActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeLabel: { fontSize: 13, fontWeight: '500' },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  toggleDot: { width: 7, height: 7, borderRadius: 4 },
  toggleChipText: { fontSize: 11, fontWeight: '700' },
  openFullBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 4, borderWidth: 1 },
  openFullText: { fontSize: 12, fontWeight: '600' },
});
