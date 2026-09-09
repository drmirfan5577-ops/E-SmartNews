/**
 * MediaPlayer — Studio-grade audio player for news media items.
 * Uses expo-av Audio for MP3/MP4/AAC/FLAC/OGG playback.
 * Shows as a compact bar below images when audio is attached to news.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LauncherTheme } from '@/constants/launchers';

type Props = {
  audioUri: string;
  title?: string;
  theme: LauncherTheme;
  onClose?: () => void;
  compact?: boolean;
};

export function MediaPlayer({ audioUri, title, theme, onClose, compact = false }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [error, setError] = useState('');

  const soundRef = useRef<Audio.Sound | null>(null);
  const mountedRef = useRef(true);
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Glow animation when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      glowAnim.setValue(0.3);
    }
  }, [isPlaying]);

  // Load audio
  useEffect(() => {
    mountedRef.current = true;
    let sound: Audio.Sound | null = null;

    const load = async () => {
      if (!audioUri) return;
      setIsLoading(true);
      setError('');
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          staysActiveInBackground: true,
        });
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: false, isLooping: false, volume },
          (status) => {
            if (!mountedRef.current) return;
            if (!status.isLoaded) return;
            setPosition(status.positionMillis / 1000);
            setDuration((status.durationMillis ?? 0) / 1000);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        );
        sound = s;
        if (mountedRef.current) {
          soundRef.current = s;
          setIsLoading(false);
        } else {
          await s.unloadAsync();
        }
      } catch (e: any) {
        if (mountedRef.current) {
          setError('Cannot load audio');
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      mountedRef.current = false;
      sound?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [audioUri]);

  const togglePlay = useCallback(async () => {
    if (!soundRef.current || isLoading) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch {}
  }, [isPlaying, isLoading]);

  const seek = useCallback(async (pct: number) => {
    if (!soundRef.current || duration <= 0) return;
    try {
      const ms = Math.round(pct * duration * 1000);
      await soundRef.current.setPositionAsync(ms);
      setPosition(pct * duration);
    } catch {}
  }, [duration]);

  const skip = useCallback(async (secs: number) => {
    if (!soundRef.current || duration <= 0) return;
    try {
      const newPos = Math.max(0, Math.min(duration, position + secs));
      await soundRef.current.setPositionAsync(newPos * 1000);
      setPosition(newPos);
    } catch {}
  }, [position, duration]);

  const toggleMute = useCallback(async () => {
    if (!soundRef.current) return;
    try {
      const newMuted = !isMuted;
      await soundRef.current.setVolumeAsync(newMuted ? 0 : volume);
      setIsMuted(newMuted);
    } catch {}
  }, [isMuted, volume]);

  const fmt = (sec: number): string => {
    if (!isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const pct = duration > 0 ? Math.max(0, Math.min(100, (position / duration) * 100)) : 0;

  const barW = 14;

  return (
    <Animated.View
      style={[
        styles.container,
        compact && styles.containerCompact,
        {
          backgroundColor: theme.surface,
          borderColor: isPlaying ? theme.primary + '88' : theme.primary + '33',
          shadowColor: theme.primary,
          shadowOpacity: isPlaying ? 0.5 : 0.1,
        },
      ]}
    >
      <LinearGradient
        colors={[theme.primary + '18', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Animated "VU meter" bars when playing */}
      {isPlaying && (
        <View style={styles.vuMeter}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.vuBar,
                {
                  backgroundColor: theme.primary,
                  height: barW + i * 3,
                  opacity: glowAnim,
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Left: play/pause + skip */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => skip(-5)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="replay-5" size={18} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={togglePlay}
          style={[styles.playBtn, { backgroundColor: theme.primary, shadowColor: theme.primary }]}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={22} color="#fff" />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => skip(5)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="forward-5" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Center: title + progress bar */}
      <View style={styles.center}>
        {title ? (
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{title}</Text>
        ) : null}
        {error ? (
          <Text style={[styles.errorText, { color: '#ff5252' }]}>{error}</Text>
        ) : (
          <>
            <TouchableOpacity
              style={styles.progressTrack}
              onPress={e => {
                // Estimate track width from layout
                seek(Math.max(0, Math.min(1, e.nativeEvent.locationX / 180)));
              }}
              activeOpacity={1}
            >
              <View style={[styles.progressBg, { backgroundColor: theme.surface2 }]} />
              <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${pct}%` }]} />
              <View style={[styles.progressKnob, { backgroundColor: theme.gold, left: `${pct}%` }]} />
            </TouchableOpacity>
            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: theme.textDim }]}>{fmt(position)}</Text>
              <Text style={[styles.formatBadge, { color: theme.primary, backgroundColor: theme.primary + '22' }]}>
                {audioUri.split('.').pop()?.toUpperCase().slice(0, 4) ?? 'AUDIO'}
              </Text>
              <Text style={[styles.timeText, { color: theme.textDim }]}>{fmt(duration)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Right: mute + close */}
      <View style={styles.rightControls}>
        <TouchableOpacity onPress={toggleMute} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons
            name={isMuted ? 'volume-off' : 'volume-up'}
            size={18}
            color={isMuted ? theme.textDim : theme.gold}
          />
        </TouchableOpacity>
        {onClose ? (
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={16} color={theme.textDim} />
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  containerCompact: {
    paddingVertical: 5,
  },
  vuMeter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    marginRight: 4,
  },
  vuBar: {
    width: 3,
    borderRadius: 1,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  center: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    borderRadius: 2,
  },
  progressKnob: {
    position: 'absolute',
    top: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  formatBadge: {
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  rightControls: {
    gap: 8,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 9,
    fontWeight: '600',
  },
});
