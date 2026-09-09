import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { NewsItem, NewsSection } from '@/constants/theme';
import T from '@/constants/translations';
import { useAlert } from '@/template';
import { translateToAllLanguages } from '@/services/translation';

type FormState = {
  en: string; ur: string;
  cat: string; catUr: string;
  section: NewsSection;
  imageUri: string | null;
  imageUris: string[];
  videoUris: string[];
  isBreaking: boolean;
  isEnabled: boolean;
  durationSec: number;
  repeatCount: number;
  translations?: Record<string, string>;
  scheduledAt?: string;
};

const EMPTY_FORM: FormState = {
  en: '', ur: '', cat: 'BREAKING', catUr: 'بریکنگ',
  section: 'regular',
  imageUri: null, imageUris: [], videoUris: [],
  isBreaking: false, isEnabled: true,
  durationSec: 10, repeatCount: 1,
  translations: {},
  scheduledAt: undefined,
};

const SECTION_LABELS: Record<NewsSection, string> = {
  ticker: '📰 Ticker', breaking: '🔴 Breaking', regular: '📺 Regular',
};

type TabType = 'all' | NewsSection | 'scheduled';

// ─── Countdown component ──────────────────────────────────────────────────────
function CountdownBadge({ scheduledAt, theme }: { scheduledAt: string; theme: any }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('PUBLISHING...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  return (
    <View style={[cdStyles.badge, { borderColor: theme.gold + '66', backgroundColor: theme.gold + '15' }]}>
      <MaterialIcons name="schedule" size={10} color={theme.gold} />
      <Text style={[cdStyles.text, { color: theme.gold }]}>{timeLeft}</Text>
    </View>
  );
}

const cdStyles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  text: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});

// ─── Date Time Picker (custom inline) ────────────────────────────────────────
function DateTimePicker({
  value, onChange, theme, onClose,
}: { value: string; onChange: (iso: string) => void; theme: any; onClose: () => void }) {
  const now = new Date();
  const initial = value ? new Date(value) : new Date(now.getTime() + 60 * 60 * 1000);

  const [year, setYear] = useState(String(initial.getFullYear()));
  const [month, setMonth] = useState(String(initial.getMonth() + 1).padStart(2, '0'));
  const [day, setDay] = useState(String(initial.getDate()).padStart(2, '0'));
  const [hour, setHour] = useState(String(initial.getHours()).padStart(2, '0'));
  const [minute, setMinute] = useState(String(initial.getMinutes()).padStart(2, '0'));

  const presets = [
    { label: '+1 Hour', ms: 3600000 },
    { label: '+3 Hours', ms: 10800000 },
    { label: '+6 Hours', ms: 21600000 },
    { label: 'Tomorrow 9am', ms: 0, fn: () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d.toISOString(); } },
    { label: 'Tonight 8pm', ms: 0, fn: () => { const d = new Date(); d.setHours(20, 0, 0, 0); return d.toISOString(); } },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    const d = p.fn ? new Date(p.fn()) : new Date(Date.now() + p.ms);
    setYear(String(d.getFullYear()));
    setMonth(String(d.getMonth() + 1).padStart(2, '0'));
    setDay(String(d.getDate()).padStart(2, '0'));
    setHour(String(d.getHours()).padStart(2, '0'));
    setMinute(String(d.getMinutes()).padStart(2, '0'));
  };

  const confirm = () => {
    try {
      const iso = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`).toISOString();
      onChange(iso);
      onClose();
    } catch {
      // invalid date — ignore
    }
  };

  const fieldStyle = [dtStyles.field, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];

  return (
    <View style={[dtStyles.container, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
      <Text style={[dtStyles.title, { color: theme.gold }]}>⏱ SCHEDULE PUBLISH TIME</Text>

      {/* Quick presets */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {presets.map(p => (
            <TouchableOpacity
              key={p.label}
              onPress={() => applyPreset(p)}
              style={[dtStyles.preset, { backgroundColor: theme.primary + '22', borderColor: theme.primary + '55' }]}
            >
              <Text style={[dtStyles.presetText, { color: theme.primary }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Date fields */}
      <Text style={[dtStyles.label, { color: theme.textMuted }]}>DATE</Text>
      <View style={dtStyles.row}>
        <TextInput style={[fieldStyle, { flex: 2 }]} value={year} onChangeText={setYear} keyboardType="numeric" maxLength={4} placeholder="YYYY" placeholderTextColor={theme.textDim} />
        <Text style={[dtStyles.sep, { color: theme.textDim }]}>/</Text>
        <TextInput style={[fieldStyle, { flex: 1 }]} value={month} onChangeText={setMonth} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor={theme.textDim} />
        <Text style={[dtStyles.sep, { color: theme.textDim }]}>/</Text>
        <TextInput style={[fieldStyle, { flex: 1 }]} value={day} onChangeText={setDay} keyboardType="numeric" maxLength={2} placeholder="DD" placeholderTextColor={theme.textDim} />
      </View>

      <Text style={[dtStyles.label, { color: theme.textMuted, marginTop: 8 }]}>TIME (24H)</Text>
      <View style={dtStyles.row}>
        <TextInput style={[fieldStyle, { flex: 1 }]} value={hour} onChangeText={setHour} keyboardType="numeric" maxLength={2} placeholder="HH" placeholderTextColor={theme.textDim} />
        <Text style={[dtStyles.sep, { color: theme.textDim }]}>:</Text>
        <TextInput style={[fieldStyle, { flex: 1 }]} value={minute} onChangeText={setMinute} keyboardType="numeric" maxLength={2} placeholder="MM" placeholderTextColor={theme.textDim} />
      </View>

      {/* Preview */}
      <Text style={[dtStyles.preview, { color: theme.textDim }]}>
        Publish at: {year}-{month}-{day} {hour}:{minute}
      </Text>

      <View style={dtStyles.btnRow}>
        <TouchableOpacity onPress={onClose} style={[dtStyles.btn, { borderColor: theme.textDim, borderWidth: 1 }]}>
          <Text style={[dtStyles.btnText, { color: theme.textMuted }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirm} style={[dtStyles.btn, { backgroundColor: theme.primary }]}>
          <MaterialIcons name="schedule" size={14} color="#fff" />
          <Text style={[dtStyles.btnText, { color: '#fff' }]}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dtStyles = StyleSheet.create({
  container: { borderRadius: 8, borderWidth: 1, padding: 16, marginBottom: 12 },
  title: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  field: { borderWidth: 1, borderRadius: 4, padding: 8, fontSize: 14, fontWeight: '700', textAlign: 'center', height: 40 },
  sep: { fontSize: 20, fontWeight: '800' },
  preset: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 5, borderWidth: 1 },
  presetText: { fontSize: 10, fontWeight: '600' },
  preview: { fontSize: 10, marginTop: 10, marginBottom: 8, letterSpacing: 0.5 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, padding: 10, borderRadius: 5 },
  btnText: { fontSize: 12, fontWeight: '700' },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function NewsEditor() {
  const {
    isAdminLoggedIn, newsItems, addNews, updateNews, deleteNews,
    publishNews, scheduleNews, toggleNewsEnabled, activeLauncher, language,
  } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [filterTab, setFilterTab] = useState<TabType>('all');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ─── Auto-translate ──────────────────────────────────────────────────────
  const autoTranslate = useCallback(async (urText: string): Promise<Record<string, string>> => {
    if (!urText.trim()) return {};
    try {
      setIsTranslating(true);
      return await translateToAllLanguages(urText);
    } catch { return {}; }
    finally { setIsTranslating(false); }
  }, []);

  const handleTranslateNow = useCallback(async () => {
    if (!form.ur.trim()) { showAlert('Error', 'Please enter Urdu text first.'); return; }
    const result = await autoTranslate(form.ur);
    setForm(p => ({
      ...p,
      en: p.en || result['en'] || p.en,
      translations: { ...result, ur: p.ur },
    }));
    showAlert('Translated!', `Auto-translated to ${Object.keys(result).length} languages.`);
  }, [form.ur, autoTranslate, showAlert]);

  const openEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setForm({
      en: item.en, ur: item.ur, cat: item.cat, catUr: item.catUr,
      section: item.section || 'regular',
      imageUri: item.imageUri, imageUris: item.imageUris || [],
      videoUris: item.videoUris || [],
      isBreaking: item.isBreaking, isEnabled: item.isEnabled ?? true,
      durationSec: item.durationSec || 10, repeatCount: item.repeatCount || 1,
      translations: item.translations || {},
      scheduledAt: item.scheduledAt,
    });
  };

  const openAdd = () => { setEditingId('new'); setForm(EMPTY_FORM); };

  const handleSave = async () => {
    if (!form.ur.trim() && !form.en.trim()) {
      showAlert('Error', 'Please enter Urdu or English headline.');
      return;
    }
    let translations = form.translations || {};
    if (form.ur.trim() && Object.keys(translations).length === 0) {
      translations = await autoTranslate(form.ur);
    }
    const finalEn = form.en.trim() || translations['en'] || form.ur;
    const payload = { ...form, en: finalEn, translations, isPublished: false };

    if (editingId === 'new') {
      addNews(payload);
      showAlert('Saved ✓', `News saved with ${Object.keys(translations).length} translations. Tap "Release" to publish.`);
    } else if (editingId) {
      updateNews(editingId, { ...form, en: finalEn, translations });
      showAlert('Updated ✓', 'News updated.');
    }
    setEditingId(null);
  };

  const handleRelease = (id: string) => {
    publishNews(id);
    showAlert('Published 🔴', 'News is now LIVE on channel!');
  };

  const handleSchedule = (id: string, scheduledAt: string) => {
    scheduleNews(id, scheduledAt);
    const d = new Date(scheduledAt);
    showAlert('Scheduled ⏱', `News will auto-publish at ${d.toLocaleString()}`);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete News', 'Remove this news item permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteNews(id); if (editingId === id) setEditingId(null); } },
    ]);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Photo library access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1,
      allowsMultipleSelection: true, selectionLimit: 5,
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map(a => a.uri);
      setForm(p => ({
        ...p, imageUri: p.imageUri || uris[0],
        imageUris: [...(p.imageUris || []), ...uris].slice(0, 5),
      }));
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Photo library access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos, quality: 1,
      allowsMultipleSelection: true, selectionLimit: 5,
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map(a => a.uri);
      setForm(p => ({ ...p, videoUris: [...(p.videoUris || []), ...uris].slice(0, 5) }));
    }
  };

  const removeImage = (idx: number) => {
    setForm(p => {
      const n = p.imageUris.filter((_, i) => i !== idx);
      return { ...p, imageUris: n, imageUri: n[0] || null };
    });
  };
  const removeVideo = (idx: number) => {
    setForm(p => ({ ...p, videoUris: p.videoUris.filter((_, i) => i !== idx) }));
  };

  // Filter items by tab
  const scheduledItems = newsItems.filter(n => n.scheduledAt && !n.isPublished);
  const filteredItems = filterTab === 'all'
    ? newsItems
    : filterTab === 'scheduled'
    ? scheduledItems
    : newsItems.filter(n => (n.section || 'regular') === filterTab);

  const inp = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];
  const lbl = [styles.label, { color: theme.primary }];
  const transCount = Object.keys(form.translations || {}).filter(k => k !== 'ur' && (form.translations as any)?.[k]).length;

  // Scheduled items tab stats
  const tabCounts: Record<string, number> = {
    all: newsItems.length,
    ticker: newsItems.filter(n => n.section === 'ticker').length,
    breaking: newsItems.filter(n => n.section === 'breaking').length,
    regular: newsItems.filter(n => n.section === 'regular').length,
    scheduled: scheduledItems.length,
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => { setEditingId(null); router.back(); }}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.newsEditor}</Text>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── FILTER TABS ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['all', 'ticker', 'breaking', 'regular', 'scheduled'] as TabType[]).map(tab => {
                const count = tabCounts[tab] ?? 0;
                const isActive = filterTab === tab;
                const isScheduledTab = tab === 'scheduled';
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setFilterTab(tab)}
                    style={[styles.filterTab, {
                      backgroundColor: isActive
                        ? (isScheduledTab ? theme.gold : theme.primary)
                        : theme.surface2,
                      borderColor: isScheduledTab ? theme.gold + '55' : theme.primary + '55',
                    }]}
                  >
                    <Text style={[styles.filterTabText, {
                      color: isActive ? '#fff' : (isScheduledTab ? theme.gold : theme.textMuted),
                    }]}>
                      {tab === 'all' ? '📋 All' : tab === 'scheduled' ? '⏱ Sched.' : SECTION_LABELS[tab as NewsSection]}
                      {count > 0 ? ` (${count})` : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ── EDITOR FORM ── */}
          {editingId !== null && (
            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.gold + '55' }]}>
              <LinearGradient colors={[theme.primary + '18', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <Text style={[styles.formTitle, { color: theme.gold }]}>
                {editingId === 'new' ? '+ NEW NEWS ITEM' : '✏ EDIT NEWS ITEM'}
              </Text>

              {/* Section selector */}
              <Text style={lbl}>SECTION TYPE</Text>
              <View style={styles.sectionRow}>
                {(['ticker', 'breaking', 'regular'] as NewsSection[]).map(sec => (
                  <TouchableOpacity
                    key={sec}
                    onPress={() => setForm(p => ({ ...p, section: sec, isBreaking: sec === 'breaking' }))}
                    style={[styles.secBtn, {
                      backgroundColor: form.section === sec ? theme.primary : theme.surface2,
                      borderColor: theme.primary + '55',
                    }]}
                  >
                    <Text style={[styles.secBtnText, { color: form.section === sec ? '#fff' : theme.textMuted }]}>
                      {SECTION_LABELS[sec]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Urdu text */}
              <Text style={lbl}>اردو سرخی ★ (خودکار ترجمہ)</Text>
              <TextInput
                style={[inp, styles.urduInput]}
                value={form.ur}
                onChangeText={v => setForm(p => ({ ...p, ur: v }))}
                placeholder="اردو سرخی یہاں لکھیں ..."
                placeholderTextColor={theme.textDim}
                multiline
                textAlign="right"
              />

              {/* Translate button */}
              <TouchableOpacity
                onPress={handleTranslateNow}
                style={[styles.translateBtn, { backgroundColor: theme.primary + '22', borderColor: theme.primary + '66' }]}
                disabled={isTranslating}
              >
                {isTranslating
                  ? <ActivityIndicator size="small" color={theme.primary} />
                  : <MaterialIcons name="translate" size={16} color={theme.primary} />
                }
                <Text style={[styles.translateBtnText, { color: theme.primary }]}>
                  {isTranslating ? 'Translating to 11 languages...'
                    : transCount > 0 ? `✓ ${transCount} languages — Re-translate`
                    : 'Auto-Translate to 11 Languages'}
                </Text>
              </TouchableOpacity>

              {transCount > 0 && (
                <View style={[styles.transStatus, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '33' }]}>
                  <Text style={[styles.transStatusText, { color: theme.primary }]}>
                    ✓ {Object.keys(form.translations || {}).filter(k => k !== 'ur').join(' · ').toUpperCase()}
                  </Text>
                </View>
              )}

              {/* English */}
              <Text style={lbl}>{t.headlineEn} (auto-filled)</Text>
              <TextInput
                style={inp}
                value={form.en}
                onChangeText={v => setForm(p => ({ ...p, en: v }))}
                placeholder="English headline (optional — auto-translated)"
                placeholderTextColor={theme.textDim}
                multiline
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>{t.category}</Text>
                  <TextInput style={inp} value={form.cat} onChangeText={v => setForm(p => ({ ...p, cat: v }))} placeholderTextColor={theme.textDim} />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>{t.categoryUr}</Text>
                  <TextInput style={[inp, { textAlign: 'right' }]} value={form.catUr} onChangeText={v => setForm(p => ({ ...p, catUr: v }))} placeholderTextColor={theme.textDim} />
                </View>
              </View>

              {/* Duration & Repeat */}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>DURATION (sec)</Text>
                  <TextInput style={inp} value={String(form.durationSec)} onChangeText={v => setForm(p => ({ ...p, durationSec: parseInt(v) || 10 }))} keyboardType="numeric" placeholderTextColor={theme.textDim} />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>REPEAT</Text>
                  <TextInput style={inp} value={String(form.repeatCount)} onChangeText={v => setForm(p => ({ ...p, repeatCount: parseInt(v) || 1 }))} keyboardType="numeric" placeholderTextColor={theme.textDim} />
                </View>
              </View>

              {/* ── SCHEDULE SECTION ── */}
              <View style={[styles.scheduleSection, { backgroundColor: theme.gold + '0F', borderColor: theme.gold + '44' }]}>
                <View style={styles.scheduleHeader}>
                  <MaterialIcons name="schedule" size={15} color={theme.gold} />
                  <Text style={[styles.scheduleTitle, { color: theme.gold }]}>SCHEDULE AUTO-PUBLISH</Text>
                  {form.scheduledAt && (
                    <TouchableOpacity
                      onPress={() => setForm(p => ({ ...p, scheduledAt: undefined }))}
                      style={[styles.clearScheduleBtn, { borderColor: '#ff5252' }]}
                    >
                      <MaterialIcons name="close" size={10} color="#ff5252" />
                      <Text style={styles.clearScheduleText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {form.scheduledAt ? (
                  <View style={styles.scheduledInfo}>
                    <MaterialIcons name="event" size={13} color={theme.gold} />
                    <Text style={[styles.scheduledTime, { color: theme.textMuted }]}>
                      {new Date(form.scheduledAt).toLocaleString()}
                    </Text>
                    <CountdownBadge scheduledAt={form.scheduledAt} theme={theme} />
                  </View>
                ) : (
                  <Text style={[styles.scheduleHint, { color: theme.textDim }]}>
                    Tap below to schedule this news item for automatic future publishing.
                  </Text>
                )}
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={[styles.schedulePickerBtn, { backgroundColor: theme.gold + '22', borderColor: theme.gold + '55' }]}
                >
                  <MaterialIcons name="event" size={14} color={theme.gold} />
                  <Text style={[styles.schedulePickerBtnText, { color: theme.gold }]}>
                    {form.scheduledAt ? 'Change Schedule' : 'Pick Date & Time'}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={form.scheduledAt || ''}
                    onChange={iso => setForm(p => ({ ...p, scheduledAt: iso }))}
                    theme={theme}
                    onClose={() => setShowDatePicker(false)}
                  />
                )}
              </View>

              {/* IMAGES */}
              <Text style={lbl}>📸 IMAGES (up to 5)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
                {form.imageUris.map((uri, idx) => (
                  <View key={idx} style={styles.mediaThumbWrap}>
                    <Image source={{ uri }} style={styles.mediaThumb} contentFit="cover" />
                    <TouchableOpacity style={[styles.mediaRemoveBtn, { backgroundColor: theme.primary }]} onPress={() => removeImage(idx)}>
                      <MaterialIcons name="close" size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {form.imageUris.length < 5 && (
                  <TouchableOpacity
                    onPress={pickImage}
                    style={[styles.mediaAddBtn, { borderColor: theme.primary + '88', backgroundColor: theme.primary + '18' }]}
                  >
                    <MaterialIcons name="add-photo-alternate" size={24} color={theme.primary} />
                    <Text style={[styles.mediaAddText, { color: theme.primary }]}>Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* VIDEOS */}
              <Text style={lbl}>🎬 VIDEOS (up to 5)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaRow}>
                {form.videoUris.map((uri, idx) => (
                  <View key={idx} style={[styles.mediaThumbWrap, { backgroundColor: theme.surface2 }]}>
                    <View style={[styles.videoThumb, { backgroundColor: theme.surface2 }]}>
                      <MaterialIcons name="play-circle-filled" size={28} color={theme.primary} />
                      <Text style={[styles.videoIdx, { color: theme.textMuted }]}>Clip {idx + 1}</Text>
                    </View>
                    <TouchableOpacity style={[styles.mediaRemoveBtn, { backgroundColor: theme.primary }]} onPress={() => removeVideo(idx)}>
                      <MaterialIcons name="close" size={10} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                {form.videoUris.length < 5 && (
                  <TouchableOpacity
                    onPress={pickVideo}
                    style={[styles.mediaAddBtn, { borderColor: theme.primary + '88', backgroundColor: theme.primary + '18' }]}
                  >
                    <MaterialIcons name="video-library" size={24} color={theme.primary} />
                    <Text style={[styles.mediaAddText, { color: theme.primary }]}>Add</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {/* Breaking toggle */}
              <View style={[styles.toggleRow, { borderColor: theme.primary + '33' }]}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>{t.isBreaking}</Text>
                <Switch value={form.isBreaking} onValueChange={v => setForm(p => ({ ...p, isBreaking: v }))} trackColor={{ true: theme.primary + '99' }} thumbColor={form.isBreaking ? theme.primary : '#aaa'} />
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => setEditingId(null)} style={[styles.cancelBtn, { borderColor: theme.textDim }]}>
                  <Text style={[styles.cancelText, { color: theme.textMuted }]}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: isTranslating ? theme.surface2 : theme.primary }]}
                  disabled={isTranslating}
                >
                  {isTranslating ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="save" size={15} color="#fff" />}
                  <Text style={[styles.saveBtnText, { color: '#fff' }]}>{isTranslating ? 'Translating...' : t.save}</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.publishHint, { color: theme.textDim }]}>
                ★ Save → Translate 11 langs → Release LIVE or Schedule for future auto-publish
              </Text>
            </View>
          )}

          {/* ── STATS ── */}
          <View style={[styles.statsBar, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            {(['ticker', 'breaking', 'regular'] as NewsSection[]).map(sec => {
              const count = newsItems.filter(n => n.section === sec).length;
              const pub = newsItems.filter(n => n.section === sec && n.isPublished && n.isEnabled).length;
              return (
                <View key={sec} style={styles.statItem}>
                  <Text style={[styles.statCount, { color: theme.gold }]}>{pub}/{count}</Text>
                  <Text style={[styles.statLabel, { color: theme.textDim }]}>{sec}</Text>
                </View>
              );
            })}
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: theme.gold }]}>{scheduledItems.length}</Text>
              <Text style={[styles.statLabel, { color: theme.gold }]}>⏱ Sched.</Text>
            </View>
          </View>

          {/* ── SCHEDULED ITEMS SPECIAL VIEW ── */}
          {filterTab === 'scheduled' && (
            <View style={[styles.scheduledBanner, { backgroundColor: theme.gold + '15', borderColor: theme.gold + '44' }]}>
              <MaterialIcons name="schedule" size={14} color={theme.gold} />
              <Text style={[styles.scheduledBannerText, { color: theme.gold }]}>
                {scheduledItems.length > 0
                  ? `${scheduledItems.length} items scheduled for auto-publish. Checked every 60 seconds.`
                  : 'No scheduled items. Create a news item and set a schedule date/time.'}
              </Text>
            </View>
          )}

          <Text style={[styles.sectionLabel, { color: theme.textDim }]}>
            {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
          </Text>

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="article" size={40} color={theme.textDim} />
              <Text style={[styles.emptyText, { color: theme.textDim }]}>{t.noNewsItems}</Text>
            </View>
          )}

          {filteredItems.map(item => {
            const isLive = item.isPublished && item.isEnabled && !item.scheduledAt;
            const isScheduled = !item.isPublished && item.scheduledAt;
            const tCount = Object.keys(item.translations || {}).filter(k => k !== 'ur').length;
            return (
              <View key={item.id} style={[styles.newsCard, {
                backgroundColor: theme.surface,
                borderColor: isLive ? theme.primary + '88'
                  : isScheduled ? theme.gold + '66'
                  : item.isPublished ? theme.textDim + '55'
                  : theme.primary + '22',
                opacity: item.isEnabled ? 1 : 0.55,
              }]}>
                <View style={[styles.statusStripe, {
                  backgroundColor: isLive ? theme.primary
                    : isScheduled ? theme.gold
                    : item.isPublished ? theme.textDim
                    : 'transparent',
                }]} />
                <View style={styles.newsCardTop}>
                  {(item.imageUri || item.imageUris?.[0]) ? (
                    <Image source={{ uri: item.imageUri || item.imageUris[0] }} style={styles.newsThumb} contentFit="cover" />
                  ) : (
                    <View style={[styles.newsThumbPlaceholder, { backgroundColor: theme.surface2 }]}>
                      <MaterialIcons name={item.videoUris?.length ? 'videocam' : 'image'} size={20} color={theme.textDim} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.newsTopMeta}>
                      <Text style={[styles.newsSection, { color: theme.gold, backgroundColor: theme.gold + '22' }]}>
                        {SECTION_LABELS[item.section || 'regular']}
                      </Text>
                      <View style={[styles.newsPubBadge, { backgroundColor: isLive ? theme.primary + '33' : isScheduled ? theme.gold + '22' : theme.surface2 }]}>
                        <Text style={[styles.newsPubText, { color: isLive ? theme.primary : isScheduled ? theme.gold : theme.textDim }]}>
                          {isLive ? '● LIVE' : isScheduled ? '⏱ SCHED.' : item.isPublished ? '○ OFF' : '○ Draft'}
                        </Text>
                      </View>
                      {tCount > 0 && (
                        <Text style={[styles.transTag, { color: theme.primary, backgroundColor: theme.primary + '15' }]}>🌐 {tCount}</Text>
                      )}
                    </View>
                    <Text style={[styles.newsHeadUr, { color: theme.text }]} numberOfLines={2}>{item.ur || item.en}</Text>
                    <Text style={[styles.newsHeadEn, { color: theme.textMuted }]} numberOfLines={1}>{item.en}</Text>
                    {isScheduled && item.scheduledAt && (
                      <CountdownBadge scheduledAt={item.scheduledAt} theme={theme} />
                    )}
                    <View style={styles.newsMeta}>
                      {(item.imageUris?.length ?? 0) > 0 && <Text style={[styles.metaTag, { color: theme.textDim }]}>📸 {item.imageUris.length}</Text>}
                      {(item.videoUris?.length ?? 0) > 0 && <Text style={[styles.metaTag, { color: theme.textDim }]}>🎬 {item.videoUris.length}</Text>}
                      <Text style={[styles.metaTag, { color: theme.textDim }]}>⏱ {item.durationSec}s</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.newsActions, { borderTopColor: theme.primary + '22' }]}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={[styles.actionBtn, { borderRightColor: theme.primary + '22' }]}>
                    <MaterialIcons name="edit" size={13} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary }]}>{t.edit}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => toggleNewsEnabled(item.id)} style={[styles.actionBtn, { borderRightColor: theme.primary + '22' }]}>
                    <MaterialIcons name={item.isEnabled ? 'toggle-on' : 'toggle-off'} size={13} color={item.isEnabled ? theme.gold : theme.textDim} />
                    <Text style={[styles.actionBtnText, { color: item.isEnabled ? theme.gold : theme.textDim }]}>
                      {item.isEnabled ? 'On' : 'Off'}
                    </Text>
                  </TouchableOpacity>
                  {!item.isPublished && !item.scheduledAt && (
                    <TouchableOpacity
                      onPress={() => handleRelease(item.id)}
                      style={[styles.actionBtn, { borderRightColor: theme.primary + '22', backgroundColor: theme.primary + '18' }]}
                    >
                      <MaterialIcons name="publish" size={13} color={theme.primary} />
                      <Text style={[styles.actionBtnText, { color: theme.primary, fontWeight: '700' }]}>Release</Text>
                    </TouchableOpacity>
                  )}
                  {!item.isPublished && !item.scheduledAt && (
                    <TouchableOpacity
                      onPress={() => {
                        // Quick schedule +1 hour
                        handleSchedule(item.id, new Date(Date.now() + 3600000).toISOString());
                      }}
                      style={[styles.actionBtn, { borderRightColor: theme.primary + '22' }]}
                    >
                      <MaterialIcons name="schedule" size={13} color={theme.gold} />
                      <Text style={[styles.actionBtnText, { color: theme.gold }]}>+1h</Text>
                    </TouchableOpacity>
                  )}
                  {item.scheduledAt && !item.isPublished && (
                    <TouchableOpacity
                      onPress={() => updateNews(item.id, { scheduledAt: undefined })}
                      style={[styles.actionBtn, { borderRightColor: theme.primary + '22' }]}
                    >
                      <MaterialIcons name="cancel-schedule-send" size={13} color="#ff9800" />
                      <Text style={[styles.actionBtnText, { color: '#ff9800' }]}>Unsched.</Text>
                    </TouchableOpacity>
                  )}
                  {item.isPublished && (
                    <TouchableOpacity
                      onPress={() => updateNews(item.id, { isPublished: false })}
                      style={[styles.actionBtn, { borderRightColor: theme.primary + '22' }]}
                    >
                      <MaterialIcons name="stop" size={13} color="#ff9800" />
                      <Text style={[styles.actionBtnText, { color: '#ff9800' }]}>Stop</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}>
                    <MaterialIcons name="delete" size={13} color="#ff5252" />
                    <Text style={[styles.actionBtnText, { color: '#ff5252' }]}>{t.deleteItem}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1 },
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  addBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 14 },
  filterTab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  filterTabText: { fontSize: 11, fontWeight: '600' },
  formCard: { borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  formTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 13, marginBottom: 4, minHeight: 40 },
  urduInput: { textAlign: 'right', lineHeight: 24 },
  translateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 6, borderWidth: 1, marginTop: 6, marginBottom: 4 },
  translateBtnText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, flex: 1 },
  transStatus: { padding: 8, borderRadius: 4, borderWidth: 1, marginBottom: 8 },
  transStatusText: { fontSize: 9, fontWeight: '600', letterSpacing: 0.8 },
  transTag: { fontSize: 8, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  twoCol: { flexDirection: 'row', marginTop: 4 },
  sectionRow: { flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  secBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6, borderWidth: 1 },
  secBtnText: { fontSize: 11, fontWeight: '600' },

  // Schedule section
  scheduleSection: { borderRadius: 8, borderWidth: 1, padding: 12, marginTop: 10, marginBottom: 4 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  scheduleTitle: { flex: 1, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  clearScheduleBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, borderWidth: 1 },
  clearScheduleText: { color: '#ff5252', fontSize: 9, fontWeight: '600' },
  scheduleHint: { fontSize: 10, marginBottom: 8, lineHeight: 15 },
  scheduledInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  scheduledTime: { fontSize: 10, fontWeight: '600', flex: 1 },
  schedulePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 9, borderRadius: 6, borderWidth: 1 },
  schedulePickerBtnText: { fontSize: 12, fontWeight: '600' },

  mediaRow: { marginBottom: 8 },
  mediaThumbWrap: { width: 72, height: 72, borderRadius: 6, marginRight: 8, position: 'relative', overflow: 'hidden' },
  mediaThumb: { width: 72, height: 72 },
  videoThumb: { width: 72, height: 72, justifyContent: 'center', alignItems: 'center', borderRadius: 6 },
  videoIdx: { fontSize: 8, marginTop: 3 },
  mediaRemoveBtn: { position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  mediaAddBtn: { width: 72, height: 72, borderRadius: 6, borderWidth: 2, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  mediaAddText: { fontSize: 9, fontWeight: '600', marginTop: 2 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, marginTop: 8 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, padding: 11, borderRadius: 4, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 4 },
  saveBtnText: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  publishHint: { fontSize: 9.5, textAlign: 'center', marginTop: 8, letterSpacing: 0.5 },
  statsBar: { flexDirection: 'row', borderRadius: 6, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statCount: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, letterSpacing: 1, marginTop: 2 },
  scheduledBanner: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 6, borderWidth: 1, marginBottom: 10, alignItems: 'center' },
  scheduledBannerText: { flex: 1, fontSize: 10, lineHeight: 15 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
  emptyState: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { fontSize: 13 },
  newsCard: { borderRadius: 6, borderWidth: 1, marginBottom: 10, overflow: 'hidden', position: 'relative' },
  statusStripe: { height: 3, width: '100%' },
  newsCardTop: { flexDirection: 'row', gap: 10, padding: 10 },
  newsThumb: { width: 68, height: 64, borderRadius: 4 },
  newsThumbPlaceholder: { width: 68, height: 64, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  newsTopMeta: { flexDirection: 'row', gap: 5, marginBottom: 4, alignItems: 'center', flexWrap: 'wrap' },
  newsSection: { fontSize: 8.5, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  newsPubBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  newsPubText: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  newsHeadUr: { fontSize: 13, fontWeight: '600', lineHeight: 18, textAlign: 'right' },
  newsHeadEn: { fontSize: 10, marginTop: 2 },
  newsMeta: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  metaTag: { fontSize: 9.5, letterSpacing: 0.5 },
  newsActions: { flexDirection: 'row', borderTopWidth: 1, flexWrap: 'wrap' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, borderRightWidth: 1, minWidth: 50 },
  actionBtnText: { fontSize: 9.5, fontWeight: '600' },
});
