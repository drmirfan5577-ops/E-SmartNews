import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { LauncherTheme } from '@/constants/launchers';

type Props = {
  text: string;
  isUrdu?: boolean;
  speed?: number;
  theme: LauncherTheme;
};

export function TickerStrip({ text, isUrdu = false, speed = 40, theme }: Props) {
  const screenW = Dimensions.get('window').width;
  const [contentW, setContentW] = useState(screenW * 5);
  const translateX = useRef(new Animated.Value(isUrdu ? -screenW * 5 : screenW)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const mountedRef = useRef(true);

  const startAnim = useCallback((cw: number) => {
    if (animRef.current) animRef.current.stop();
    const from = isUrdu ? -cw : screenW;
    const to = isUrdu ? screenW : -cw;
    const dist = Math.max(cw + screenW, 500);
    const dur = Math.max(12000, (dist / Math.max(1, speed)) * 900);

    const run = () => {
      if (!mountedRef.current) return;
      translateX.setValue(from);
      const anim = Animated.timing(translateX, {
        toValue: to,
        duration: dur,
        useNativeDriver: true,
        easing: Easing.linear,
      });
      animRef.current = anim;
      anim.start(({ finished }) => {
        if (finished && mountedRef.current) run();
      });
    };
    run();
  }, [isUrdu, screenW, speed, translateX]);

  useEffect(() => {
    mountedRef.current = true;
    startAnim(contentW);
    return () => {
      mountedRef.current = false;
      if (animRef.current) animRef.current.stop();
    };
  }, [startAnim, contentW]);

  const displayText = `${text}  ●  ${text}  ●  `;
  const labelBg = isUrdu ? theme.primary : theme.gold;
  const stripBg = isUrdu ? '#070b18' : theme.surface;
  const labelColor = isUrdu ? '#fff' : theme.background;
  const tickColor = isUrdu ? '#c8b898' : theme.text;

  return (
    <View style={[styles.strip, { backgroundColor: stripBg, borderTopColor: isUrdu ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.07)' }]}>
      <View style={[styles.label, { backgroundColor: labelBg }]}>
        <Text style={[styles.labelText, { color: labelColor }]} numberOfLines={1}>
          {isUrdu ? 'براہ راست' : 'EN LIVE'}
        </Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={{ flexDirection: 'row', transform: [{ translateX }] }}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 50 && Math.abs(w - contentW) > 20) setContentW(w);
          }}
        >
          <Text
            numberOfLines={1}
            style={[styles.tickerText, { color: tickColor }, isUrdu && styles.urduText]}
          >
            {displayText}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 30,
    overflow: 'hidden',
    borderTopWidth: 1,
  },
  label: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 72,
    flexShrink: 0,
  },
  labelText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  track: { flex: 1, overflow: 'hidden', justifyContent: 'center', position: 'relative' },
  tickerText: { fontSize: 11, letterSpacing: 1.2, fontWeight: '400' },
  urduText: { textAlign: 'right' },
});
