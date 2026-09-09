import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { AdminCard } from '@/components/AdminCard';
import T from '@/constants/translations';

export default function AdminDashboard() {
  const { isAdminLoggedIn, logout, activeLauncher, language, newsItems, subAdmins, publishedNews, ads } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const handleLogout = () => { logout(); router.replace('/'); };

  const features = [
    { icon: 'article' as const, title: 'News Editor', desc: 'Add/edit/delete/publish news items', route: '/admin/news', badge: `${publishedNews.length}/${newsItems.length}` },
    { icon: 'flash-on' as const, title: '⚡ Flash News', desc: '30+ dramatic flash overlay effects', route: '/admin/flash' },
    { icon: 'live-tv' as const, title: 'Ticker & Breaking', desc: 'Edit EN/UR ticker and breaking news', route: '/admin/tickers' },
    { icon: 'subtitles' as const, title: 'Subtitles Manager', desc: 'Fonts, colors, speed, per-language customization', route: '/admin/subtitles' },
    { icon: 'music-note' as const, title: 'Music Manager', desc: '10 built-in + 5 custom tracks + equalizer', route: '/admin/music' },
    { icon: 'ad-units' as const, title: 'Ads Manager 24/7', desc: 'Create/publish image, video & text ads', route: '/admin/ads', badge: ads.filter(a => a.isEnabled && a.isPublished).length > 0 ? `${ads.filter(a => a.isEnabled && a.isPublished).length} Live` : undefined },
    { icon: 'play-circle' as const, title: 'Intro / Outro', desc: 'Upload & configure channel intro and outro videos', route: '/admin/intro-outro' },
    { icon: 'tune' as const, title: 'Display Filters', desc: 'Brightness, contrast, effects, aspect ratio', route: '/admin/filters' },
    { icon: 'link' as const, title: 'Links Manager', desc: '20 slots for emails, websites, social media', route: '/admin/links' },
    { icon: 'palette' as const, title: 'Launchers', desc: '10 professional broadcast themes', route: '/admin/launchers' },
    { icon: 'group' as const, title: 'Multi-Admin', desc: 'Manage sub-admins and permissions', route: '/admin/admins', badge: subAdmins.filter(s => s.isActive).length > 0 ? `${subAdmins.filter(s => s.isActive).length} Active` : undefined },
    { icon: 'settings' as const, title: 'Settings', desc: 'Language, logo, password, music toggle', route: '/admin/settings' },
    { icon: 'info' as const, title: 'About & Legal', desc: 'Disclaimer, privacy policy, broadcasting standards', route: '/admin/about' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.backBtn}>
            <MaterialIcons name="tv" size={20} color={theme.textMuted} />
            <Text style={[styles.backText, { color: theme.textMuted }]}>Channel</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>ADMIN PANEL</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <MaterialIcons name="logout" size={18} color={theme.primary} />
            <Text style={[styles.logoutText, { color: theme.primary }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Security badge */}
        <View style={[styles.secBadge, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
          <MaterialIcons name="shield" size={13} color={theme.primary} />
          <Text style={[styles.secText, { color: theme.primary }]}>
            ALL FEATURES PASSWORD PROTECTED — ADMIN ACCESS ONLY
          </Text>
          <Text style={styles.launcherEmoji}>{LAUNCHERS[activeLauncher]?.emoji}</Text>
        </View>

        {/* Live stats strip */}
        <View style={[styles.statsRow, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '22' }]}>
          {[
            { label: 'LIVE NEWS', value: String(publishedNews.length), color: theme.primary },
            { label: 'TOTAL NEWS', value: String(newsItems.length), color: theme.gold },
            { label: 'LIVE ADS', value: String(ads.filter(a => a.isEnabled && a.isPublished).length), color: '#ff9800' },
            { label: 'SUB-ADMINS', value: String(subAdmins.filter(s => s.isActive).length), color: theme.textMuted },
          ].map(s => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {features.map(f => (
            <AdminCard
              key={f.route}
              icon={f.icon}
              title={f.title}
              description={f.desc}
              theme={theme}
              badge={f.badge}
              onPress={() => router.push(f.route as any)}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { fontSize: 13 },
  title: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logoutText: { fontSize: 12, fontWeight: '600' },
  secBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 14, marginTop: 10, marginBottom: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 6, borderWidth: 1 },
  secText: { flex: 1, fontSize: 9.5, fontWeight: '600', letterSpacing: 0.8 },
  launcherEmoji: { fontSize: 16 },
  statsRow: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: 8 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 7.5, letterSpacing: 1.5, marginTop: 2 },
  scroll: { padding: 16 },
});
