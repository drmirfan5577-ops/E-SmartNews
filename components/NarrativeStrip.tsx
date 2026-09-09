import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { LauncherTheme } from '@/constants/launchers';
import { NARRATIVES } from '@/constants/theme';

type Props = { theme: LauncherTheme };

export function NarrativeStrip({ theme }: Props) {
  const screenW = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(screenW)).current;
  const [contentW, setContentW] = useState(screenW * 5);
  const mountedRef = useRef(true);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const run = () => {
      if (!mountedRef.current) return;
      translateX.setValue(screenW);
      const dist = contentW + screenW;
      const dur = Math.max(22000, dist * 22);
      const anim = Animated.timing(translateX, {
        toValue: -contentW, duration: dur, easing: Easing.linear, useNativeDriver: true,
      });
      animRef.current = anim;
      anim.start(({ finished }) => { if (finished && mountedRef.current) run(); });
    };
    run();
    return () => { mountedRef.current = false; animRef.current?.stop(); };
  }, [contentW, screenW]);

  const glowBg = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${theme.background}FF`, `${theme.gold}18`],
  });

  return (
    <Animated.View style={[styles.strip, { backgroundColor: glowBg, borderBottomColor: theme.gold + '55' }]}>
      <View style={[styles.edgeFade, styles.edgeLeft, { backgroundColor: theme.background, pointerEvents: 'none' }]} />
      <Animated.View
        style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateX }] }}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          if (w > 100 && Math.abs(w - contentW) > 50) setContentW(w);
        }}
      >
        {[...NARRATIVES, ...NARRATIVES].map((text, i) => (
          <View key={i} style={styles.segment}>
            <Text style={[styles.star, { color: theme.primary }]}>✦</Text>
            <Text style={[styles.text, { color: theme.gold }]}>{text}</Text>
            <Text style={[styles.divider, { color: theme.primary + '80' }]}>  ◈  </Text>
          </View>
        ))}
      </Animated.View>
      <View style={[styles.edgeFade, styles.edgeRight, { backgroundColor: theme.background, pointerEvents: 'none' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: {
    height: 26, overflow: 'hidden', borderBottomWidth: 1,
    flexDirection: 'row', alignItems: 'center', position: 'relative',
  },
  segment: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  star: { fontSize: 9, marginRight: 5 },
  divider: { fontSize: 10 },
  text: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.3, textTransform: 'uppercase',
    textShadowColor: 'rgba(212,160,32,0.6)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 5,
  },
  edgeFade: { position: 'absolute', top: 0, bottom: 0, width: 22, zIndex: 2, opacity: 0.9 },
  edgeLeft: { left: 0 },
  edgeRight: { right: 0 },
});
