import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { SUBTITLE_LANGS } from '@/services/translation';
import { SubtitleSettings } from '@/constants/theme';
import { useAlert } from '@/template';

const FONT_OPTIONS: SubtitleSettings['fontFamily'][] = ['system', 'serif', 'monospace'];
const FONT_LABELS: Record<SubtitleSettings['fontFamily'], string> = {
  system: 'System Default', serif: 'Serif Classic', monospace: 'Monospace',
};

export default function SubtitlesManager() {
  const { isAdminLoggedIn, subtitleSettings, updateSubtitleSettings, activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const s = subtitleSettings;
  const [editingLang, setEditingLang] = useState<string | null>(null);
  const [bgColorInput, setBgColorInput] = useState('');
  const [textColorInput, setTextColorInput] = useState('');

  const resetSettings = () => {
    updateSubtitleSettings({
      fontSize: 10, fontFamily: 'system', textBrightness: 1,
      speed: 28000, rowHeight: 22, showBadge: true, showArrow: true,
      customBgColors: {}, customTextColors: {}, textShadow: true,
      glowEffect: false, roundedBadge: false,
    });
    showAlert('Reset', 'Subtitle settings reset to defaults.');
  };

  const applyLangColors = (code: string) => {
    const bgUpdates = bgColorInput ? { ...s.customBgColors, [code]: bgColorInput } : s.customBgColors;
    const txUpdates = textColorInput ? { ...s.customTextColors, [code]: textColorInput } : s.customTextColors;
    updateSubtitleSettings({ customBgColors: bgUpdates, customTextColors: txUpdates });
    setEditingLang(null);
    setBgColorInput('');
    setTextColorInput('');
    showAlert('Applied', `Custom colors set for ${code.toUpperCase()}`);
  };

  const resetLangColors = (code: string) => {
    const bg = { ...s.customBgColors }; delete bg[code];
    const tx = { ...s.customTextColors }; delete tx[code];
    updateSubtitleSettings({ customBgColors: bg, customTextColors: tx });
  };

  const lbl = [sStyles.label, { color: theme.primary }];
  const inp = [sStyles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];

  return (
    <View style={[sStyles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[sStyles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[sStyles.title, { color: theme.text }]}>SUBTITLES MANAGER</Text>
          <TouchableOpacity onPress={resetSettings} style={[sStyles.resetBtn, { borderColor: theme.primary + '66' }]}>
            <MaterialIcons name="refresh" size={14} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={sStyles.scroll} showsVerticalScrollIndicator={false}>

          {/* Typography */}
          <View style={[sStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[sStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="text-fields" size={16} color={theme.gold} />
              <Text style={[sStyles.cardTitle, { color: theme.gold }]}>TYPOGRAPHY</Text>
            </View>
            <View style={sStyles.cardBody}>
              {/* Font Family */}
              <Text style={lbl}>FONT FAMILY</Text>
              <View style={sStyles.optionRow}>
                {FONT_OPTIONS.map(f => (
                  <TouchableOpacity key={f} onPress={() => updateSubtitleSettings({ fontFamily: f })}
                    style={[sStyles.optionBtn, { backgroundColor: s.fontFamily === f ? theme.primary : theme.surface2, borderColor: theme.primary + '55' }]}>
                    <Text style={[sStyles.optionBtnText, { color: s.fontFamily === f ? '#fff' : theme.textMuted, fontFamily: f === 'system' ? undefined : f }]}>
                      {FONT_LABELS[f]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Font Size */}
              <Text style={lbl}>FONT SIZE: {s.fontSize}px</Text>
              <View style={sStyles.sizeRow}>
                {[8, 9, 10, 11, 12, 13, 14, 16].map(sz => (
                  <TouchableOpacity key={sz} onPress={() => updateSubtitleSettings({ fontSize: sz })}
                    style={[sStyles.sizeBtn, { backgroundColor: s.fontSize === sz ? theme.primary : theme.surface2, borderColor: theme.primary + '44' }]}>
                    <Text style={[sStyles.sizeBtnText, { color: s.fontSize === sz ? '#fff' : theme.textMuted, fontSize: sz }]}>{sz}</Text>
                  </TouchableOpacity>
                ))}
              </View>

          {/* Row Height + Width */}
              <Text style={lbl}>ROW HEIGHT: {s.rowHeight}px</Text>
              <View style={sStyles.sizeRow}>
                {[18, 20, 22, 24, 26, 28, 30, 34].map(h => (
                  <TouchableOpacity key={h} onPress={() => updateSubtitleSettings({ rowHeight: h })}
                    style={[sStyles.sizeBtn, { backgroundColor: s.rowHeight === h ? theme.primary : theme.surface2, borderColor: theme.primary + '44' }]}>
                    <Text style={[sStyles.sizeBtnText, { color: s.rowHeight === h ? '#fff' : theme.textMuted }]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={lbl}>STRIP WIDTH: {s.rowWidthPercent ?? 100}% of screen</Text>
              <View style={sStyles.sizeRow}>
                {[50, 60, 70, 80, 90, 100].map(w => (
                  <TouchableOpacity key={w} onPress={() => updateSubtitleSettings({ rowWidthPercent: w })}
                    style={[sStyles.sizeBtn, { backgroundColor: (s.rowWidthPercent ?? 100) === w ? theme.primary : theme.surface2, borderColor: theme.primary + '44' }]}>
                    <Text style={[sStyles.sizeBtnText, { color: (s.rowWidthPercent ?? 100) === w ? '#fff' : theme.textMuted }]}>{w}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Speed */}
          <View style={[sStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[sStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="speed" size={16} color={theme.gold} />
              <Text style={[sStyles.cardTitle, { color: theme.gold }]}>SCROLL SPEED</Text>
            </View>
            <View style={sStyles.cardBody}>
              <Text style={[sStyles.speedNote, { color: theme.textDim }]}>Lower = faster scrolling</Text>
              <View style={sStyles.sizeRow}>
                {[
                  { label: 'Ultra Fast', val: 12000 },
                  { label: 'Fast', val: 18000 },
                  { label: 'Normal', val: 28000 },
                  { label: 'Slow', val: 40000 },
                  { label: 'Very Slow', val: 55000 },
                ].map(opt => (
                  <TouchableOpacity key={opt.val} onPress={() => updateSubtitleSettings({ speed: opt.val })}
                    style={[sStyles.speedBtn, { backgroundColor: s.speed === opt.val ? theme.primary : theme.surface2, borderColor: theme.primary + '44' }]}>
                    <Text style={[sStyles.speedBtnText, { color: s.speed === opt.val ? '#fff' : theme.textMuted }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Visual Effects */}
          <View style={[sStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[sStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="auto-awesome" size={16} color={theme.gold} />
              <Text style={[sStyles.cardTitle, { color: theme.gold }]}>VISUAL EFFECTS</Text>
            </View>
            <View style={sStyles.cardBody}>
              {[
                { key: 'showBadge', label: 'Show Language Badge', desc: 'Display lang code on left' },
                { key: 'showArrow', label: 'Show Direction Arrow', desc: 'Show ← → scroll direction' },
                { key: 'textShadow', label: 'Text Shadow/Glow', desc: 'Subtle glow behind text' },
                { key: 'glowEffect', label: 'Strong Neon Glow', desc: 'Intense neon text effect' },
                { key: 'roundedBadge', label: 'Rounded Badge', desc: 'Pill-shaped lang badges' },
              ].map(item => (
                <View key={item.key} style={[sStyles.toggleRow, { borderBottomColor: theme.primary + '15' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[sStyles.toggleLabel, { color: theme.text }]}>{item.label}</Text>
                    <Text style={[sStyles.toggleDesc, { color: theme.textDim }]}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={s[item.key as keyof typeof s] as boolean}
                    onValueChange={v => updateSubtitleSettings({ [item.key]: v })}
                    trackColor={{ true: theme.primary + '99' }}
                    thumbColor={s[item.key as keyof typeof s] ? theme.primary : '#aaa'}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Per-Language Colors + Enable/Disable */}
          <View style={[sStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[sStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="palette" size={16} color={theme.gold} />
              <Text style={[sStyles.cardTitle, { color: theme.gold }]}>PER-LANGUAGE CUSTOMIZE</Text>
            </View>
            <View style={sStyles.cardBody}>
              <Text style={[sStyles.colorNote, { color: theme.textDim }]}>
                Enable/disable individual languages. Customize background and text colors per language.
              </Text>
              {SUBTITLE_LANGS.map(lang => {
                const hasCustBg = !!s.customBgColors[lang.code];
                const hasCustTx = !!s.customTextColors[lang.code];
                const isEditing = editingLang === lang.code;
                const isEnabled = (s.customEnabled ?? {})[lang.code] !== false;
                return (
                  <View key={lang.code} style={[sStyles.langColorRow, { borderBottomColor: theme.primary + '15' }]}>
                    <View style={[sStyles.langColorSwatch, { backgroundColor: s.customBgColors[lang.code] || lang.bgColor }]} />
                    <View style={[sStyles.langTextSwatch, { backgroundColor: s.customTextColors[lang.code] || lang.textColor }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[sStyles.langColorName, { color: isEnabled ? theme.text : theme.textDim }]}>{lang.nativeLabel} ({lang.code.toUpperCase()})</Text>
                      <Text style={[{ fontSize: 8, color: isEnabled ? theme.primary : theme.textDim }]}>{isEnabled ? 'Enabled' : 'Disabled'}</Text>
                    </View>
                    {/* Enable/Disable toggle */}
                    <TouchableOpacity
                      onPress={() => {
                        const updated = { ...(s.customEnabled ?? {}), [lang.code]: !isEnabled };
                        updateSubtitleSettings({ customEnabled: updated });
                      }}
                      style={[sStyles.langToggleBtn, { backgroundColor: isEnabled ? theme.primary + '33' : theme.surface2, borderColor: theme.primary + '44' }]}
                    >
                      <MaterialIcons name={isEnabled ? 'toggle-on' : 'toggle-off'} size={18} color={isEnabled ? theme.primary : theme.textDim} />
                    </TouchableOpacity>
                    {(hasCustBg || hasCustTx) && (
                      <TouchableOpacity onPress={() => resetLangColors(lang.code)} style={sStyles.langColorReset}>
                        <MaterialIcons name="refresh" size={12} color="#ff9800" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => { setEditingLang(isEditing ? null : lang.code); setBgColorInput(s.customBgColors[lang.code] || lang.bgColor); setTextColorInput(s.customTextColors[lang.code] || lang.textColor); }}
                      style={[sStyles.langColorEdit, { backgroundColor: theme.primary + '22' }]}>
                      <MaterialIcons name={isEditing ? 'close' : 'edit'} size={12} color={theme.primary} />
                    </TouchableOpacity>

                    {isEditing && (
                      <View style={[sStyles.colorEditor, { backgroundColor: theme.surface2, borderColor: theme.primary + '44' }]}>
                        <View style={sStyles.colorEditorRow}>
                          <Text style={[sStyles.colorEditorLabel, { color: theme.textMuted }]}>BG:</Text>
                          <TextInput style={[sStyles.colorInput, { color: theme.text, borderColor: theme.primary + '44' }]} value={bgColorInput} onChangeText={setBgColorInput} placeholder="#000000" placeholderTextColor={theme.textDim} autoCapitalize="none" />
                        </View>
                        <View style={sStyles.colorEditorRow}>
                          <Text style={[sStyles.colorEditorLabel, { color: theme.textMuted }]}>TXT:</Text>
                          <TextInput style={[sStyles.colorInput, { color: theme.text, borderColor: theme.primary + '44' }]} value={textColorInput} onChangeText={setTextColorInput} placeholder="#ffffff" placeholderTextColor={theme.textDim} autoCapitalize="none" />
                        </View>
                        <TouchableOpacity onPress={() => applyLangColors(lang.code)} style={[sStyles.applyColorBtn, { backgroundColor: theme.primary }]}>
                          <Text style={sStyles.applyColorText}>Apply</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const sStyles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  title: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  resetBtn: { padding: 6, borderWidth: 1, borderRadius: 4 },
  scroll: { padding: 14, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  cardTitle: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  cardBody: { padding: 14 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 6, marginTop: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 8, fontSize: 12 },
  optionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  optionBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4, borderWidth: 1 },
  optionBtnText: { fontSize: 11, fontWeight: '500' },
  sizeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 },
  sizeBtn: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 4, borderWidth: 1 },
  sizeBtnText: { fontWeight: '600' },
  speedNote: { fontSize: 10, marginBottom: 8 },
  speedBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 4, borderWidth: 1, marginBottom: 4 },
  speedBtnText: { fontSize: 10, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  toggleDesc: { fontSize: 9, marginTop: 2 },
  colorNote: { fontSize: 10, marginBottom: 10, lineHeight: 16 },
  langColorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderBottomWidth: 1, flexWrap: 'wrap' },
  langColorSwatch: { width: 20, height: 20, borderRadius: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  langTextSwatch: { width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  langColorName: { flex: 1, fontSize: 12 },
  langToggleBtn: { padding: 5, borderRadius: 4, borderWidth: 1 },
  langColorReset: { padding: 4 },
  langColorEdit: { padding: 5, borderRadius: 4 },
  colorEditor: { width: '100%', borderRadius: 6, borderWidth: 1, padding: 10, marginTop: 4, gap: 6 },
  colorEditorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorEditorLabel: { fontSize: 11, fontWeight: '700', width: 30 },
  colorInput: { flex: 1, borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5, fontSize: 12 },
  applyColorBtn: { alignSelf: 'flex-end', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 4 },
  applyColorText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
