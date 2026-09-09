import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { LauncherTheme } from '@/constants/launchers';

type Props = {
  texts: string[];
  theme: LauncherTheme;
};

export function BreakingBanner({ texts, theme }: Props) {
  const scaleY = useRef(new Animated.Value(0)).current;
  const [currentText, setCurrentText] = useState(texts[0] || '');
  const [idxRef] = useState({ current: 0 });
  const [visible, setVisible] = useState(false);
  const tickerX = useRef(new Animated.Value(0)).current;
  const screenW = Dimensions.get('window').width;
  const tickerAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const showBanner = () => {
    const text = texts[idxRef.current % Math.max(1, texts.length)];
    idxRef.current += 1;
    setCurrentText(text);
    setVisible(true);

    Animated.timing(scaleY, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      tickerX.setValue(screenW);
      if (tickerAnimRef.current) tickerAnimRef.current.stop();
      const anim = Animated.timing(tickerX, {
        toValue: -(screenW * 2),
        duration: 9000,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      tickerAnimRef.current = anim;
      anim.start(() => {
        Animated.timing(scaleY, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setVisible(false);
        });
      });
    });
  };

  useEffect(() => {
    if (texts.length === 0) return;
    const timeout = setTimeout(showBanner, 4000);
    const interval = setInterval(showBanner, 28000);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [texts]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.banner, { scaleY, backgroundColor: theme.primary }]}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>⚡ BREAKING</Text>
      </View>
      <View style={styles.scroll}>
        <Animated.Text numberOfLines={1} style={[styles.text, { transform: [{ translateX: tickerX }] }]}>
          {currentText}
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 32,
    overflow: 'hidden',
    marginBottom: 3,
  },
  tag: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.15)',
  },
  tagText: { color: '#fff', fontWeight: '700', fontSize: 11, letterSpacing: 1.5 },
  scroll: { flex: 1, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 8 },
  text: { color: '#fff', fontSize: 12, fontWeight: '600', letterSpacing: 1, whiteSpace: 'nowrap' },
});
