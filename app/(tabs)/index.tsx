import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Dimensions, StatusBar, Platform, Modal, ScrollView,
  Pressable, FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Audio } from 'expo-av';

import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { CHANNEL } from '@/constants/theme';
import T from '@/constants/translations';
import { TickerStrip } from '@/components/TickerStrip';
import { BreakingBanner } from '@/components/BreakingBanner';
import { NarrativeStrip } from '@/components/NarrativeStrip';
import { WeatherCurrencyBar } from '@/components/WeatherCurrencyBar';
import { SubtitlePanel } from '@/components/SubtitlePanel';
import { VideoPlayer } from '@/components/VideoPlayer';
import { FlashNewsOverlay } from '@/components/FlashNewsOverlay';
import { AdsPanel } from '@/components/AdsPanel';
import { ControlStrip } from '@/components/ControlStrip';
import { translateToAllLanguages, Translations } from '@/services/translation';

const CATEGORIES = [
  { id: 'all', label: '📋 All', labelUr: 'تمام' },
  { id: 'breaking', label: '🔴 Breaking', labelUr: 'بریکنگ' },
  { id: 'regular', label: '📺 News', labelUr: 'خبریں' },
  { id: 'ticker', label: '📰 Ticker', labelUr: 'ٹکر' },
  { id: 'WORLD NEWS', label: '🌍 World', labelUr: 'عالمی' },
  { id: 'ECONOMY', label: '💹 Economy', labelUr: 'معیشت' },
  { id: 'SPORTS', label: '⚽ Sports', labelUr: 'کھیل' },
  { id: 'POLITICS', label: '🏛️ Politics', labelUr: 'سیاست' },
];

// ─── FIXED Image Carousel — uses explicit pixel height passed from parent ────
function ImageCarousel({
  imageUris,
  theme,
  containerHeight,
}: {
  imageUris: string[];
  theme: any;
  containerHeight: number;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);
  const [screenW, setScreenW] = useState(() => Dimensions.get('window').width);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setScreenW(window.width));
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (imageUris.length <= 1) return;
    const id = setInterval(() => {
      setActiveIdx(prev => {
        const next = (prev + 1) % imageUris.length;
        try { flatRef.current?.scrollToIndex({ index: next, animated: true }); } catch {}
        return next;
      });
    }, 3500);
    return () => clearInterval(id);
  }, [imageUris.length]);

  if (!imageUris.length || containerHeight <= 0) return null;

  // Explicitly compute item width — never rely on percentage inside FlatList
  const itemW = Math.max(200, screenW);
  const itemH = Math.max(120, containerHeight);

  return (
    <View style={{ width: itemW, height: itemH, backgroundColor: '#111', overflow: 'hidden' }}>
      <FlatList
        ref={flatRef}
        data={imageUris}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled
        style={{ width: itemW, height: itemH }}
        contentContainerStyle={{ height: itemH }}
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / itemW);
          setActiveIdx(Math.max(0, Math.min(idx, imageUris.length - 1)));
        }}
        keyExtractor={(_, i) => `img_${i}_${imageUris[i].slice(-20)}`}
        renderItem={({ item: uri }) => (
          // CRITICAL: explicit pixel width + height — NO percentages inside FlatList items
          <View style={{ width: itemW, height: itemH, backgroundColor: '#111', overflow: 'hidden' }}>
            <Image
              source={{ uri }}
              style={{ width: itemW, height: itemH }}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              recyclingKey={uri}
              onError={() => console.log('[SWN] Image load error:', uri.slice(0, 60))}
            />
          </View>
        )}
        getItemLayout={(_, i) => ({ length: itemW, offset: itemW * i, index: i })}
        initialScrollIndex={0}
        decelerationRate="fast"
        removeClippedSubviews={false}
        windowSize={5}
        maxToRenderPerBatch={3}
      />
      {imageUris.length > 1 && (
        <View style={styles.carouselDots}>
          {imageUris.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                try { flatRef.current?.scrollToIndex({ index: i, animated: true }); } catch {}
                setActiveIdx(i);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View
                style={[
                  styles.carouselDot,
                  {
                    backgroundColor: i === activeIdx ? theme.gold : 'rgba(255,255,255,0.45)',
                    width: i === activeIdx ? 14 : 6,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function NewsChannel() {
  const {
    publishedNews, tickerEn, tickerUr, tickerSpeed, breakingNews,
    language, activeLauncher, bgMusicUri, bgMusicEnabled, bgMusicVolume,
    isAdminLoggedIn, liveData, refreshLiveData, channelLogoUri,
    subtitleSettings, ads, displayFilters,
    flashNewsText, flashNewsActive, flashNewsEffect, clearFlashNews,
    introOutro,
  } = useApp();

  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [clockTime, setClockTime] = useState('00:00:00');
  const [clockDate, setClockDate] = useState('');
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  const [translations, setTranslations] = useState<Translations>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [displayMode, setDisplayMode] = useState<'full' | 'half'>('full');
  // Intro/Outro overlay
  const [showIntro, setShowIntro] = useState(false);
  const [showOutro, setShowOutro] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const liveDotAnim = useRef(new Animated.Value(1)).current;
  const newsSlideAnim = useRef(new Animated.Value(0)).current;
  const sidebarAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const translateCache = useRef<Record<string, Translations>>({});

  // Filtered news by category
  const filteredNews = activeCategory === 'all'
    ? publishedNews
    : publishedNews.filter(n => {
        if (activeCategory === 'breaking') return n.section === 'breaking';
        if (activeCategory === 'regular') return n.section === 'regular';
        if (activeCategory === 'ticker') return n.section === 'ticker';
        return n.cat?.toUpperCase() === activeCategory;
      });
  const displayNews = filteredNews.length > 0 ? filteredNews : publishedNews;

  // Dimensions — track changes
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);

  // Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClockTime(
        `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`
      );
      setClockDate(n.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Pulse glow
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.65, duration: 2500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.2, duration: 2500, useNativeDriver: true }),
    ])).start();
  }, [theme.id]);

  // Live dot blink
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(liveDotAnim, { toValue: 0.08, duration: 500, useNativeDriver: true }),
      Animated.timing(liveDotAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();
  }, []);

  // Auto rotate news
  useEffect(() => {
    if (displayNews.length <= 1) return;
    const current = displayNews[currentIdx % Math.max(1, displayNews.length)];
    const duration = (current?.durationSec || 9) * 1000;
    const id = setTimeout(() => {
      Animated.timing(newsSlideAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start(() => {
        setCurrentIdx(p => (p + 1) % displayNews.length);
        newsSlideAnim.setValue(0);
      });
    }, duration);
    return () => clearTimeout(id);
  }, [displayNews.length, currentIdx]);

  useEffect(() => {
    if (displayNews.length > 0 && currentIdx >= displayNews.length) setCurrentIdx(0);
  }, [displayNews.length]);

  useEffect(() => { setCurrentIdx(0); }, [activeCategory]);

  // Intro on launch
  useEffect(() => {
    if (introOutro.introEnabled && introOutro.showOnLaunch && introOutro.introUri) {
      const t = setTimeout(() => setShowIntro(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Auto-translate current news
  useEffect(() => {
    const current = displayNews[currentIdx % Math.max(1, displayNews.length)];
    if (!current?.ur) { setTranslations({}); return; }
    const cacheKey = current.ur.trim();
    if (current.translations && Object.keys(current.translations).length > 1) {
      setTranslations(current.translations as Translations);
      return;
    }
    if (translateCache.current[cacheKey]) {
      setTranslations(translateCache.current[cacheKey]);
      return;
    }
    setIsTranslating(true);
    translateToAllLanguages(current.ur)
      .then(result => {
        const full: Translations = { ur: current.ur, ...result };
        translateCache.current[cacheKey] = full;
        setTranslations(full);
      })
      .catch(() => setTranslations({ ur: current.ur }))
      .finally(() => setIsTranslating(false));
  }, [currentIdx, displayNews.length]);

  // Sidebar
  const openSidebar = () => {
    setSidebarOpen(true);
    Animated.spring(sidebarAnim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 12 }).start();
  };
  const closeSidebar = () => {
    Animated.timing(sidebarAnim, { toValue: 0, duration: 200, useNativeDriver: true })
      .start(() => setSidebarOpen(false));
  };
  const sidebarX = sidebarAnim.interpolate({ inputRange: [0, 1], outputRange: [dims.width, 0] });

  // Background music
  useEffect(() => {
    let mounted = true;
    const manage = async () => {
      try {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        if (bgMusicEnabled && bgMusicUri) {
          if (Platform.OS !== 'web') {
            await Audio.setAudioModeAsync({
              allowsRecordingIOS: false,
              playsInSilentModeIOS: true,
              shouldDuckAndroid: true,
            });
          }
          const { sound } = await Audio.Sound.createAsync(
            { uri: bgMusicUri },
            { isLooping: true, shouldPlay: true, volume: bgMusicVolume }
          );
          if (mounted) soundRef.current = sound;
        }
      } catch {}
    };
    manage();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, [bgMusicEnabled, bgMusicUri]);

  useEffect(() => {
    soundRef.current?.setVolumeAsync(bgMusicVolume).catch(() => {});
  }, [bgMusicVolume]);

  // Current news item
  const safeIdx = Math.min(currentIdx, Math.max(0, displayNews.length - 1));
  const current = displayNews[safeIdx] ?? displayNews[0];
  const hasVideos = (current?.videoUris?.length ?? 0) > 0;

  // Build image URI list — support both imageUris array AND legacy imageUri string
  const imageUris: string[] = (() => {
    const uris: string[] = [];
    if (Array.isArray(current?.imageUris)) {
      for (const u of current.imageUris) {
        if (typeof u === 'string' && u.trim().length > 8) uris.push(u);
      }
    }
    // Also check imageUri (legacy single-image field)
    if (
      current?.imageUri &&
      typeof current.imageUri === 'string' &&
      current.imageUri.trim().length > 8 &&
      !uris.includes(current.imageUri)
    ) {
      uris.unshift(current.imageUri);
    }
    return uris;
  })();

  // Debug: log what we have (remove after confirming fix)
  // console.log('[SWN] imageUris:', imageUris, 'for news:', current?.en?.slice(0, 30));

  // ─── Compute image area height — EXPLICIT pixels, no percentage ──────────
  const aspectMap: Record<string, number> = {
    '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '9:16': 9 / 16, 'fill': 16 / 9,
  };
  const imgAspect = displayFilters.imageAspect ?? 'fill';
  const ratio = aspectMap[imgAspect] ?? (16 / 9);
  const imageAreaH = displayMode === 'half'
    ? Math.max(120, Math.round(dims.height * 0.2))
    : Math.max(180, Math.min(Math.round(dims.width / ratio), Math.round(dims.height * 0.36)));

  // Slide animation
  const slideOpacity = newsSlideAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 1] });
  const slideY = newsSlideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });

  const sidebarItems = [
    { icon: 'article' as const, label: language === 'ur' ? 'نیوز ایڈیٹر' : 'News Editor', route: '/admin/news' },
    { icon: 'category' as const, label: language === 'ur' ? 'کیٹیگریز' : 'Categories', route: '/admin/categories' },
    { icon: 'flash-on' as const, label: language === 'ur' ? 'فلیش نیوز' : 'Flash News', route: '/admin/flash' },
    { icon: 'live-tv' as const, label: language === 'ur' ? 'ٹکر ایڈیٹر' : 'Ticker Editor', route: '/admin/tickers' },
    { icon: 'subtitles' as const, label: language === 'ur' ? 'سب ٹائٹلز' : 'Subtitles', route: '/admin/subtitles' },
    { icon: 'music-note' as const, label: language === 'ur' ? 'میوزک' : 'Music', route: '/admin/music' },
    { icon: 'ad-units' as const, label: language === 'ur' ? 'ایڈز مینیجر' : 'Ads Manager', route: '/admin/ads' },
    { icon: 'play-circle' as const, label: language === 'ur' ? 'انٹرو/آؤٹرو' : 'Intro/Outro', route: '/admin/intro-outro' },
    { icon: 'tune' as const, label: language === 'ur' ? 'فلٹرز' : 'Display Filters', route: '/admin/filters' },
    { icon: 'link' as const, label: language === 'ur' ? 'لنکس' : 'Links', route: '/admin/links' },
    { icon: 'palette' as const, label: language === 'ur' ? 'لانچرز' : 'Launchers', route: '/admin/launchers' },
    { icon: 'group' as const, label: language === 'ur' ? 'ملٹی ایڈمن' : 'Multi-Admin', route: '/admin/admins' },
    { icon: 'settings' as const, label: language === 'ur' ? 'سیٹنگز' : 'Settings', route: '/admin/settings' },
    { icon: 'info' as const, label: language === 'ur' ? 'ہمارے بارے میں' : 'About Us', route: '/admin/about' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.background} />

      {/* Animated background glow */}
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: pulseAnim } as any]}>
        <LinearGradient
          colors={[theme.glow, theme.glow, 'transparent']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0.1 }} end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Filter overlays */}
      {displayFilters.darkMode && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.3)' }]}
          pointerEvents="none"
        />
      )}
      {displayFilters.neonGlow && (
        <View
          style={[StyleSheet.absoluteFillObject, { borderWidth: 2, borderColor: theme.primary + '88' }]}
          pointerEvents="none"
        />
      )}
      {displayFilters.scanlines && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {Array.from({ length: 80 }).map((_, i) => (
            <View key={i} style={[styles.scanline, { top: i * 10 }]} />
          ))}
        </View>
      )}
      {displayFilters.filmGrain && (
        <View
          style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.015)' }]}
          pointerEvents="none"
        />
      )}

      {/* FLASH OVERLAY */}
      {flashNewsActive && (
        <FlashNewsOverlay
          text={flashNewsText}
          effect={flashNewsEffect as any}
          theme={theme}
          onDone={clearFlashNews}
          duration={8000}
        />
      )}

      {/* ALWAYS-VISIBLE CONTROL STRIP — upper-right corner */}
      <ControlStrip
        theme={theme}
        isAdminLoggedIn={isAdminLoggedIn}
        onFullscreen={() => setDisplayMode('full')}
        onHalfScreen={() => setDisplayMode('half')}
        onAdminPress={() => {
          if (isAdminLoggedIn) openSidebar();
          else router.push('/admin/login');
        }}
        onFlashPress={() => router.push('/admin/flash')}
      />

      {/* ── INTRO OVERLAY ── */}
      {showIntro && introOutro.introUri ? (
        <Modal visible transparent={false} animationType="fade" onRequestClose={() => setShowIntro(false)}>
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <VideoPlayer
              videoUris={[introOutro.introUri]}
              theme={theme}
              isVisible
              onClose={() => {
                setShowIntro(false);
                if (introOutro.outroEnabled && introOutro.outroUri) {
                  setTimeout(() => setShowOutro(true), 500);
                }
              }}
              autoPlay
            />
            <TouchableOpacity
              style={styles.introSkip}
              onPress={() => setShowIntro(false)}
            >
              <Text style={styles.introSkipText}>SKIP ▶</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      ) : null}

      {/* ── OUTRO OVERLAY ── */}
      {showOutro && introOutro.outroUri ? (
        <Modal visible transparent={false} animationType="fade" onRequestClose={() => setShowOutro(false)}>
          <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
            <VideoPlayer
              videoUris={[introOutro.outroUri]}
              theme={theme}
              isVisible
              onClose={() => setShowOutro(false)}
              autoPlay
            />
            <TouchableOpacity style={styles.introSkip} onPress={() => setShowOutro(false)}>
              <Text style={styles.introSkipText}>CLOSE ✕</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      ) : null}

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* TICKER STRIPS */}
        <TickerStrip text={tickerEn} speed={tickerSpeed} theme={theme} />
        <TickerStrip text={tickerUr} isUrdu speed={tickerSpeed} theme={theme} />

        {/* WEATHER BAR */}
        <WeatherCurrencyBar liveData={liveData} theme={theme} onRefresh={refreshLiveData} />

        {/* NARRATIVE STRIP */}
        <NarrativeStrip theme={theme} />

        {/* CHANNEL HEADER */}
        <View
          style={[styles.header, { borderTopColor: theme.primary, borderBottomColor: theme.primary + '44' }]}
        >
          <LinearGradient
            colors={[theme.primary + '22', 'transparent']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          <View style={styles.logoRow}>
            {channelLogoUri ? (
              <Image source={{ uri: channelLogoUri }} style={styles.logoImg} contentFit="contain" />
            ) : (
              <View style={[styles.logoBall, { backgroundColor: theme.primary, shadowColor: theme.primary }]}>
                <Text style={styles.logoSW}>SW</Text>
              </View>
            )}
            <View>
              <Text style={[styles.channelEn, { color: theme.text }]}>
                SMART <Text style={{ color: theme.gold }}>WORLD</Text> NEWS
              </Text>
              <Text style={[styles.channelSub, { color: theme.textDim }]}>{CHANNEL.tagline}</Text>
            </View>
          </View>
          <View style={styles.centerGroup}>
            <Animated.View style={[styles.liveDot, { backgroundColor: theme.primary2, opacity: liveDotAnim }]} />
            <Text style={[styles.liveText, { color: theme.text }]}>{t.live}</Text>
          </View>
          <View style={styles.rightGroup}>
            <Text style={[styles.clock, { color: theme.gold }]}>{clockTime}</Text>
            <Text style={[styles.clockDate, { color: theme.textDim }]}>{clockDate}</Text>
          </View>
        </View>

        {/* BREAKING BANNER */}
        <BreakingBanner texts={breakingNews} theme={theme} />

        {/* CATEGORY FILTER BAR */}
        <View
          style={[styles.categoryBar, { backgroundColor: theme.surface + 'F0', borderBottomColor: theme.primary + '33' }]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: isActive ? theme.primary : theme.surface2,
                      borderColor: isActive ? theme.primary : theme.primary + '33',
                    },
                  ]}
                >
                  <Text style={[styles.catChipText, { color: isActive ? '#fff' : theme.textMuted }]}>
                    {language === 'ur' ? cat.labelUr : cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── MEDIA DISPLAY AREA — FIXED HEIGHT ── */}
        {showVideoPlayer && hasVideos ? (
          // ── VIDEO PLAYER — explicit container height ──
          <View style={{ width: dims.width, height: imageAreaH, backgroundColor: '#000', overflow: 'hidden' }}>
            <VideoPlayer
              videoUris={current?.videoUris ?? []}
              theme={theme}
              isVisible
              onClose={() => setShowVideoPlayer(false)}
              autoPlay
              fixedHeight={imageAreaH}
            />
          </View>
        ) : (
          // ── IMAGE / PLACEHOLDER AREA — explicit height ──
          <View
            style={[
              styles.imageArea,
              { height: imageAreaH, borderColor: theme.primary + '55' },
            ]}
          >
            {imageUris.length > 0 ? (
              // Pass explicit pixel height down to ImageCarousel
              <ImageCarousel
                imageUris={imageUris}
                theme={theme}
                containerHeight={imageAreaH}
              />
            ) : (
              <LinearGradient
                colors={[theme.surface, theme.surface2, theme.background]}
                style={StyleSheet.absoluteFillObject}
              >
                <View style={styles.imgPlaceholder}>
                  <MaterialIcons name="newspaper" size={44} color={theme.textDim} />
                  <Text style={[styles.imgPlaceholderText, { color: theme.textDim }]}>SMART WORLD NEWS</Text>
                  <Text style={[styles.imgSubText, { color: theme.textDim + '88' }]}>Truth through the Lens</Text>
                </View>
              </LinearGradient>
            )}

            {/* Vignette */}
            {displayFilters.vignette && (
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(0,0,0,0.4)']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
            )}

            {/* Bottom gradient overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.65)']}
              style={[StyleSheet.absoluteFillObject, { top: imageAreaH * 0.5 }]}
              pointerEvents="none"
            />

            {/* Corner tags */}
            <View style={[styles.cornerTag, { backgroundColor: theme.primary }]}>
              <Text style={styles.cornerTagText}>⚡ {current?.cat || 'LIVE'}</Text>
            </View>
            <View style={styles.counter}>
              <Text style={[styles.counterText, { color: theme.textMuted }]}>
                {Math.max(1, safeIdx + 1)} / {Math.max(1, displayNews.length)}
              </Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: theme.surface + 'DD' }]}>
              <Text
                style={[
                  styles.sectionBadgeText,
                  { color: current?.isBreaking ? theme.primary2 : theme.gold },
                ]}
              >
                {current?.section === 'breaking'
                  ? '🔴 BREAKING'
                  : current?.section === 'ticker'
                  ? '📰 TICKER'
                  : '📺 NEWS'}
              </Text>
            </View>

            {/* VIDEO button — always show when video available */}
            {hasVideos && (
              <TouchableOpacity
                style={[styles.videoPlayBtn, { backgroundColor: theme.primary }]}
                onPress={() => setShowVideoPlayer(true)}
              >
                <MaterialIcons name="play-circle-filled" size={20} color="#fff" />
                <Text style={styles.videoPlayText}>
                  {'▶ '}
                  {current.videoUris.length} VIDEO{current.videoUris.length > 1 ? 'S' : ''}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* HEADLINE AREA */}
        <LinearGradient colors={[theme.primary + 'F4', theme.primary + 'FA']} style={styles.headlineArea}>
          <View style={[styles.headlineTopRow, { borderBottomColor: 'rgba(255,255,255,0.18)' }]}>
            <View style={styles.brkBadge}>
              <Text style={styles.brkBadgeText}>⚡ {t.breakingShort}</Text>
            </View>
            <Text style={[styles.categoryText, { color: theme.gold }]} numberOfLines={1}>
              {current?.cat || 'NEWS'}{current?.catUr ? ` · ${current.catUr}` : ''}
            </Text>
          </View>
          <Animated.View style={{ opacity: slideOpacity, transform: [{ translateY: slideY }] }}>
            <Text style={styles.headlineEn} numberOfLines={2}>
              {current?.en || 'Smart World News — Truth through the Lens'}
            </Text>
            <Text style={styles.headlineUr} numberOfLines={2}>
              {current?.ur || 'سمارٹ ورلڈ نیوز — حقیقت عدسے سے'}
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* MULTI-LANGUAGE SUBTITLES */}
        <View style={{ flex: 1, minHeight: 70 }}>
          <SubtitlePanel
            translations={translations}
            theme={theme}
            isTranslating={isTranslating}
            settings={subtitleSettings}
          />
        </View>

        {/* ADS PANEL */}
        <AdsPanel ads={ads} theme={theme} />
      </SafeAreaView>

      {/* ADMIN SIDEBAR MODAL */}
      <Modal visible={sidebarOpen} transparent animationType="none" onRequestClose={closeSidebar}>
        <Pressable style={styles.sidebarOverlay} onPress={closeSidebar}>
          <Animated.View
            style={[
              styles.sidebar,
              {
                backgroundColor: theme.surface,
                transform: [{ translateX: sidebarX }],
                width: Math.min(dims.width * 0.78, 300),
              },
            ]}
          >
            <Pressable onPress={() => {}} style={{ flex: 1 }}>
              <LinearGradient
                colors={[theme.primary + '33', 'transparent']}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <View style={[styles.sidebarHeader, { borderBottomColor: theme.primary + '44' }]}>
                <View style={[styles.logoBall, { backgroundColor: theme.primary, width: 32, height: 32, borderRadius: 16 }]}>
                  <Text style={[styles.logoSW, { fontSize: 10 }]}>SW</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sidebarTitle, { color: theme.text }]}>ADMIN PANEL</Text>
                  <Text style={[styles.sidebarSub, { color: theme.textDim }]}>Password Protected</Text>
                </View>
                <TouchableOpacity onPress={closeSidebar}>
                  <MaterialIcons name="close" size={20} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.adminBadge,
                  { backgroundColor: theme.primary + '22', borderColor: theme.primary + '44' },
                ]}
              >
                <MaterialIcons name="shield" size={12} color={theme.primary} />
                <Text style={[styles.adminBadgeText, { color: theme.primary }]}>
                  Logged In · Admin Mode
                </Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                <Text style={[styles.sidebarSectionLabel, { color: theme.textDim }]}>ALL FEATURES</Text>
                {sidebarItems.map(item => (
                  <TouchableOpacity
                    key={item.route}
                    style={[styles.sidebarItem, { borderBottomColor: theme.primary + '22' }]}
                    onPress={() => {
                      closeSidebar();
                      setTimeout(() => router.push(item.route as any), 200);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.sidebarItemIcon, { backgroundColor: theme.primary + '22' }]}>
                      <MaterialIcons name={item.icon} size={18} color={theme.primary} />
                    </View>
                    <Text style={[styles.sidebarItemText, { color: theme.text }]}>{item.label}</Text>
                    <MaterialIcons name="chevron-right" size={16} color={theme.textDim} />
                  </TouchableOpacity>
                ))}
                <View style={{ height: 20 }} />
              </ScrollView>
              <TouchableOpacity
                style={[styles.sidebarLogout, { borderTopColor: theme.primary + '33' }]}
                onPress={() => { closeSidebar(); router.replace('/'); }}
              >
                <MaterialIcons name="logout" size={16} color="#ff5252" />
                <Text style={styles.sidebarLogoutText}>Log Out</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scanline: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 10, paddingVertical: 7, paddingRight: 42,
    borderTopWidth: 2, borderBottomWidth: 1, position: 'relative', overflow: 'hidden',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoImg: { width: 34, height: 34, borderRadius: 4 },
  logoBall: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowRadius: 10, shadowOpacity: 1, elevation: 8,
  },
  logoSW: { color: '#fff', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  channelEn: { fontSize: 12, fontWeight: '800', letterSpacing: 1.3, lineHeight: 16 },
  channelSub: { fontSize: 7, letterSpacing: 0.8, fontStyle: 'italic' },
  centerGroup: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveText: { fontSize: 12, fontWeight: '800', letterSpacing: 2.5 },
  rightGroup: { alignItems: 'flex-end' },
  clock: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  clockDate: { fontSize: 7.5, letterSpacing: 0.5, marginTop: 1 },

  categoryBar: { borderBottomWidth: 1, paddingVertical: 5 },
  categoryScroll: { paddingHorizontal: 10, gap: 6, flexDirection: 'row', alignItems: 'center' },
  catChip: { paddingHorizontal: 11, paddingVertical: 4, borderRadius: 14, borderWidth: 1 },
  catChipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Image area — receives explicit height from imageAreaH
  imageArea: { width: '100%', overflow: 'hidden', borderBottomWidth: 1, position: 'relative' },
  imgPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  imgPlaceholderText: { fontSize: 13, letterSpacing: 2.5, fontWeight: '800' },
  imgSubText: { fontSize: 9, letterSpacing: 1.5 },

  carouselDots: {
    position: 'absolute', bottom: 36, flexDirection: 'row', gap: 5,
    alignSelf: 'center', left: 0, right: 0, justifyContent: 'center', zIndex: 5,
  },
  carouselDot: { height: 6, borderRadius: 3 },

  cornerTag: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  cornerTagText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  counter: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 7, paddingVertical: 2,
  },
  counterText: { fontSize: 9, letterSpacing: 1.5, fontWeight: '300' },
  sectionBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 3,
  },
  sectionBadgeText: { fontSize: 8.5, fontWeight: '700', letterSpacing: 1.5 },
  videoPlayBtn: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4,
  },
  videoPlayText: { color: '#fff', fontSize: 8.5, fontWeight: '800', letterSpacing: 1 },

  headlineArea: { paddingBottom: 8, overflow: 'hidden' },
  headlineTopRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 5, borderBottomWidth: 1, marginBottom: 5,
  },
  brkBadge: {
    backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 2,
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.25)',
  },
  brkBadgeText: { color: '#fff', fontSize: 8.5, fontWeight: '800', letterSpacing: 2.5 },
  categoryText: {
    fontSize: 8.5, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', flex: 1,
  },
  headlineEn: {
    color: '#fff', fontSize: 14, fontWeight: '800', letterSpacing: 0.3,
    paddingHorizontal: 10, lineHeight: 20,
  },
  headlineUr: {
    color: 'rgba(255,255,255,0.9)', fontSize: 11, paddingHorizontal: 10,
    lineHeight: 18, textAlign: 'right', marginTop: 3,
  },

  introSkip: {
    position: 'absolute', bottom: 40, right: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 4,
  },
  introSkipText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },

  sidebarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', justifyContent: 'flex-end' },
  sidebar: {
    flex: 1, shadowColor: '#000',
    shadowOffset: { width: -3, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 20,
  },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, borderBottomWidth: 1,
  },
  sidebarTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  sidebarSub: { fontSize: 9, letterSpacing: 0.8, marginTop: 1 },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: 14, marginVertical: 8, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1,
  },
  adminBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  sidebarSectionLabel: {
    fontSize: 9, letterSpacing: 2.5, fontWeight: '700',
    paddingHorizontal: 14, paddingTop: 4, paddingBottom: 8, textTransform: 'uppercase',
  },
  sidebarItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1,
  },
  sidebarItemIcon: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  sidebarItemText: { flex: 1, fontSize: 14, fontWeight: '500' },
  sidebarLogout: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderTopWidth: 1 },
  sidebarLogoutText: { color: '#ff5252', fontSize: 14, fontWeight: '600' },
});
