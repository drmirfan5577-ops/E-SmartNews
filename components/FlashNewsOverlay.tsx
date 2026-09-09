import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Animated, StyleSheet, Dimensions, Easing, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { LauncherTheme } from '@/constants/launchers';

export type FlashEffect =
  | 'redAlert' | 'whiteFlash' | 'matrixGreen' | 'goldBurst' | 'blueShock'
  | 'purplePulse' | 'crimsonDrop' | 'neonCyan' | 'orangeBlaze' | 'rocketSlide'
  | 'thunderBolt' | 'radicalZoom' | 'tvStatic' | 'bloodMoon' | 'iceShard'
  | 'sunFlare' | 'digitalRain' | 'fireAlert' | 'ghostPulse' | 'vortex'
  | 'satellite' | 'nuclearGlow' | 'lasers' | 'siren' | 'countdown'
  | 'cosmicWave' | 'hologram' | 'strobeRed' | 'darkSlide' | 'goldExplosion';

type Props = {
  text: string;
  effect: FlashEffect;
  theme: LauncherTheme;
  onDone?: () => void;
  duration?: number;
};

const EFFECT_CONFIGS: Record<FlashEffect, {
  label: string; emoji: string;
  bgColors: [string, string, ...string[]];
  textColor: string; badgeBg: string; badgeText: string;
  gradientDir?: { start: { x: number; y: number }; end: { x: number; y: number } };
}> = {
  redAlert:      { label: '🔴 RED ALERT',       emoji: '🚨', bgColors: ['#c8102e', '#7a0510', '#c8102e'], textColor: '#fff', badgeBg: '#ffffff', badgeText: '#c8102e' },
  whiteFlash:    { label: '⚡ FLASH',            emoji: '⚡', bgColors: ['#ffffff', '#dddddd', '#ffffff'], textColor: '#111', badgeBg: '#c8102e', badgeText: '#fff' },
  matrixGreen:   { label: '🟢 MATRIX',           emoji: '💾', bgColors: ['#001100', '#003300', '#001100'], textColor: '#00ff41', badgeBg: '#00ff41', badgeText: '#001100' },
  goldBurst:     { label: '🥇 GOLD BURST',       emoji: '✨', bgColors: ['#7a5000', '#d4a020', '#7a5000'], textColor: '#fff9e6', badgeBg: '#c8102e', badgeText: '#fff', gradientDir: { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } } },
  blueShock:     { label: '🔵 BLUE SHOCK',       emoji: '💥', bgColors: ['#001840', '#0040a0', '#001840'], textColor: '#a0c8ff', badgeBg: '#4488ff', badgeText: '#fff' },
  purplePulse:   { label: '🟣 PURPLE PULSE',     emoji: '🔮', bgColors: ['#200030', '#7000c0', '#200030'], textColor: '#e0b0ff', badgeBg: '#a040ff', badgeText: '#fff' },
  crimsonDrop:   { label: '🩸 CRIMSON DROP',     emoji: '🩸', bgColors: ['#3a0008', '#cc0025', '#3a0008'], textColor: '#ffcccc', badgeBg: '#ff0033', badgeText: '#fff' },
  neonCyan:      { label: '💎 NEON CYAN',        emoji: '💎', bgColors: ['#001a1a', '#004444', '#001a1a'], textColor: '#00ffee', badgeBg: '#00ffee', badgeText: '#001a1a' },
  orangeBlaze:   { label: '🔥 ORANGE BLAZE',     emoji: '🔥', bgColors: ['#3a1000', '#c84000', '#3a1000'], textColor: '#ffcc88', badgeBg: '#ff6600', badgeText: '#fff' },
  rocketSlide:   { label: '🚀 ROCKET SLIDE',     emoji: '🚀', bgColors: ['#050510', '#0d0d50', '#050510'], textColor: '#aabbff', badgeBg: '#c8102e', badgeText: '#fff', gradientDir: { start: { x: 1, y: 0 }, end: { x: 0, y: 1 } } },
  thunderBolt:   { label: '⚡ THUNDER',           emoji: '🌩️', bgColors: ['#111100', '#333300', '#111100'], textColor: '#ffff44', badgeBg: '#ffff00', badgeText: '#000' },
  radicalZoom:   { label: '🔍 RADICAL ZOOM',     emoji: '🔭', bgColors: ['#0a0a0a', '#2a2a2a', '#0a0a0a'], textColor: '#ff4400', badgeBg: '#ff4400', badgeText: '#fff' },
  tvStatic:      { label: '📺 TV STATIC',        emoji: '📺', bgColors: ['#111111', '#222222', '#111111'], textColor: '#eeeeee', badgeBg: '#444444', badgeText: '#fff' },
  bloodMoon:     { label: '🌕 BLOOD MOON',       emoji: '🌕', bgColors: ['#1a0000', '#660000', '#1a0000'], textColor: '#ffaaaa', badgeBg: '#8b0000', badgeText: '#fff' },
  iceShard:      { label: '❄️ ICE SHARD',        emoji: '❄️', bgColors: ['#001128', '#004488', '#001128'], textColor: '#cceeff', badgeBg: '#0088cc', badgeText: '#fff' },
  sunFlare:      { label: '☀️ SUN FLARE',        emoji: '☀️', bgColors: ['#7a4000', '#e0b020', '#7a4000'], textColor: '#ffffff', badgeBg: '#fff', badgeText: '#c8102e', gradientDir: { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } } },
  digitalRain:   { label: '💻 DIGITAL RAIN',     emoji: '💻', bgColors: ['#000a00', '#002200', '#000a00'], textColor: '#00cc44', badgeBg: '#00cc44', badgeText: '#000' },
  fireAlert:     { label: '🔥 FIRE ALERT',       emoji: '🔥', bgColors: ['#1a0000', '#cc2000', '#1a0000'], textColor: '#ffddaa', badgeBg: '#ff3300', badgeText: '#fff' },
  ghostPulse:    { label: '👻 GHOST PULSE',      emoji: '👻', bgColors: ['#080808', '#181818', '#080808'], textColor: 'rgba(255,255,255,0.85)', badgeBg: '#333', badgeText: '#fff' },
  vortex:        { label: '🌀 VORTEX',           emoji: '🌀', bgColors: ['#000022', '#000088', '#000022'], textColor: '#88aaff', badgeBg: '#4466ff', badgeText: '#fff' },
  satellite:     { label: '🛰️ SATELLITE',        emoji: '🛰️', bgColors: ['#000010', '#001040', '#000010'], textColor: '#aaccff', badgeBg: '#c8102e', badgeText: '#fff' },
  nuclearGlow:   { label: '☢️ NUCLEAR GLOW',     emoji: '☢️', bgColors: ['#0a1a00', '#206000', '#0a1a00'], textColor: '#aaff44', badgeBg: '#88ff00', badgeText: '#000' },
  lasers:        { label: '🔆 LASERS',           emoji: '🔆', bgColors: ['#100010', '#500050', '#100010'], textColor: '#ff44ff', badgeBg: '#ff00ff', badgeText: '#fff' },
  siren:         { label: '🚨 SIREN',            emoji: '🚔', bgColors: ['#050020', '#0000cc', '#050020'], textColor: '#ff2222', badgeBg: '#ff0000', badgeText: '#fff' },
  countdown:     { label: '⏱️ COUNTDOWN',        emoji: '⏱️', bgColors: ['#0a0a0a', '#1a1a1a', '#0a0a0a'], textColor: '#ffee00', badgeBg: '#ffee00', badgeText: '#000' },
  cosmicWave:    { label: '🌊 COSMIC WAVE',      emoji: '🌌', bgColors: ['#020010', '#080040', '#020010'], textColor: '#aa88ff', badgeBg: '#6644cc', badgeText: '#fff', gradientDir: { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } },
  hologram:      { label: '📡 HOLOGRAM',         emoji: '📡', bgColors: ['#001820', '#004050', '#001820'], textColor: '#44ffee', badgeBg: '#00ddcc', badgeText: '#000' },
  strobeRed:     { label: '🚨 STROBE RED',       emoji: '🔴', bgColors: ['#cc0020', '#000000', '#cc0020'], textColor: '#ffffff', badgeBg: '#ffffff', badgeText: '#cc0020' },
  darkSlide:     { label: '🌑 DARK SLIDE',       emoji: '🌑', bgColors: ['#000000', '#111111', '#000000'], textColor: '#aaaaaa', badgeBg: '#333333', badgeText: '#fff' },
  goldExplosion: { label: '💥 GOLD EXPLOSION',   emoji: '💛', bgColors: ['#3a2000', '#c08000', '#3a2000'], textColor: '#fff9e0', badgeBg: '#d4a020', badgeText: '#000', gradientDir: { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } } },
};

export const FLASH_EFFECTS = Object.keys(EFFECT_CONFIGS) as FlashEffect[];

// ─── Matrix rain effect characters ──────────────────────────────────────────
const MATRIX_CHARS = '01アイウエオカキクケコ01アイウエオ01';

function MatrixColumn({ color }: { color: string }) {
  const translateY = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: 200, duration: 1200 + Math.random() * 1000, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -200, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={{ transform: [{ translateY }], position: 'absolute' }}>
      {MATRIX_CHARS.split('').slice(0, 6).map((c, i) => (
        <Text key={i} style={{ color, fontSize: 8, opacity: 1 - i * 0.15, fontWeight: '700' }}>{c}</Text>
      ))}
    </Animated.View>
  );
}

// ─── Scanline effect ──────────────────────────────────────────────────────
function ScanlineOverlay() {
  return (
    <View style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' } as any]}>
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} style={[fStyles.scanline, { top: i * 7 }]} />
      ))}
    </View>
  );
}

// ─── Live pulse dot ──────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 2.2, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);
  return (
    <View style={{ position: 'relative', width: 12, height: 12, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color, position: 'absolute', transform: [{ scale }], opacity }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

// ─── Border flash animation ────────────────────────────────────────────────
function FlashBorder({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.15, duration: 350, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={[StyleSheet.absoluteFillObject, { borderWidth: 3, borderColor: color, opacity, pointerEvents: 'none' } as any]}
    />
  );
}

// ─── Scrolling text ticker within flash ────────────────────────────────────
function ScrollingText({ text, color }: { text: string; color: string }) {
  const screenW = Dimensions.get('window').width;
  const tx = useRef(new Animated.Value(screenW)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(tx, { toValue: -screenW * 2, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [text]);
  return (
    <View style={{ overflow: 'hidden', height: 18 }}>
      <Animated.Text
        style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 2, transform: [{ translateX: tx }] }}
        numberOfLines={1}
      >
        {'⚡ ' + text + '   ◉   ' + text + '   ◉   ' + text + ' ⚡'}
      </Animated.Text>
    </View>
  );
}

// ─── Corner accent brackets ────────────────────────────────────────────────
function CornerAccents({ color }: { color: string }) {
  const cornerStyle = (pos: object) => [fStyles.corner, { borderColor: color }, pos];
  return (
    <>
      <View style={cornerStyle({ top: 6, left: 6, borderRightWidth: 0, borderBottomWidth: 0 })} />
      <View style={cornerStyle({ top: 6, right: 6, borderLeftWidth: 0, borderBottomWidth: 0 })} />
      <View style={cornerStyle({ bottom: 6, left: 6, borderRightWidth: 0, borderTopWidth: 0 })} />
      <View style={cornerStyle({ bottom: 6, right: 6, borderLeftWidth: 0, borderTopWidth: 0 })} />
    </>
  );
}

export function FlashNewsOverlay({ text, effect, theme, onDone, duration = 8000 }: Props) {
  const cfg = EFFECT_CONFIGS[effect] ?? EFFECT_CONFIGS.redAlert;
  const screenW = Dimensions.get('window').width;

  const masterOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(-120)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const textSlide = useRef(new Animated.Value(30)).current;

  const [countdown, setCountdown] = useState(Math.ceil(duration / 1000));
  const [strobeOn, setStrobeOn] = useState(true);

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.spring(masterOpacity, { toValue: 1, useNativeDriver: true, tension: 80, friction: 7 }),
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 90, friction: 9 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
      Animated.timing(textSlide, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Strobe effect (for strobeRed, siren)
    let strobeInterval: ReturnType<typeof setInterval> | null = null;
    if (effect === 'strobeRed' || effect === 'siren' || effect === 'tvStatic') {
      strobeInterval = setInterval(() => setStrobeOn(p => !p), 250);
    }

    // Countdown
    const cdInterval = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);

    // Exit
    const exitTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(masterOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(slideY, { toValue: -80, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 600, useNativeDriver: true }),
      ]).start(() => onDone?.());
    }, duration - 600);

    return () => {
      clearInterval(cdInterval);
      clearTimeout(exitTimer);
      if (strobeInterval) clearInterval(strobeInterval);
    };
  }, []);

  const glowOpacity = glowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });
  const isMatrix = effect === 'matrixGreen' || effect === 'digitalRain';
  const isStrobe = effect === 'strobeRed' || effect === 'siren' || effect === 'tvStatic';
  const gradDir = cfg.gradientDir ?? { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };

  const bgColors = isStrobe && !strobeOn
    ? [cfg.bgColors[1], cfg.bgColors[0], cfg.bgColors[1]] as [string, string, string]
    : cfg.bgColors;

  return (
    <Animated.View style={[
      fStyles.container,
      { opacity: masterOpacity, transform: [{ translateY: slideY }, { scale: scaleAnim }] },
    ]}>
      {/* Background gradient */}
      <LinearGradient
        colors={bgColors}
        style={StyleSheet.absoluteFillObject}
        start={gradDir.start}
        end={gradDir.end}
      />

      {/* Matrix rain columns */}
      {isMatrix && (
        <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'row', justifyContent: 'space-around', overflow: 'hidden', opacity: 0.35, pointerEvents: 'none' } as any]}>
          {Array.from({ length: 12 }).map((_, i) => <MatrixColumn key={i} color={cfg.textColor} />)}
        </View>
      )}

      {/* Scanlines */}
      <ScanlineOverlay />

      {/* Glow overlay */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: glowOpacity, pointerEvents: 'none' } as any]}>
        <LinearGradient
          colors={[cfg.badgeBg + '28', 'transparent', cfg.badgeBg + '14']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Animated corner accents */}
      <CornerAccents color={cfg.badgeBg} />

      {/* Flash border */}
      <FlashBorder color={cfg.badgeBg} />

      {/* Content */}
      <View style={fStyles.content}>
        {/* Top meta row */}
        <View style={fStyles.topRow}>
          <View style={[fStyles.effectBadge, { backgroundColor: cfg.badgeBg }]}>
            <Text style={[fStyles.effectLabel, { color: cfg.badgeText }]}>
              {cfg.emoji} {cfg.label}
            </Text>
          </View>
          <View style={fStyles.liveRow}>
            <PulseDot color={cfg.badgeBg} />
            <Animated.Text style={[fStyles.liveText, { color: cfg.badgeBg, opacity: glowPulse }]}>LIVE</Animated.Text>
          </View>
          <TouchableOpacity
            style={[fStyles.countdownBadge, { borderColor: cfg.badgeBg + '88' }]}
            onPress={onDone}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[fStyles.countdownNum, { color: cfg.textColor }]}>{countdown}</Text>
            <Text style={[fStyles.countdownSuffix, { color: cfg.textColor + '88' }]}>s</Text>
          </TouchableOpacity>
        </View>

        {/* FLASH NEWS tag */}
        <Animated.View style={[fStyles.flashTag, { backgroundColor: cfg.badgeBg + '25', opacity: glowPulse }]}>
          <Text style={[fStyles.flashTagText, { color: cfg.badgeBg }]}>⚡ FLASH NEWS ⚡</Text>
        </Animated.View>

        {/* Main news text with slide-in */}
        <Animated.Text
          style={[fStyles.mainText, { color: cfg.textColor, transform: [{ translateX: textSlide }] }]}
          numberOfLines={4}
        >
          {text}
        </Animated.Text>

        {/* Scrolling duplicate below */}
        <ScrollingText text={text} color={cfg.textColor + 'BB'} />

        {/* Bottom channel brand */}
        <View style={fStyles.bottomRow}>
          <View style={[fStyles.channelTag, { backgroundColor: theme.primary }]}>
            <Text style={fStyles.channelTagText}>⚡ SW NEWS</Text>
          </View>
          <Text style={[fStyles.effectName, { color: cfg.textColor + '66' }]}>
            {cfg.emoji} {effect.toUpperCase()}
          </Text>
          <Animated.View style={[fStyles.onAirBadge, { backgroundColor: cfg.badgeBg + '22', borderColor: cfg.badgeBg, opacity: glowPulse }]}>
            <Text style={[fStyles.onAirText, { color: cfg.badgeBg }]}>ON AIR</Text>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

const fStyles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 999,
    minHeight: 160, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 20,
  },
  scanline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.035)' },
  corner: { position: 'absolute', width: 20, height: 20, borderWidth: 2.5 },
  content: { padding: 14, gap: 8 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  effectBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 3 },
  effectLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveText: { fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  countdownBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, flexDirection: 'row', alignItems: 'baseline', gap: 1, marginLeft: 'auto' },
  countdownNum: { fontSize: 14, fontWeight: '800' },
  countdownSuffix: { fontSize: 9, fontWeight: '600' },
  flashTag: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 2 },
  flashTagText: { fontSize: 12, fontWeight: '900', letterSpacing: 3 },
  mainText: {
    fontSize: 16, fontWeight: '700', lineHeight: 24, letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5,
  },
  bottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  channelTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  channelTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  effectName: { fontSize: 8, letterSpacing: 1.5, flex: 1 },
  onAirBadge: { borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  onAirText: { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
});
