import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { MusicSlot } from '@/constants/theme';
import T from '@/constants/translations';
import { useAlert } from '@/template';
import Slider from '@react-native-community/slider';

export default function MusicManager() {
  const {
    isAdminLoggedIn, bgMusicUri, bgMusicEnabled, bgMusicName, bgMusicVolume,
    setBgMusic, setBgMusicEnabled, setBgMusicVolume, activeLauncher, language,
    activeMusicSlot, musicSlots, setActiveMusicSlot, updateMusicSlot,
  } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewSlotId, setPreviewSlotId] = useState<string | null>(null);
  const previewSoundRef = useRef<Audio.Sound | null>(null);
  const [tab, setTab] = useState<'builtin' | 'custom'>('builtin');

  const builtInSlots = musicSlots.filter(s => s.isBuiltIn);
  const customSlots = musicSlots.filter(s => !s.isBuiltIn);

  const selectSlot = (idx: number) => {
    const slot = musicSlots[idx];
    if (!slot) return;
    const uri = slot.isBuiltIn ? (slot.builtInUrl || null) : slot.uri;
    if (!uri) {
      showAlert('No Audio', slot.isBuiltIn
        ? 'Built-in streaming track. Tap the ▶ Preview button to test, then SELECT to activate.'
        : 'Upload a music file to this slot first.');
      return;
    }
    setActiveMusicSlot(idx);
    setBgMusicEnabled(true);
    showAlert('Track Selected', `Now playing: "${slot.name}"`);
  };

  const uploadToSlot = async (slot: MusicSlot) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        const { uri, name } = result.assets[0];
        updateMusicSlot(slot.id, { uri, name: name || slot.name });
        showAlert('Uploaded', `Music saved to "${slot.name}" slot.`);
      }
    } catch {
      showAlert('Error', 'Could not pick audio file.');
    }
  };

  const togglePreview = async (slot: MusicSlot) => {
    const uri = slot.isBuiltIn ? (slot.builtInUrl || null) : slot.uri;
    try {
      if (isPreviewPlaying && previewSlotId === slot.id) {
        await previewSoundRef.current?.stopAsync();
        await previewSoundRef.current?.unloadAsync();
        previewSoundRef.current = null;
        setIsPreviewPlaying(false);
        setPreviewSlotId(null);
        return;
      }
      if (previewSoundRef.current) {
        await previewSoundRef.current.stopAsync();
        await previewSoundRef.current.unloadAsync();
        previewSoundRef.current = null;
      }
      if (!uri) { showAlert('No Audio', 'No audio file in this slot.'); return; }
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      }
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true, volume: bgMusicVolume });
      previewSoundRef.current = sound;
      setIsPreviewPlaying(true);
      setPreviewSlotId(slot.id);
      sound.setOnPlaybackStatusUpdate(s => {
        if (s.isLoaded && s.didJustFinish) {
          setIsPreviewPlaying(false);
          setPreviewSlotId(null);
        }
      });
    } catch {
      showAlert('Playback Error', 'Could not play audio.');
    }
  };

  const handlePublish = () => {
    if (!bgMusicUri) { showAlert('No Music', 'Select and activate a music track first.'); return; }
    setBgMusicEnabled(true);
    showAlert('Published', `Background music is now live: "${bgMusicName}"`);
  };

  const currentSlot = musicSlots[activeMusicSlot];
  const card = (extra?: object) => [styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }, extra];
  const inputStyle = { backgroundColor: theme.surface2, borderColor: theme.primary + '44' };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.musicManager}</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Now Playing */}
          <View style={card()}>
            <LinearGradient colors={[theme.primary + '28', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.nowPlayingRow}>
              <View style={[styles.musicIcon, { backgroundColor: bgMusicEnabled ? theme.primary + '33' : theme.surface2 }]}>
                <MaterialIcons name={bgMusicEnabled ? 'graphic-eq' : 'music-note'} size={28} color={bgMusicEnabled ? theme.primary : theme.textDim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nowPlayingLabel, { color: theme.textDim }]}>NOW BROADCASTING</Text>
                <Text style={[styles.nowPlayingName, { color: theme.text }]} numberOfLines={1}>
                  {bgMusicName || 'No track selected'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: bgMusicEnabled ? theme.primary + '33' : theme.textDim + '22' }]}>
                  <View style={[styles.statusDot, { backgroundColor: bgMusicEnabled ? theme.primary : theme.textDim }]} />
                  <Text style={[styles.statusTxt, { color: bgMusicEnabled ? theme.primary : theme.textDim }]}>
                    {bgMusicEnabled ? '● LIVE ON AIR' : '○ OFF AIR'}
                  </Text>
                </View>
              </View>
              <Switch
                value={bgMusicEnabled}
                onValueChange={v => {
                  setBgMusicEnabled(v);
                  if (v && !bgMusicUri) showAlert('No Music', 'Select a track first.');
                }}
                trackColor={{ false: theme.textDim + '66', true: theme.primary + '99' }}
                thumbColor={bgMusicEnabled ? theme.primary : '#ccc'}
              />
            </View>
          </View>

          {/* Volume + Equalizer */}
          <View style={card()}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="equalizer" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>{t.equalizer} + {t.volume}</Text>
            </View>
            <View style={{ padding: 14 }}>
              <View style={styles.volRow}>
                <MaterialIcons name="volume-down" size={18} color={theme.textMuted} />
                <Slider
                  style={{ flex: 1 }}
                  value={bgMusicVolume}
                  onValueChange={v => setBgMusicVolume(parseFloat(v.toFixed(2)))}
                  minimumValue={0}
                  maximumValue={1}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.textDim}
                  thumbTintColor={theme.gold}
                />
                <MaterialIcons name="volume-up" size={18} color={theme.textMuted} />
                <Text style={[styles.volPct, { color: theme.gold }]}>{Math.round(bgMusicVolume * 100)}%</Text>
              </View>
              {/* EQ bars visual */}
              <View style={styles.eqBars}>
                {[0.4, 0.7, 0.9, 0.6, 0.8, 0.5, 0.75, 0.85, 0.65, 0.55].map((h, i) => (
                  <View key={i} style={[styles.eqBar, {
                    height: bgMusicEnabled ? h * 32 * bgMusicVolume + 6 : 6,
                    backgroundColor: i % 3 === 0 ? theme.primary : i % 3 === 1 ? theme.gold : theme.primary2,
                    opacity: bgMusicEnabled ? 0.85 : 0.25,
                  }]} />
                ))}
              </View>
              <Text style={[styles.eqLabel, { color: theme.textDim }]}>
                {bgMusicEnabled ? 'Signal Active — Auto-duck on voice broadcast' : 'Signal Off Air'}
              </Text>
            </View>
          </View>

          {/* Track Tabs */}
          <View style={styles.tabRow}>
            {(['builtin', 'custom'] as const).map(tp => (
              <TouchableOpacity
                key={tp}
                onPress={() => setTab(tp)}
                style={[styles.tabBtn, { backgroundColor: tab === tp ? theme.primary : theme.surface2, borderColor: theme.primary + '66' }]}
              >
                <Text style={[styles.tabBtnText, { color: tab === tp ? '#fff' : theme.textMuted }]}>
                  {tp === 'builtin' ? `🎵 ${t.builtInTracks} (10)` : `📁 ${t.customTracks} (10)`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Built-in Tracks */}
          {tab === 'builtin' && builtInSlots.map((slot, i) => {
            const isActive = musicSlots.indexOf(slot) === activeMusicSlot;
            const isPreviewing = isPreviewPlaying && previewSlotId === slot.id;
            return (
              <View key={slot.id} style={[styles.slotCard, {
                backgroundColor: isActive ? theme.primary + '22' : theme.surface,
                borderColor: isActive ? theme.primary : theme.primary + '30',
              }]}>
                {isActive && <View style={[styles.slotActiveLine, { backgroundColor: theme.primary }]} />}
                <View style={[styles.slotIcon, { backgroundColor: isActive ? theme.primary + '33' : theme.surface2 }]}>
                  <Text style={styles.slotNum}>{String(i + 1).padStart(2, '0')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotName, { color: theme.text }]}>{slot.name}</Text>
                  <Text style={[styles.slotType, { color: theme.textDim }]}>Built-in Track · {slot.builtInUrl ? 'Available' : 'Offline'}</Text>
                </View>
                <View style={styles.slotActions}>
                  <TouchableOpacity onPress={() => togglePreview(slot)} style={styles.slotBtn}>
                    <MaterialIcons name={isPreviewing ? 'stop' : 'play-arrow'} size={20} color={isPreviewing ? theme.gold : theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => selectSlot(musicSlots.indexOf(slot))} style={[styles.slotSelectBtn, { backgroundColor: isActive ? theme.primary : theme.surface2, borderColor: theme.primary + '66' }]}>
                    <Text style={[styles.slotSelectText, { color: isActive ? '#fff' : theme.primary }]}>
                      {isActive ? '✓ ON AIR' : 'SELECT'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Custom Upload Slots */}
          {tab === 'custom' && customSlots.map((slot, i) => {
            const globalIdx = musicSlots.indexOf(slot);
            const isActive = globalIdx === activeMusicSlot;
            const isPreviewing = isPreviewPlaying && previewSlotId === slot.id;
            return (
              <View key={slot.id} style={[styles.slotCard, {
                backgroundColor: isActive ? theme.primary + '22' : theme.surface,
                borderColor: isActive ? theme.primary : theme.primary + '30',
              }]}>
                {isActive && <View style={[styles.slotActiveLine, { backgroundColor: theme.primary }]} />}
                <View style={[styles.slotIcon, { backgroundColor: isActive ? theme.primary + '33' : theme.surface2 }]}>
                  <Text style={styles.slotNum}>{String(i + 1).padStart(2, '0')}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.slotName, { color: slot.uri ? theme.text : theme.textDim }]}>
                    {slot.uri ? slot.name : `Custom Slot ${i + 1} — Empty`}
                  </Text>
                  {slot.uri
                    ? <Text style={[styles.slotType, { color: theme.primary }]}>✓ Custom Upload</Text>
                    : <Text style={[styles.slotType, { color: theme.textDim }]}>Tap Upload to add music</Text>
                  }
                </View>
                <View style={styles.slotActions}>
                  {slot.uri && (
                    <TouchableOpacity onPress={() => togglePreview(slot)} style={styles.slotBtn}>
                      <MaterialIcons name={isPreviewing ? 'stop' : 'play-arrow'} size={20} color={isPreviewing ? theme.gold : theme.textMuted} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => uploadToSlot(slot)} style={styles.slotBtn}>
                    <MaterialIcons name="file-upload" size={18} color={theme.primary} />
                  </TouchableOpacity>
                  {slot.uri && (
                    <TouchableOpacity onPress={() => selectSlot(globalIdx)} style={[styles.slotSelectBtn, { backgroundColor: isActive ? theme.primary : theme.surface2, borderColor: theme.primary + '66' }]}>
                      <Text style={[styles.slotSelectText, { color: isActive ? '#fff' : theme.primary }]}>
                        {isActive ? '✓ ON AIR' : 'SELECT'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}

          {/* Publish */}
          <TouchableOpacity onPress={handlePublish} style={[styles.publishBtn, { backgroundColor: theme.gold }]}>
            <MaterialIcons name="broadcast-on-personal" size={18} color={theme.background} />
            <Text style={[styles.publishText, { color: theme.background }]}>{t.publish} — GO LIVE 24/7</Text>
          </TouchableOpacity>

          <Text style={[styles.hintText, { color: theme.textDim }]}>
            Selected track plays continuously on channel. Auto-ducks when news is broadcasting.
          </Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  scroll: { padding: 14, gap: 10 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', marginBottom: 2, position: 'relative' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  nowPlayingRow: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'center' },
  musicIcon: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  nowPlayingLabel: { fontSize: 8, letterSpacing: 2, fontWeight: '700', marginBottom: 3 },
  nowPlayingName: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  volRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  volPct: { fontSize: 13, fontWeight: '700', width: 38, textAlign: 'right' },
  eqBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 40, marginBottom: 6 },
  eqBar: { flex: 1, borderRadius: 2 },
  eqLabel: { fontSize: 9, letterSpacing: 1, textAlign: 'center' },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tabBtn: { flex: 1, padding: 10, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  tabBtnText: { fontSize: 11, fontWeight: '600' },
  slotCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 6, borderWidth: 1, padding: 10, marginBottom: 6, overflow: 'hidden', position: 'relative' },
  slotActiveLine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  slotIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  slotNum: { fontSize: 11, fontWeight: '700', color: '#aaa' },
  slotName: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  slotType: { fontSize: 10, letterSpacing: 0.5 },
  slotActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  slotBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  slotSelectBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4, borderWidth: 1 },
  slotSelectText: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 6, marginTop: 8 },
  publishText: { fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  hintText: { fontSize: 10, textAlign: 'center', letterSpacing: 0.5, marginTop: 4 },
});
