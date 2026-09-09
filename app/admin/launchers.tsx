import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS, LauncherTheme } from '@/constants/launchers';
import T from '@/constants/translations';

const ANIMATION_LABELS: Record<string, string> = {
  slide: 'Slide Sweep', fade: 'Smooth Fade', sparkle: 'Sparkle Burst',
  wave: 'Wave Motion', flip: 'Card Flip', zoom: 'Zoom Pulse',
  pulse: 'Ember Pulse', glitch: 'Neon Glitch', typewriter: 'Typewriter',
  matrix: 'Matrix Rain',
};

const LAYOUT_LABELS: Record<string, string> = {
  classic: 'Classic Strip', centered: 'Centered Logo', editorial: 'Editorial Bold',
  split: 'Split Screen', overlay: 'Dark Overlay', glass: 'Glass Morphic',
  bold: 'Diagonal Bold', neon: 'Terminal Neon', broadcast: 'Emergency Broadcast',
  minimal: 'Industrial Grid',
};

function LauncherPreviewCard({ launcher, isActive, onSelect }: { launcher: LauncherTheme; isActive: boolean; onSelect: () => void }) {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.9, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.2, duration: 1800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isActive]);

  const screenW = Dimensions.get('window').width;
  const cardW = screenW - 28;

  // Unique mini-preview design per layout type
  const renderMiniPreview = () => {
    const h = launcher.headerLayout;
    const bgColors = [launcher.background, launcher.surface] as [string, string];

    return (
      <View style={[styles.miniPreview, { backgroundColor: launcher.background, borderColor: launcher.primary + '60', width: 90, height: 56, overflow: 'hidden' }]}>
        <LinearGradient colors={[launcher.primary + '30', 'transparent']} style={StyleSheet.absoluteFillObject} />

        {/* Top bar */}
        <View style={[styles.miniBar, {
          backgroundColor: h === 'neon' ? '#000' : h === 'glass' ? 'rgba(255,255,255,0.08)' : launcher.surface,
          borderBottomColor: launcher.primary,
          height: h === 'bold' ? 16 : h === 'minimal' ? 10 : 13,
        }]}>
          {h === 'centered' ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <View style={[styles.miniDot, { backgroundColor: launcher.primary, width: 8, height: 8, borderRadius: 4 }]} />
            </View>
          ) : h === 'editorial' ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, gap: 2 }}>
              <View style={[styles.miniBlock, { backgroundColor: launcher.gold, width: 14 }]} />
              <View style={[styles.miniBlock, { backgroundColor: launcher.primary, flex: 1 }]} />
            </View>
          ) : h === 'neon' ? (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, gap: 2 }}>
              <View style={[styles.miniDot, { backgroundColor: launcher.primary }]} />
              <View style={[styles.miniBlock, { backgroundColor: launcher.primary + '88', flex: 1, height: 2 }]} />
            </View>
          ) : h === 'split' ? (
            <View style={{ flex: 1, flexDirection: 'row', gap: 1 }}>
              <View style={{ flex: 1, backgroundColor: launcher.primary + '66' }} />
              <View style={{ flex: 1, backgroundColor: launcher.surface }} />
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, gap: 2 }}>
              <View style={[styles.miniDot, { backgroundColor: launcher.primary }]} />
              <View style={[styles.miniBlock, { backgroundColor: launcher.text + '44', flex: 1, height: 2 }]} />
              <View style={[styles.miniDot, { backgroundColor: launcher.gold, width: 4, height: 4, borderRadius: 2 }]} />
            </View>
          )}
        </View>

        {/* Content area */}
        <View style={{ flex: 1, flexDirection: 'row', gap: 2, padding: 3 }}>
          <View style={{ flex: 1 }}>
            {h === 'broadcast' ? (
              <LinearGradient colors={[launcher.primary + '88', launcher.background]} style={{ flex: 1, borderRadius: 2 }}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <View style={[{ width: 12, height: 12, backgroundColor: launcher.primary, borderRadius: 6 }]} />
                </View>
              </LinearGradient>
            ) : (
              <View style={{ flex: 1, backgroundColor: launcher.surface2, borderRadius: 2 }}>
                <View style={[styles.miniImgBar, { backgroundColor: launcher.primary + '44' }]} />
                <View style={[styles.miniImgBar, { backgroundColor: launcher.primary + '22', marginTop: 2 }]} />
              </View>
            )}
          </View>
          {h === 'split' && (
            <View style={{ width: 28, backgroundColor: launcher.primary + '22', borderRadius: 2 }} />
          )}
        </View>

        {/* Bottom ticker */}
        <View style={[styles.miniTicker, { backgroundColor: launcher.primary }]}>
          <View style={[{ height: 2, backgroundColor: launcher.gold, opacity: 0.8 }]} />
        </View>

        {/* Active glow overlay */}
        {isActive && (
          <Animated.View style={[StyleSheet.absoluteFillObject, {
            borderWidth: 2, borderColor: launcher.primary,
            borderRadius: 4, opacity: pulseAnim,
          }]} pointerEvents="none" />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={[styles.launcherCard, {
        backgroundColor: isActive ? launcher.primary + '1A' : 'rgba(255,255,255,0.04)',
        borderColor: isActive ? launcher.primary : 'rgba(255,255,255,0.1)',
        borderWidth: isActive ? 2 : 1,
      }]}
    >
      {/* Animated bg gradient */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: isActive ? glowAnim : 0.4 }]} pointerEvents="none">
        <LinearGradient
          colors={[launcher.primary + '20', launcher.gold + '08', 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      <View style={styles.cardInner}>
        {/* Left: mini preview */}
        {renderMiniPreview()}

        {/* Middle: info */}
        <View style={{ flex: 1, paddingLeft: 10, gap: 3 }}>
          <View style={styles.nameRow}>
            <Text style={styles.emoji}>{launcher.emoji}</Text>
            <Text style={[styles.launcherName, { color: launcher.text }]}>{launcher.name}</Text>
            {isActive && (
              <View style={[styles.activeBadge, { backgroundColor: launcher.primary }]}>
                <MaterialIcons name="radio-button-checked" size={8} color="#fff" />
                <Text style={styles.activeBadgeText}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={[styles.launcherNameUr, { color: launcher.textMuted }]}>{launcher.nameUr}</Text>

          {/* Tags */}
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: launcher.primary + '25', borderColor: launcher.primary + '55' }]}>
              <Text style={[styles.tagText, { color: launcher.primary }]}>
                {LAYOUT_LABELS[launcher.headerLayout] ?? launcher.headerLayout}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: launcher.gold + '20', borderColor: launcher.gold + '44' }]}>
              <Text style={[styles.tagText, { color: launcher.gold }]}>
                {ANIMATION_LABELS[launcher.animationType] ?? launcher.animationType}
              </Text>
            </View>
          </View>

          <Text style={[styles.launcherDesc, { color: launcher.textDim }]} numberOfLines={2}>
            {launcher.description}
          </Text>
        </View>

        {/* Right: swatches + button */}
        <View style={styles.rightCol}>
          <View style={styles.swatchStack}>
            <View style={[styles.swatch, { backgroundColor: launcher.primary, shadowColor: launcher.primary }]} />
            <View style={[styles.swatch, { backgroundColor: launcher.gold }]} />
            <View style={[styles.swatch, { backgroundColor: launcher.background, borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1 }]} />
          </View>

          {isActive ? (
            <View style={[styles.activeIndicator, { borderColor: launcher.primary + '66' }]}>
              <MaterialIcons name="check-circle" size={18} color={launcher.primary} />
              <Text style={[styles.activeText, { color: launcher.primary }]}>Active</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onSelect}
              style={[styles.selectBtn, { backgroundColor: launcher.primary + '28', borderColor: launcher.primary + '88' }]}
            >
              <Text style={[styles.selectBtnText, { color: launcher.primary }]}>Apply</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Bottom accent bar */}
      {isActive && (
        <View style={[styles.bottomBar, { backgroundColor: launcher.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export default function LaunchersManager() {
  const { isAdminLoggedIn, activeLauncher, setActiveLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>CHANNEL LAUNCHERS</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <LinearGradient colors={[theme.primary + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <MaterialIcons name="palette" size={20} color={theme.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: theme.gold }]}>10 UNIQUE BROADCAST THEMES</Text>
              <Text style={[styles.infoDesc, { color: theme.textDim }]}>
                {language === 'ur'
                  ? 'ہر تھیم کا اپنا الگ لے آؤٹ، اینیمیشن، فلٹرز اور کلر پیلٹ ہے۔ فوری لائیو ہو جائے گا۔'
                  : 'Each launcher has a unique layout, animation style, card design and color identity. Tap "Apply" to go live instantly.'}
              </Text>
            </View>
          </View>

          {LAUNCHERS.map((launcher, idx) => (
            <LauncherPreviewCard
              key={launcher.id}
              launcher={launcher}
              isActive={activeLauncher === idx}
              onSelect={() => { setActiveLauncher(idx); }}
            />
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  scroll: { padding: 14, gap: 10 },
  infoCard: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 4, overflow: 'hidden', position: 'relative', alignItems: 'flex-start' },
  infoTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 3 },
  infoDesc: { fontSize: 10, lineHeight: 15 },
  launcherCard: { borderRadius: 10, overflow: 'hidden', position: 'relative', marginBottom: 2 },
  cardInner: { flexDirection: 'row', alignItems: 'center', gap: 0, padding: 12 },
  miniPreview: { borderRadius: 4, borderWidth: 1, overflow: 'hidden', flexShrink: 0 },
  miniBar: { borderBottomWidth: 1, overflow: 'hidden' },
  miniDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  miniBlock: { height: 3, borderRadius: 1, backgroundColor: '#fff' },
  miniImgBar: { height: 4, borderRadius: 1, marginHorizontal: 2, marginTop: 2 },
  miniTicker: { height: 5 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  emoji: { fontSize: 18 },
  launcherName: { fontSize: 13, fontWeight: '800', letterSpacing: 1.2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  activeBadgeText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  launcherNameUr: { fontSize: 10, letterSpacing: 0.3 },
  tagRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  tagText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  launcherDesc: { fontSize: 9.5, lineHeight: 14, letterSpacing: 0.2 },
  rightCol: { alignItems: 'center', gap: 8, paddingLeft: 8 },
  swatchStack: { gap: 3 },
  swatch: { width: 16, height: 16, borderRadius: 8, shadowOffset: { width: 0, height: 0 }, shadowRadius: 3, shadowOpacity: 0.7, elevation: 3 },
  activeIndicator: { alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 4, borderWidth: 1 },
  activeText: { fontSize: 8.5, fontWeight: '700' },
  selectBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1 },
  selectBtnText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  bottomBar: { height: 3, width: '100%' },
});
