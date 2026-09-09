import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Linking, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { AdItem } from '@/constants/theme';
import { LauncherTheme } from '@/constants/launchers';

type Props = {
  ads: AdItem[];
  theme: LauncherTheme;
};

export function AdsPanel({ ads, theme }: Props) {
  const activeAds = ads.filter(a => a.isEnabled && a.isPublished);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  const currentAd = activeAds[currentIdx % Math.max(1, activeAds.length)];

  useEffect(() => {
    if (!currentAd) return;
    const duration = Math.max(5, currentAd.durationSec) * 1000;
    const id = setTimeout(() => {
      // Fade out
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setCurrentIdx(p => (p + 1) % Math.max(1, activeAds.length));
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, duration);
    return () => clearTimeout(id);
  }, [currentIdx, activeAds.length, currentAd]);

  // Glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (!activeAds.length) {
    return (
      <View style={[styles.emptyPanel, { backgroundColor: 'rgba(0,0,0,0.6)', borderTopColor: theme.primary + '33' }]}>
        <MaterialIcons name="ad-units" size={14} color={theme.textDim} />
        <Text style={[styles.emptyText, { color: theme.textDim }]}>ADS SPACE — SMART WORLD NEWS</Text>
        <Animated.View style={[styles.adsDot, { backgroundColor: theme.primary, opacity: glowAnim }]} />
      </View>
    );
  }

  if (!currentAd) return null;

  const screenW = Math.max(1, Dimensions.get('window').width);

  const openLink = async () => {
    if (!currentAd.link) return;
    try {
      const url = currentAd.link.startsWith('http') ? currentAd.link : `https://${currentAd.link}`;
      await Linking.openURL(url);
    } catch {}
  };

  return (
    <TouchableOpacity onPress={openLink} activeOpacity={currentAd.link ? 0.85 : 1}>
      <Animated.View style={[styles.panel, { opacity: fadeAnim, borderTopColor: theme.primary + '55' }]}>
        <LinearGradient
          colors={[currentAd.bgColor || 'rgba(10,10,20,0.95)', 'rgba(0,0,0,0.98)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        />

        {/* AD badge */}
        <View style={styles.adBadge}>
          <Animated.View style={[styles.adDot, { backgroundColor: theme.gold, opacity: glowAnim }]} />
          <Text style={[styles.adLabel, { color: theme.gold }]}>AD</Text>
        </View>

        {/* Content */}
        <View style={styles.contentRow}>
          {/* Media thumbnail */}
          {currentAd.type === 'image' && currentAd.mediaUri ? (
            <Image source={{ uri: currentAd.mediaUri }} style={styles.adThumb} contentFit="cover" />
          ) : currentAd.type === 'video' && currentAd.mediaUri ? (
            <View style={[styles.adThumb, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialIcons name="play-circle-filled" size={28} color={theme.primary} />
            </View>
          ) : null}

          {/* Text content */}
          <View style={styles.adText}>
            <Text style={[styles.adTitle, { color: currentAd.textColor || '#fff' }]} numberOfLines={1}>
              {currentAd.title}
            </Text>
            {currentAd.text ? (
              <Text style={[styles.adBody, { color: (currentAd.textColor || '#fff') + 'AA' }]} numberOfLines={2}>
                {currentAd.text}
              </Text>
            ) : null}
          </View>

          {/* CTA */}
          {currentAd.link ? (
            <View style={[styles.ctaBtn, { backgroundColor: theme.primary }]}>
              <Text style={styles.ctaText}>→</Text>
            </View>
          ) : null}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${((currentIdx % activeAds.length) + 1) / activeAds.length * 100}%` }]} />
        </View>

        {/* Dots */}
        {activeAds.length > 1 && (
          <View style={styles.dotsRow}>
            {activeAds.map((_, i) => (
              <View key={i} style={[styles.adsDotSmall, { backgroundColor: i === currentIdx % activeAds.length ? theme.gold : 'rgba(255,255,255,0.2)' }]} />
            ))}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '100%', minHeight: 52, borderTopWidth: 1, position: 'relative', overflow: 'hidden', paddingVertical: 8,
  },
  emptyPanel: {
    height: 28, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  emptyText: { fontSize: 8.5, letterSpacing: 2, fontWeight: '600' },
  adBadge: { position: 'absolute', top: 6, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, zIndex: 5 },
  adDot: { width: 5, height: 5, borderRadius: 3 },
  adLabel: { fontSize: 7, fontWeight: '800', letterSpacing: 2 },
  adsDot: { width: 6, height: 6, borderRadius: 3 },
  contentRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 36, paddingTop: 4, gap: 10 },
  adThumb: { width: 50, height: 36, borderRadius: 4, overflow: 'hidden' },
  adText: { flex: 1 },
  adTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  adBody: { fontSize: 9.5, marginTop: 2, lineHeight: 14 },
  ctaBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 6, marginHorizontal: 8 },
  progressFill: { height: 2, borderRadius: 1 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 4 },
  adsDotSmall: { width: 4, height: 4, borderRadius: 2 },
});
