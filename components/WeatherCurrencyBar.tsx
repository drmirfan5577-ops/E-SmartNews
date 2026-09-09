import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LauncherTheme } from '@/constants/launchers';
import { LiveData } from '@/services/weather';

type Props = {
  liveData: LiveData;
  theme: LauncherTheme;
  onRefresh?: () => void;
};

export function WeatherCurrencyBar({ liveData, theme, onRefresh }: Props) {
  const screenW = Dimensions.get('window').width;
  const translateX = useRef(new Animated.Value(screenW)).current;
  const [contentW, setContentW] = useState(screenW * 7);
  const mountedRef = useRef(true);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [showWeather, setShowWeather] = useState(true);

  // Alternate weather/currency every 12 seconds
  useEffect(() => {
    const id = setInterval(() => setShowWeather(p => !p), 12000);
    return () => clearInterval(id);
  }, []);

  // Re-run animation when mode switches
  useEffect(() => {
    mountedRef.current = true;
    const run = () => {
      if (!mountedRef.current) return;
      translateX.setValue(screenW);
      const dist = contentW + screenW;
      const dur = Math.max(20000, dist * 18);
      const anim = Animated.timing(translateX, {
        toValue: -contentW, duration: dur, easing: Easing.linear, useNativeDriver: true,
      });
      animRef.current = anim;
      anim.start(({ finished }) => { if (finished && mountedRef.current) run(); });
    };
    run();
    return () => { mountedRef.current = false; animRef.current?.stop(); };
  }, [contentW, screenW, showWeather]);

  const items = showWeather
    ? liveData.weather.map(w => `${w.icon} ${w.city} ${w.temp} · ${w.condition}`)
    : liveData.currencies.map(c => `${c.flag} ${c.code} = PKR ${c.rate}`);

  const bgLabel = showWeather ? '#003820' : '#001840';
  const textColor = showWeather ? '#7fff9a' : '#7fd4ff';
  const labelText = showWeather ? '🌍 WEATHER' : '💹 RATES';
  const lastUpdate = liveData.lastUpdated > 0
    ? new Date(liveData.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <View style={[styles.bar, { backgroundColor: theme.background, borderBottomColor: theme.primary + '33' }]}>
      <View style={[styles.label, { backgroundColor: bgLabel }]}>
        <Text style={styles.labelText}>{labelText}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={{ flexDirection: 'row', alignItems: 'center', transform: [{ translateX }] }}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 100 && Math.abs(w - contentW) > 50) setContentW(w);
          }}
        >
          {[...items, ...items, ...items].map((item, i) => (
            <Text key={i} style={[styles.item, { color: textColor }]}>
              {item}<Text style={styles.sep}>   ●   </Text>
            </Text>
          ))}
        </Animated.View>
      </View>
      <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={[styles.timeText, { color: theme.textDim }]}>{lastUpdate}</Text>
        <MaterialIcons name="refresh" size={11} color={theme.textDim} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch', height: 24, overflow: 'hidden', borderBottomWidth: 1 },
  label: { paddingHorizontal: 8, justifyContent: 'center', minWidth: 80, flexShrink: 0 },
  labelText: { fontSize: 8, fontWeight: '800', letterSpacing: 1.2, color: '#fff' },
  track: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  item: { fontSize: 10, letterSpacing: 0.7, fontWeight: '500', paddingHorizontal: 2 },
  sep: { color: 'rgba(255,255,255,0.25)' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, flexShrink: 0 },
  timeText: { fontSize: 8, letterSpacing: 0.5 },
});
