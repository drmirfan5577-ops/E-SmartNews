/**
 * ControlStrip — Always-visible glowing tube-light strip in upper-right corner.
 * Shows fullscreen, half-screen, floating, close, back, background-play controls.
 * Never hidden by content overlays. zIndex: 9999.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal,
  Dimensions, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { LauncherTheme } from '@/constants/launchers';

type ControlStripProps = {
  theme: LauncherTheme;
  onFullscreen?: () => void;
  onHalfScreen?: () => void;
  onFloating?: () => void;
  onBackgroundPlay?: () => void;
  isAdminLoggedIn?: boolean;
  onAdminPress?: () => void;
  onFlashPress?: () => void;
};

export function ControlStrip({
  theme,
  onFullscreen,
  onHalfScreen,
  onFloating,
  onBackgroundPlay,
  isAdminLoggedIn,
  onAdminPress,
  onFlashPress,
}: ControlStripProps) {
  const router = useRouter();
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const [expanded, setExpanded] = useState(false);
  const [bgPlayActive, setBgPlayActive] = useState(false);
  const [displayMode, setDisplayMode] = useState<'full' | 'half' | 'float'>('full');
  const insets = { top: Platform.OS === 'ios' ? 50 : 30 };

  // Tube-light glow pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.primary + '55', theme.primary + 'FF'],
  });

  const handleFullscreen = () => {
    setDisplayMode('full');
    onFullscreen?.();
  };
  const handleHalfScreen = () => {
    setDisplayMode('half');
    onHalfScreen?.();
  };
  const handleFloating = () => {
    setDisplayMode('float');
    onFloating?.();
  };
  const handleBgPlay = () => {
    setBgPlayActive(p => !p);
    onBackgroundPlay?.();
  };

  const controls = [
    {
      icon: 'fullscreen' as const,
      label: 'Full',
      active: displayMode === 'full',
      onPress: handleFullscreen,
      color: theme.gold,
    },
    {
      icon: 'vertical-split' as const,
      label: 'Half',
      active: displayMode === 'half',
      onPress: handleHalfScreen,
      color: theme.primary,
    },
    {
      icon: 'picture-in-picture' as const,
      label: 'Float',
      active: displayMode === 'float',
      onPress: handleFloating,
      color: theme.primary,
    },
    {
      icon: bgPlayActive ? 'play-circle-filled' as const : 'play-circle-outline' as const,
      label: 'BG',
      active: bgPlayActive,
      onPress: handleBgPlay,
      color: bgPlayActive ? '#00e676' : theme.textMuted,
    },
    {
      icon: 'flash-on' as const,
      label: 'Flash',
      active: false,
      onPress: onFlashPress ?? (() => router.push('/admin/flash' as any)),
      color: '#ff5722',
    },
    {
      icon: isAdminLoggedIn ? 'settings' as const : 'lock' as const,
      label: isAdminLoggedIn ? 'Admin' : 'Lock',
      active: isAdminLoggedIn ?? false,
      onPress: onAdminPress ?? (() => router.push('/admin/login' as any)),
      color: isAdminLoggedIn ? theme.gold : theme.textMuted,
    },
    {
      icon: 'arrow-back' as const,
      label: 'Back',
      active: false,
      onPress: () => { try { router.back(); } catch {} },
      color: theme.textMuted,
    },
  ];

  return (
    <Animated.View
      style={[
        styles.strip,
        {
          top: insets.top,
          shadowColor: theme.primary,
          borderColor: glowColor as any,
          backgroundColor: theme.surface + 'EE',
        },
      ]}
    >
      {/* Tube-light glow bar */}
      <Animated.View style={[styles.tubeGlow, { backgroundColor: glowColor as any }]} />

      {/* Expand/collapse toggle */}
      <TouchableOpacity
        onPress={() => setExpanded(p => !p)}
        style={[styles.toggleBtn, { backgroundColor: theme.primary + '33' }]}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <MaterialIcons
          name={expanded ? 'chevron-right' : 'chevron-left'}
          size={14}
          color={theme.gold}
        />
      </TouchableOpacity>

      {/* Controls — show when expanded */}
      {expanded && controls.map((ctrl, i) => (
        <TouchableOpacity
          key={i}
          onPress={ctrl.onPress}
          style={[
            styles.btn,
            ctrl.active && { backgroundColor: ctrl.color + '33' },
          ]}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <MaterialIcons name={ctrl.icon} size={14} color={ctrl.color} />
          {expanded && (
            <Text style={[styles.btnLabel, { color: ctrl.color }]}>{ctrl.label}</Text>
          )}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: 'absolute',
    right: 0,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderWidth: 1,
    borderRightWidth: 0,
    gap: 2,
    zIndex: 9999,
    overflow: 'hidden',
    // Glow shadow
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 20,
    minWidth: 32,
  },
  tubeGlow: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    borderRadius: 1,
  },
  toggleBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  btn: {
    width: 26,
    height: 26,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  btnLabel: {
    fontSize: 6,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
