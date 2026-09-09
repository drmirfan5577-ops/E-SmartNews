import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { SUBTITLE_LANGS, SubtitleLang, Translations } from '@/services/translation';
import { SubtitleSettings, DEFAULT_SUBTITLE_SETTINGS } from '@/constants/theme';
import { LauncherTheme } from '@/constants/launchers';

type SubtitleRowProps = { lang: SubtitleLang; text: string; theme: LauncherTheme; settings: SubtitleSettings };

function SubtitleRow({ lang, text, theme, settings: s }: SubtitleRowProps) {
  const [screenW, setScreenW] = useState(Dimensions.get('window').width);
  const mountedRef = useRef(true);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      if (mountedRef.current) setScreenW(window.width);
    });
    return () => sub?.remove();
  }, []);

  // Row width based on setting
  const rowW = Math.max(100, screenW * ((s.rowWidthPercent ?? 100) / 100));

  // Scroll translation — starts from off-screen, scrolls all the way across
  const translateX = useRef(new Animated.Value(lang.isRTL ? -rowW * 2 : rowW)).current;
  const [contentW, setContentW] = useState(rowW * 3);

  // Check if this language is disabled
  const isEnabled = (s.customEnabled ?? {})[lang.code] !== false;

  const runAnim = useCallback((cw: number) => {
    if (!mountedRef.current) return;
    // RTL: start from left (-cw), scroll right (to rowW)
    // LTR: start from right (rowW), scroll left (to -cw)
    const from = lang.isRTL ? -cw : rowW;
    const to = lang.isRTL ? rowW : -cw;
    const totalDistance = cw + rowW;
    // Speed: s.speed is the "period" in ms for one full cycle at base 400px
    const baseDur = Math.max(10000, s.speed ?? 28000);
    const dur = Math.round(baseDur * (totalDistance / Math.max(1, rowW)));
    translateX.setValue(from);
    const anim = Animated.timing(translateX, {
      toValue: to,
      duration: Math.max(6000, dur),
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animRef.current = anim;
    anim.start(({ finished }) => { if (finished && mountedRef.current) runAnim(cw); });
  }, [lang.isRTL, rowW, translateX, s.speed]);

  useEffect(() => {
    mountedRef.current = true;
    translateX.stopAnimation();
    animRef.current?.stop();
    runAnim(contentW);
    return () => {
      mountedRef.current = false;
      animRef.current?.stop();
    };
  }, [runAnim, contentW, text, lang.code]);

  if (!text || !isEnabled) return null;

  const bgColor = (s.customBgColors ?? {})[lang.code] || lang.bgColor;
  const textColor = (s.customTextColors ?? {})[lang.code] || lang.textColor;

  // Repeat text for seamless loop effect
  const displayText = `${text}   ◉   ${text}   ◉   `;

  return (
    <View style={[
      styles.row,
      {
        backgroundColor: bgColor,
        borderBottomColor: 'rgba(255,255,255,0.06)',
        height: Math.max(16, s.rowHeight ?? 22),
        width: rowW,
        // Align to right for RTL languages
        alignSelf: lang.isRTL ? 'flex-end' : 'flex-start',
      },
    ]}>
      {/* Language badge */}
      {s.showBadge && (
        <View style={[
          styles.badge,
          {
            borderRightColor: textColor + '44',
            backgroundColor: bgColor,
            borderRadius: s.roundedBadge ? 4 : 0,
            // RTL: badge on right side
            ...(lang.isRTL ? { borderRightWidth: 0, borderLeftWidth: 1, borderLeftColor: textColor + '44' } : {}),
          },
        ]}>
          <Text style={[styles.badgeCode, { color: textColor + 'CC' }]}>{lang.code.toUpperCase()}</Text>
          <Text style={[styles.badgeNative, { color: textColor }]}>{lang.nativeLabel}</Text>
        </View>
      )}

      {/* Scrolling text track */}
      <View style={styles.track}>
        <Animated.View
          style={{
            flexDirection: lang.isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            transform: [{ translateX }],
          }}
          onLayout={e => {
            const w = e.nativeEvent.layout.width;
            if (w > 80 && Math.abs(w - contentW) > 30) setContentW(w);
          }}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.subText,
              {
                color: textColor,
                fontSize: Math.max(8, s.fontSize ?? 10),
                fontFamily: s.fontFamily === 'system' ? undefined : s.fontFamily,
                writingDirection: lang.isRTL ? 'rtl' : 'ltr',
                textAlign: lang.isRTL ? 'right' : 'left',
                textShadowColor: s.textShadow
                  ? (s.glowEffect ? textColor : 'rgba(0,0,0,0.6)')
                  : 'transparent',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: s.glowEffect ? 10 : 3,
                opacity: Math.max(0.4, Math.min(1.5, s.textBrightness ?? 1)),
              },
            ]}
          >
            {displayText}
          </Text>
        </Animated.View>
      </View>

      {/* Direction arrow indicator */}
      {s.showArrow && (
        <View style={[styles.rtlBadge, { backgroundColor: bgColor }]}>
          <Text style={[styles.dirArrow, { color: textColor + '77' }]}>
            {lang.isRTL ? '←' : '→'}
          </Text>
        </View>
      )}
    </View>
  );
}

type Props = {
  translations: Translations;
  theme: LauncherTheme;
  isTranslating?: boolean;
  settings?: SubtitleSettings;
};

export function SubtitlePanel({ translations, theme, isTranslating, settings }: Props) {
  const s = settings ?? DEFAULT_SUBTITLE_SETTINGS;
  const hasTranslations = Object.keys(translations).length > 1;

  // Count enabled languages
  const enabledCount = SUBTITLE_LANGS.filter(lang => (s.customEnabled ?? {})[lang.code] !== false).length;

  return (
    <View style={[styles.panel, { borderTopColor: theme.primary + '55', backgroundColor: 'rgba(0,0,0,0.96)' }]}>
      {/* Header */}
      <View style={[styles.panelHeader, { backgroundColor: theme.primary + '25', borderBottomColor: theme.primary + '44' }]}>
        <View style={[styles.panelDot, { backgroundColor: theme.primary }]} />
        <Text style={[styles.panelLabel, { color: theme.gold }]}>
          {isTranslating ? '⟳ AUTO-TRANSLATING...' : '◉ MULTI-LANGUAGE — LIVE'}
        </Text>
        <Text style={[styles.langCount, { color: theme.textDim }]}>
          {enabledCount}/{SUBTITLE_LANGS.length} LANGS
        </Text>
      </View>

      {/* Content */}
      {isTranslating ? (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: theme.primary }]}>
            ⟳ Translating to {SUBTITLE_LANGS.length} languages...
          </Text>
        </View>
      ) : !hasTranslations ? (
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: theme.textDim }]}>
            Enter Urdu news to activate multilingual subtitles
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, overflow: 'hidden' }}>
          {SUBTITLE_LANGS.map(lang => {
            const text = translations[lang.code] || '';
            if (!text) return null;
            return (
              <SubtitleRow
                key={lang.code}
                lang={lang}
                text={text}
                theme={theme}
                settings={s}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, borderTopWidth: 1, overflow: 'hidden' },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, gap: 6, borderBottomWidth: 1,
  },
  panelDot: { width: 6, height: 6, borderRadius: 3 },
  panelLabel: { flex: 1, fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  langCount: { fontSize: 8, letterSpacing: 1 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 1,
  },
  badge: {
    width: 58,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    flexShrink: 0,
    paddingHorizontal: 2,
  },
  badgeCode: { fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  badgeNative: { fontSize: 8, fontWeight: '700', textAlign: 'center' },
  track: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  subText: {
    fontWeight: '600',
    paddingHorizontal: 8,
    letterSpacing: 0.4,
  },
  rtlBadge: { width: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  dirArrow: { fontSize: 8, fontWeight: '700' },
  statusRow: { justifyContent: 'center', alignItems: 'center', padding: 10, flex: 1 },
  statusText: { fontSize: 10, letterSpacing: 0.8, textAlign: 'center' },
});
