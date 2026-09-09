import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { useAlert } from '@/template';

type Effect = 'fade' | 'slide' | 'zoom' | 'flash';
const EFFECTS: Effect[] = ['fade', 'slide', 'zoom', 'flash'];
const EFFECT_EMOJIS: Record<Effect, string> = { fade: '🌅', slide: '↔️', zoom: '🔍', flash: '⚡' };

export default function IntroOutroManager() {
  const { isAdminLoggedIn, introOutro, updateIntroOutro, activeLauncher } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const pickIntroVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Media access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      updateIntroOutro({ introUri: result.assets[0].uri });
      showAlert('Success', 'Intro video uploaded successfully.');
    }
  };

  const pickOutroVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Media access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 0.9 });
    if (!result.canceled && result.assets[0]) {
      updateIntroOutro({ outroUri: result.assets[0].uri });
      showAlert('Success', 'Outro video uploaded successfully.');
    }
  };

  const inp = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];
  const lbl = [styles.label, { color: theme.primary }];

  const EffectSelector = ({ value, onChange }: { value: Effect; onChange: (e: Effect) => void }) => (
    <View style={styles.effectRow}>
      {EFFECTS.map(ef => (
        <TouchableOpacity
          key={ef}
          onPress={() => onChange(ef)}
          style={[styles.effectBtn, { backgroundColor: value === ef ? theme.primary : theme.surface2, borderColor: theme.primary + '55' }]}
        >
          <Text style={styles.effectEmoji}>{EFFECT_EMOJIS[ef]}</Text>
          <Text style={[styles.effectLabel, { color: value === ef ? '#fff' : theme.textMuted }]}>{ef.toUpperCase()}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>INTRO / OUTRO MANAGER</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Global toggles */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.primary + '18', borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="play-circle" size={16} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>GLOBAL SETTINGS</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={[styles.toggleLabel, { color: theme.text }]}>Show Intro on App Launch</Text>
                  <Text style={[styles.toggleDesc, { color: theme.textDim }]}>Play intro when channel opens</Text>
                </View>
                <Switch value={introOutro.showOnLaunch} onValueChange={v => updateIntroOutro({ showOnLaunch: v })} trackColor={{ true: theme.primary + '99' }} thumbColor={introOutro.showOnLaunch ? theme.primary : '#aaa'} />
              </View>
              <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: theme.primary + '18' }]}>
                <View>
                  <Text style={[styles.toggleLabel, { color: theme.text }]}>Show Between News Segments</Text>
                  <Text style={[styles.toggleDesc, { color: theme.textDim }]}>Play between each news rotation</Text>
                </View>
                <Switch value={introOutro.showBetweenNews} onValueChange={v => updateIntroOutro({ showBetweenNews: v })} trackColor={{ true: theme.primary + '99' }} thumbColor={introOutro.showBetweenNews ? theme.primary : '#aaa'} />
              </View>
              <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: theme.primary + '18' }]}>
                <View>
                  <Text style={[styles.toggleLabel, { color: theme.text }]}>Background Music During Intro</Text>
                  <Text style={[styles.toggleDesc, { color: theme.textDim }]}>Keep BG music playing during intro/outro</Text>
                </View>
                <Switch value={introOutro.bgMusicDuringIntro} onValueChange={v => updateIntroOutro({ bgMusicDuringIntro: v })} trackColor={{ true: theme.primary + '99' }} thumbColor={introOutro.bgMusicDuringIntro ? theme.primary : '#aaa'} />
              </View>
            </View>
          </View>

          {/* INTRO */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '66' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.primary + '25', borderBottomColor: theme.primary + '44' }]}>
              <MaterialIcons name="play-arrow" size={16} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.primary }]}>🎬 INTRO VIDEO</Text>
              <Switch
                value={introOutro.introEnabled}
                onValueChange={v => updateIntroOutro({ introEnabled: v })}
                trackColor={{ true: theme.primary + '99' }}
                thumbColor={introOutro.introEnabled ? theme.primary : '#aaa'}
              />
            </View>
            <View style={styles.cardBody}>
              {/* Upload area */}
              {introOutro.introUri ? (
                <View style={[styles.videoUploaded, { backgroundColor: theme.surface2, borderColor: theme.primary + '55' }]}>
                  <MaterialIcons name="play-circle-filled" size={36} color={theme.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.videoUploadedText, { color: theme.text }]}>Intro Video Uploaded ✓</Text>
                    <Text style={[styles.videoUploadedSub, { color: theme.textDim }]} numberOfLines={1}>{introOutro.introUri.split('/').pop()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => updateIntroOutro({ introUri: null })} style={styles.removeBtn}>
                    <MaterialIcons name="delete" size={16} color="#ff5252" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={pickIntroVideo} style={[styles.uploadArea, { borderColor: theme.primary + '88', backgroundColor: theme.primary + '10' }]}>
                  <MaterialIcons name="video-library" size={28} color={theme.primary} />
                  <Text style={[styles.uploadText, { color: theme.primary }]}>Upload Intro Video</Text>
                  <Text style={[styles.uploadSub, { color: theme.textDim }]}>From device gallery/storage</Text>
                </TouchableOpacity>
              )}

              <Text style={lbl}>INTRO TITLE (overlay text)</Text>
              <TextInput style={inp} value={introOutro.introTitle} onChangeText={v => updateIntroOutro({ introTitle: v })} placeholderTextColor={theme.textDim} placeholder="SMART WORLD NEWS" />

              <Text style={lbl}>DURATION (seconds)</Text>
              <View style={styles.durationRow}>
                {[5, 8, 10, 15, 20].map(d => (
                  <TouchableOpacity key={d} onPress={() => updateIntroOutro({ introDurationSec: d })}
                    style={[styles.durBtn, { backgroundColor: introOutro.introDurationSec === d ? theme.primary : theme.surface2, borderColor: theme.primary + '55' }]}>
                    <Text style={[styles.durBtnText, { color: introOutro.introDurationSec === d ? '#fff' : theme.textMuted }]}>{d}s</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={lbl}>TRANSITION EFFECT</Text>
              <EffectSelector value={introOutro.introEffect} onChange={v => updateIntroOutro({ introEffect: v })} />
            </View>
          </View>

          {/* OUTRO */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.gold + '55' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.gold + '18', borderBottomColor: theme.gold + '33' }]}>
              <MaterialIcons name="stop" size={16} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>🎞️ OUTRO VIDEO</Text>
              <Switch
                value={introOutro.outroEnabled}
                onValueChange={v => updateIntroOutro({ outroEnabled: v })}
                trackColor={{ true: theme.gold + '99' }}
                thumbColor={introOutro.outroEnabled ? theme.gold : '#aaa'}
              />
            </View>
            <View style={styles.cardBody}>
              {introOutro.outroUri ? (
                <View style={[styles.videoUploaded, { backgroundColor: theme.surface2, borderColor: theme.gold + '55' }]}>
                  <MaterialIcons name="play-circle-filled" size={36} color={theme.gold} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.videoUploadedText, { color: theme.text }]}>Outro Video Uploaded ✓</Text>
                    <Text style={[styles.videoUploadedSub, { color: theme.textDim }]} numberOfLines={1}>{introOutro.outroUri.split('/').pop()}</Text>
                  </View>
                  <TouchableOpacity onPress={() => updateIntroOutro({ outroUri: null })} style={styles.removeBtn}>
                    <MaterialIcons name="delete" size={16} color="#ff5252" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={pickOutroVideo} style={[styles.uploadArea, { borderColor: theme.gold + '88', backgroundColor: theme.gold + '10' }]}>
                  <MaterialIcons name="video-library" size={28} color={theme.gold} />
                  <Text style={[styles.uploadText, { color: theme.gold }]}>Upload Outro Video</Text>
                  <Text style={[styles.uploadSub, { color: theme.textDim }]}>From device gallery/storage</Text>
                </TouchableOpacity>
              )}

              <Text style={lbl}>OUTRO TITLE</Text>
              <TextInput style={inp} value={introOutro.outroTitle} onChangeText={v => updateIntroOutro({ outroTitle: v })} placeholderTextColor={theme.textDim} placeholder="Thank You for Watching" />

              <Text style={lbl}>DURATION (seconds)</Text>
              <View style={styles.durationRow}>
                {[5, 8, 10, 15, 20].map(d => (
                  <TouchableOpacity key={d} onPress={() => updateIntroOutro({ outroDurationSec: d })}
                    style={[styles.durBtn, { backgroundColor: introOutro.outroDurationSec === d ? theme.gold : theme.surface2, borderColor: theme.gold + '55' }]}>
                    <Text style={[styles.durBtnText, { color: introOutro.outroDurationSec === d ? '#000' : theme.textMuted }]}>{d}s</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={lbl}>TRANSITION EFFECT</Text>
              <EffectSelector value={introOutro.outroEffect} onChange={v => updateIntroOutro({ outroEffect: v })} />
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  scroll: { padding: 14, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  cardTitle: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  cardBody: { padding: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  toggleDesc: { fontSize: 10, marginTop: 2 },
  uploadArea: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 8, padding: 24, alignItems: 'center', gap: 8, marginBottom: 12 },
  uploadText: { fontSize: 14, fontWeight: '700' },
  uploadSub: { fontSize: 10 },
  videoUploaded: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  videoUploadedText: { fontSize: 13, fontWeight: '600' },
  videoUploadedSub: { fontSize: 9, marginTop: 3 },
  removeBtn: { padding: 6 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 13, marginBottom: 4 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  durBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1 },
  durBtnText: { fontSize: 12, fontWeight: '600' },
  effectRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  effectBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1, alignItems: 'center', gap: 2, minWidth: 60 },
  effectEmoji: { fontSize: 14 },
  effectLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
