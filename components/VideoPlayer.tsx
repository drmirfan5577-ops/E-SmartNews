/**
 * VideoPlayer — UHD+ professional player using expo-video.
 *
 * ROOT CAUSE FIX for "video shows no picture, only sound":
 *   VideoView MUST receive explicit pixel width+height (not flex/percentage).
 *   The parent must also have explicit pixel dimensions.
 *   We accept an optional `fixedHeight` prop so the caller can enforce size.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LauncherTheme } from '@/constants/launchers';

type AspectMode = '16:9' | '9:16' | '4:3' | '1:1' | '2:3' | '5:3' | 'fill';

const ASPECT_RATIOS: Record<AspectMode, number> = {
  '16:9': 16 / 9, '9:16': 9 / 16, '4:3': 4 / 3,
  '1:1': 1, '2:3': 2 / 3, '5:3': 5 / 3, 'fill': 16 / 9,
};

// A real fallback video that definitely works
const FALLBACK_URI = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

type Props = {
  videoUris: string[];
  theme: LauncherTheme;
  isVisible: boolean;
  onClose: () => void;
  autoPlay?: boolean;
  fixedHeight?: number; // When provided, use this height (avoids percentage issues)
};

// ─── Inner player — always receives concrete pixel width+height ──────────────
function PlayerCore({
  uri,
  theme,
  playerW,
  playerH,
  onClose,
  isFullscreen,
  isFloating,
  currentClipIdx,
  totalClips,
  onPrev,
  onNext,
  onSetClipIdx,
  onToggleFullscreen,
  onToggleFloating,
  aspectMode,
  onChangeAspect,
}: {
  uri: string;
  theme: LauncherTheme;
  playerW: number;
  playerH: number;
  onClose: () => void;
  isFullscreen: boolean;
  isFloating: boolean;
  currentClipIdx: number;
  totalClips: number;
  onPrev: () => void;
  onNext: () => void;
  onSetClipIdx: (i: number) => void;
  onToggleFullscreen: () => void;
  onToggleFloating: () => void;
  aspectMode: AspectMode;
  onChangeAspect: (a: AspectMode) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showAspectPicker, setShowAspectPicker] = useState(false);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Ensure URI is always a non-empty string
  const safeUri = typeof uri === 'string' && uri.trim().length > 0 ? uri : FALLBACK_URI;

  const player = useVideoPlayer({ uri: safeUri }, p => {
    if (!p) return;
    p.loop = false;
    p.muted = false;
    p.volume = 1.0;
  });

  // Auto-play — delayed slightly to let VideoView mount fully
  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => {
      if (!mountedRef.current || !player) return;
      try { player.play(); setIsPlaying(true); setIsBuffering(false); } catch {}
    }, 600);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
    };
  }, [player]);

  // Poll position + duration
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (!mountedRef.current || !player) return;
      try {
        const ct = player.currentTime;
        const dur = player.duration;
        if (typeof ct === 'number' && isFinite(ct) && ct >= 0) setPosition(ct);
        if (typeof dur === 'number' && isFinite(dur) && dur > 0) {
          setDuration(dur);
          setIsBuffering(false);
        }
      } catch {}
    }, 250);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [player]);

  const showControlsFor = useCallback(() => {
    if (!mountedRef.current) return;
    setShowControls(true);
    controlsOpacity.setValue(1);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (!mountedRef.current) return;
      Animated.timing(controlsOpacity, { toValue: 0, duration: 500, useNativeDriver: true })
        .start(() => { if (mountedRef.current) setShowControls(false); });
    }, 4000);
  }, [controlsOpacity]);

  useEffect(() => { showControlsFor(); }, []);

  const togglePlay = () => {
    showControlsFor();
    try {
      if (isPlaying) { player?.pause(); setIsPlaying(false); }
      else { player?.play(); setIsPlaying(true); }
    } catch {}
  };

  const toggleMute = () => {
    try { if (player) { player.muted = !isMuted; setIsMuted(p => !p); } } catch {}
    showControlsFor();
  };

  const seek = (pct: number) => {
    try {
      if (player && duration > 0) {
        const t = Math.max(0, Math.min(duration, pct * duration));
        player.currentTime = t;
        setPosition(t);
      }
    } catch {}
    showControlsFor();
  };

  const skip = (secs: number) => {
    try {
      if (player) {
        const t = Math.max(0, Math.min(duration, (player.currentTime ?? 0) + secs));
        player.currentTime = t;
        setPosition(t);
      }
    } catch {}
    showControlsFor();
  };

  const fmt = (sec: number) => {
    if (!isFinite(sec) || sec < 0) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? Math.max(0, Math.min(100, (position / duration) * 100)) : 0;
  const contentFit = aspectMode === 'fill' ? 'cover' : 'contain';

  // Ensure we have valid pixel dimensions — must be > 0
  const vw = Math.max(100, playerW);
  const vh = Math.max(100, playerH);

  return (
    <View style={{ width: vw, height: vh, backgroundColor: '#000', overflow: 'hidden' }}>
      {/* ── THE VIDEO VIEW — explicit pixel size — this is the core fix ── */}
      <VideoView
        player={player}
        style={{ width: vw, height: vh, backgroundColor: '#000' }}
        contentFit={contentFit as any}
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />

      {/* Buffering */}
      {isBuffering && (
        <View style={[StyleSheet.absoluteFillObject, pvs.bufferOverlay]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[pvs.bufferText, { color: theme.textMuted }]}>Loading HD...</Text>
        </View>
      )}

      {/* Tap zone */}
      <TouchableOpacity
        style={[StyleSheet.absoluteFillObject, { zIndex: 2 }]}
        onPress={showControlsFor}
        activeOpacity={1}
      />

      {/* Gradients */}
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, zIndex: 3 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.92)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 110, zIndex: 3 }}
        pointerEvents="none"
      />

      {/* ── TOP BAR ── */}
      <View style={[pvs.topBar, { zIndex: 10 }]}>
        <View style={[pvs.qualityBadge, { backgroundColor: theme.primary }]}>
          <Text style={pvs.qualityText}>UHD+</Text>
        </View>
        <Text style={[pvs.clipCounter, { color: 'rgba(255,255,255,0.9)' }]}>
          🎬 {currentClipIdx + 1}/{Math.max(1, totalClips)}
        </Text>

        {/* Aspect mode picker */}
        <TouchableOpacity
          onPress={() => setShowAspectPicker(p => !p)}
          style={[pvs.aspectBtn, { backgroundColor: theme.surface + 'CC' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[pvs.aspectBtnText, { color: theme.gold }]}>{aspectMode}</Text>
        </TouchableOpacity>
        {showAspectPicker && (
          <View style={[pvs.aspectPicker, { backgroundColor: theme.surface }]}>
            {(Object.keys(ASPECT_RATIOS) as AspectMode[]).map(a => (
              <TouchableOpacity
                key={a}
                onPress={() => { onChangeAspect(a); setShowAspectPicker(false); }}
                style={[pvs.aspectItem, { backgroundColor: aspectMode === a ? theme.primary : 'transparent' }]}
              >
                <Text style={[pvs.aspectItemText, { color: aspectMode === a ? '#fff' : theme.textMuted }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isFloating ? (
          <TouchableOpacity onPress={onToggleFloating} style={pvs.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="picture-in-picture" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={onToggleFloating} style={pvs.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="open-in-full" size={18} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onToggleFullscreen} style={pvs.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={[pvs.closeBtn, { backgroundColor: 'rgba(200,16,46,0.9)' }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── CENTER CONTROLS ── */}
      {showControls && (
        <Animated.View style={[pvs.centerControls, { opacity: controlsOpacity, zIndex: 10 }]}>
          {totalClips > 1 && (
            <TouchableOpacity onPress={onPrev} style={pvs.navBtn}>
              <MaterialIcons name="skip-previous" size={30} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => skip(-10)} style={pvs.navBtn}>
            <MaterialIcons name="replay-10" size={26} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={togglePlay}
            style={[pvs.playBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
          >
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={36} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => skip(10)} style={pvs.navBtn}>
            <MaterialIcons name="forward-10" size={26} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          {totalClips > 1 && (
            <TouchableOpacity onPress={onNext} style={pvs.navBtn}>
              <MaterialIcons name="skip-next" size={30} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      {/* ── BOTTOM BAR ── */}
      {showControls && (
        <Animated.View style={[pvs.bottomBar, { opacity: controlsOpacity, zIndex: 10 }]}>
          <Text style={pvs.timeText}>{fmt(position)}</Text>
          <TouchableOpacity
            style={pvs.progressTrack}
            onPress={e => {
              const trackW = Math.max(1, vw - 100);
              const tapX = e.nativeEvent.locationX;
              seek(Math.max(0, Math.min(1, tapX / trackW)));
            }}
            activeOpacity={1}
          >
            <View style={[pvs.progressBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={[pvs.progressFill, { backgroundColor: theme.primary, width: `${pct}%` }]} />
            <View style={[pvs.progressKnob, { backgroundColor: theme.gold, left: `${pct}%` }]} />
          </TouchableOpacity>
          <Text style={pvs.timeText}>{fmt(duration)}</Text>
          <TouchableOpacity onPress={toggleMute} style={pvs.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name={isMuted ? 'volume-off' : 'volume-up'} size={16} color="#fff" />
          </TouchableOpacity>
          <View style={[pvs.hdBadge, { backgroundColor: theme.primary + 'CC' }]}>
            <Text style={pvs.hdText}>UHD+</Text>
          </View>
        </Animated.View>
      )}

      {/* ── CLIP DOTS ── */}
      {totalClips > 1 && (
        <View style={[pvs.clipDots, { zIndex: 10 }]}>
          {Array.from({ length: totalClips }).map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onSetClipIdx(i)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            >
              <View style={[
                pvs.clipDot,
                { backgroundColor: i === currentClipIdx ? theme.gold : 'rgba(255,255,255,0.4)', width: i === currentClipIdx ? 16 : 6 },
              ]} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Main export — manages clip index, fullscreen, floating ─────────────────
export function VideoPlayer({ videoUris, theme, isVisible, onClose, autoPlay = true, fixedHeight }: Props) {
  const [dims, setDims] = useState(() => Dimensions.get('window'));
  const [currentClipIdx, setCurrentClipIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [aspectMode, setAspectMode] = useState<AspectMode>('16:9');

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub?.remove();
  }, []);

  const validUris = videoUris.filter(u => typeof u === 'string' && u.trim().length > 0);
  const currentUri = validUris[currentClipIdx] ?? validUris[0] ?? FALLBACK_URI;

  const getSize = (): { w: number; h: number } => {
    const ratio = ASPECT_RATIOS[aspectMode] ?? (16 / 9);
    if (isFullscreen) return { w: dims.width, h: dims.height };
    if (isFloating) return { w: 220, h: Math.round(220 / ratio) };
    if (fixedHeight) return { w: dims.width, h: fixedHeight };
    const h = Math.max(180, Math.min(Math.round(dims.width / ratio), Math.round(dims.height * 0.45)));
    return { w: dims.width, h };
  };

  const { w: playerW, h: playerH } = getSize();

  if (!isVisible) return null;

  const core = (
    <PlayerCore
      uri={currentUri}
      theme={theme}
      playerW={playerW}
      playerH={playerH}
      onClose={onClose}
      isFullscreen={isFullscreen}
      isFloating={isFloating}
      currentClipIdx={currentClipIdx}
      totalClips={Math.max(1, validUris.length)}
      onPrev={() => setCurrentClipIdx(p => (p - 1 + validUris.length) % validUris.length)}
      onNext={() => setCurrentClipIdx(p => (p + 1) % validUris.length)}
      onSetClipIdx={setCurrentClipIdx}
      onToggleFullscreen={() => setIsFullscreen(p => !p)}
      onToggleFloating={() => setIsFloating(p => !p)}
      aspectMode={aspectMode}
      onChangeAspect={setAspectMode}
    />
  );

  if (isFullscreen) {
    return (
      <Modal
        visible
        transparent={false}
        animationType="fade"
        supportedOrientations={['portrait', 'landscape', 'landscape-left', 'landscape-right']}
        onRequestClose={() => setIsFullscreen(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
          {core}
        </View>
      </Modal>
    );
  }

  if (isFloating) {
    return (
      <Modal visible transparent animationType="none" onRequestClose={() => setIsFloating(false)}>
        <View style={pvs.floatingContainer} pointerEvents="box-none">
          <View style={pvs.floatingWrapper}>{core}</View>
        </View>
      </Modal>
    );
  }

  return core;
}

const pvs = StyleSheet.create({
  bufferOverlay: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', zIndex: 5, gap: 8,
  },
  bufferText: { fontSize: 11, letterSpacing: 1 },
  floatingContainer: { flex: 1, position: 'relative' },
  floatingWrapper: {
    position: 'absolute', bottom: 90, right: 10,
    borderRadius: 8, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingTop: 8, paddingBottom: 6, gap: 6,
  },
  qualityBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 3 },
  qualityText: { color: '#fff', fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
  clipCounter: { flex: 1, fontSize: 9, fontWeight: '600' },
  iconBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  closeBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  aspectBtn: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 3 },
  aspectBtnText: { fontSize: 8, fontWeight: '800' },
  aspectPicker: {
    position: 'absolute', top: 34, right: 70, borderRadius: 6, overflow: 'hidden',
    zIndex: 20, minWidth: 70,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 10,
  },
  aspectItem: { paddingHorizontal: 10, paddingVertical: 7 },
  aspectItemText: { fontSize: 11, fontWeight: '600' },
  centerControls: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 12,
  },
  navBtn: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: 68, height: 68, borderRadius: 34,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 12, elevation: 10,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 10, paddingBottom: 14, paddingTop: 4,
  },
  timeText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '600', minWidth: 38 },
  progressTrack: { flex: 1, height: 18, justifyContent: 'center', position: 'relative' },
  progressBg: { position: 'absolute', left: 0, right: 0, height: 4, borderRadius: 2 },
  progressFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2 },
  progressKnob: { position: 'absolute', top: 3, width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
  hdBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  hdText: { color: '#fff', fontSize: 7, fontWeight: '800', letterSpacing: 1 },
  clipDots: {
    position: 'absolute', bottom: 46, left: 0, right: 0,
    flexDirection: 'row', gap: 5, justifyContent: 'center',
  },
  clipDot: { height: 6, borderRadius: 3 },
});
