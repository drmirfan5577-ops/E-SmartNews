import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { FLASH_EFFECTS, FlashEffect } from '@/components/FlashNewsOverlay';
import { useAlert } from '@/template';

const EFFECT_EMOJIS: Partial<Record<FlashEffect, string>> = {
  redAlert: '🔴', whiteFlash: '⚡', matrixGreen: '💾', goldBurst: '✨', blueShock: '💥',
  purplePulse: '🔮', crimsonDrop: '🩸', neonCyan: '💎', orangeBlaze: '🔥', rocketSlide: '🚀',
  thunderBolt: '🌩️', radicalZoom: '🔍', tvStatic: '📺', bloodMoon: '🌕', iceShard: '❄️',
  sunFlare: '☀️', digitalRain: '💻', fireAlert: '🔥', ghostPulse: '👻', vortex: '🌀',
  satellite: '🛰️', nuclearGlow: '☢️', lasers: '🔆', siren: '🚨', countdown: '⏱️',
  cosmicWave: '🌌', hologram: '📡', strobeRed: '🔴', darkSlide: '🌑', goldExplosion: '💛',
};

export default function FlashAdmin() {
  const { isAdminLoggedIn, triggerFlashNews, activeLauncher } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [flashText, setFlashText] = useState('');
  const [selectedEffect, setSelectedEffect] = useState<FlashEffect>('redAlert');
  const [showEffectPicker, setShowEffectPicker] = useState(false);

  const fireFlash = () => {
    if (!flashText.trim()) { showAlert('Empty', 'Enter flash news text first.'); return; }
    triggerFlashNews(flashText.trim().toUpperCase(), selectedEffect);
    showAlert('Fired!', `Flash news sent with "${selectedEffect}" effect.`);
    setFlashText('');
  };

  const inp = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];
  const lbl = [styles.label, { color: theme.primary }];

  const EFFECTS_GRID = FLASH_EFFECTS.reduce<FlashEffect[][]>((rows, e, i) => {
    if (i % 3 === 0) rows.push([]);
    rows[rows.length - 1].push(e);
    return rows;
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>⚡ FLASH NEWS OVERLAYS</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Info */}
          <View style={[styles.infoBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '44' }]}>
            <MaterialIcons name="flash-on" size={14} color={theme.gold} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              Flash news overlays appear with dramatic 30+ visual effects across the channel display. They auto-dismiss after 7 seconds.
            </Text>
          </View>

          {/* Flash text input */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '66' }]}>
            <LinearGradient colors={[theme.primary + '20', 'transparent']} style={StyleSheet.absoluteFillObject} />
            <View style={[styles.cardHeader, { backgroundColor: theme.primary + '25', borderBottomColor: theme.primary + '44' }]}>
              <MaterialIcons name="campaign" size={16} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.primary }]}>COMPOSE FLASH NEWS</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={lbl}>FLASH NEWS TEXT *</Text>
              <TextInput
                style={[inp, { minHeight: 80 }]}
                value={flashText}
                onChangeText={setFlashText}
                multiline
                placeholder="BREAKING: Type your urgent flash news here..."
                placeholderTextColor={theme.textDim}
                autoCapitalize="characters"
              />

              <Text style={lbl}>SELECT EFFECT ({FLASH_EFFECTS.length} available)</Text>
              <TouchableOpacity
                onPress={() => setShowEffectPicker(true)}
                style={[styles.effectPickerBtn, { backgroundColor: theme.surface2, borderColor: theme.primary + '66' }]}
              >
                <Text style={styles.effectPickerEmoji}>{EFFECT_EMOJIS[selectedEffect] || '⚡'}</Text>
                <Text style={[styles.effectPickerLabel, { color: theme.text }]}>
                  {selectedEffect.replace(/([A-Z])/g, ' $1').toUpperCase()}
                </Text>
                <MaterialIcons name="expand-more" size={18} color={theme.textMuted} />
              </TouchableOpacity>

              {/* Fire button */}
              <TouchableOpacity
                onPress={fireFlash}
                style={[styles.fireBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <MaterialIcons name="flash-on" size={20} color="#fff" />
                <Text style={styles.fireBtnText}>⚡ FIRE FLASH NEWS ⚡</Text>
              </TouchableOpacity>
              <Text style={[styles.hint, { color: theme.textDim }]}>Flash overlay will appear on the channel for 7 seconds</Text>
            </View>
          </View>

          {/* Quick effects preview grid */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="style" size={16} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>QUICK EFFECT SELECT</Text>
            </View>
            <View style={styles.effectGrid}>
              {FLASH_EFFECTS.map(ef => (
                <TouchableOpacity
                  key={ef}
                  onPress={() => setSelectedEffect(ef)}
                  style={[styles.effectCell, {
                    backgroundColor: selectedEffect === ef ? theme.primary + '44' : theme.surface2,
                    borderColor: selectedEffect === ef ? theme.primary : theme.primary + '22',
                    borderWidth: selectedEffect === ef ? 2 : 1,
                  }]}
                >
                  <Text style={styles.effectCellEmoji}>{EFFECT_EMOJIS[ef] || '⚡'}</Text>
                  <Text style={[styles.effectCellLabel, { color: selectedEffect === ef ? theme.text : theme.textDim }]} numberOfLines={2}>
                    {ef.replace(/([A-Z])/g, ' $1')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Effect Picker Modal */}
      <Modal visible={showEffectPicker} transparent animationType="slide" onRequestClose={() => setShowEffectPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowEffectPicker(false)}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.primary + '44' }]} />
            <Text style={[styles.modalTitle, { color: theme.gold }]}>
              ⚡ SELECT FLASH EFFECT ({FLASH_EFFECTS.length})
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {FLASH_EFFECTS.map(ef => (
                <TouchableOpacity
                  key={ef}
                  onPress={() => { setSelectedEffect(ef); setShowEffectPicker(false); }}
                  style={[styles.modalItem, {
                    backgroundColor: selectedEffect === ef ? theme.primary + '22' : 'transparent',
                    borderBottomColor: theme.primary + '18',
                  }]}
                >
                  <Text style={styles.modalItemEmoji}>{EFFECT_EMOJIS[ef] || '⚡'}</Text>
                  <Text style={[styles.modalItemLabel, { color: theme.text }]}>
                    {ef.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </Text>
                  {selectedEffect === ef && <MaterialIcons name="check" size={16} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  scroll: { padding: 14, gap: 12 },
  infoBanner: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 6, borderWidth: 1, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden', position: 'relative' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  cardTitle: { flex: 1, fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  cardBody: { padding: 14 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  effectPickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 6, borderWidth: 1, marginBottom: 14 },
  effectPickerEmoji: { fontSize: 20 },
  effectPickerLabel: { flex: 1, fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  fireBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 6 },
  fireBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: 2 },
  hint: { fontSize: 9.5, textAlign: 'center', marginTop: 8, letterSpacing: 0.5 },
  effectGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 6 },
  effectCell: { width: '30%', aspectRatio: 1.3, borderRadius: 6, alignItems: 'center', justifyContent: 'center', gap: 3, padding: 4 },
  effectCellEmoji: { fontSize: 18 },
  effectCellLabel: { fontSize: 7.5, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '80%', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginVertical: 12 },
  modalTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2, paddingHorizontal: 16, paddingBottom: 12 },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1 },
  modalItemEmoji: { fontSize: 22 },
  modalItemLabel: { flex: 1, fontSize: 13, fontWeight: '500' },
});
