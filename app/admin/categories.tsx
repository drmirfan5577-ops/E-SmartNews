/**
 * Categories Manager — Create/edit/delete custom news categories
 * with Urdu/English names, emoji icon, and accent color.
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { useAlert } from '@/template';

const CAT_STORAGE_KEY = '@swn_categories_v1';

export type NewsCategory = {
  id: string;
  nameEn: string;
  nameUr: string;
  emoji: string;
  color: string;
  isActive: boolean;
  isDefault: boolean;
};

const DEFAULT_CATEGORIES: NewsCategory[] = [
  { id: 'cat_breaking', nameEn: 'Breaking', nameUr: 'بریکنگ', emoji: '🔴', color: '#ff1744', isActive: true, isDefault: true },
  { id: 'cat_world', nameEn: 'World News', nameUr: 'عالمی خبریں', emoji: '🌍', color: '#2979ff', isActive: true, isDefault: true },
  { id: 'cat_economy', nameEn: 'Economy', nameUr: 'معیشت', emoji: '💹', color: '#00c853', isActive: true, isDefault: true },
  { id: 'cat_sports', nameEn: 'Sports', nameUr: 'کھیل', emoji: '⚽', color: '#ff6d00', isActive: true, isDefault: true },
  { id: 'cat_politics', nameEn: 'Politics', nameUr: 'سیاست', emoji: '🏛️', color: '#aa00ff', isActive: true, isDefault: true },
  { id: 'cat_tech', nameEn: 'Technology', nameUr: 'ٹیکنالوجی', emoji: '💻', color: '#00bcd4', isActive: true, isDefault: true },
  { id: 'cat_health', nameEn: 'Health', nameUr: 'صحت', emoji: '🏥', color: '#e91e63', isActive: true, isDefault: true },
  { id: 'cat_culture', nameEn: 'Culture', nameUr: 'ثقافت', emoji: '🎭', color: '#ffc107', isActive: true, isDefault: true },
  { id: 'cat_science', nameEn: 'Science', nameUr: 'سائنس', emoji: '🔬', color: '#009688', isActive: true, isDefault: true },
  { id: 'cat_local', nameEn: 'Local', nameUr: 'مقامی', emoji: '📍', color: '#795548', isActive: true, isDefault: true },
];

const COLOR_PRESETS = [
  '#ff1744', '#f50057', '#d500f9', '#651fff', '#2979ff',
  '#00b0ff', '#00e5ff', '#1de9b6', '#00e676', '#76ff03',
  '#ffea00', '#ffc400', '#ff6d00', '#ff3d00', '#795548',
];

const EMOJI_PRESETS = [
  '🔴','🌍','💹','⚽','🏛️','💻','🏥','🎭','🔬','📍',
  '📰','📺','⚡','🌐','🎯','🔥','💰','✈️','🎵','🏆',
  '🌙','☀️','🌊','🏔️','🎪','📡','🛰️','🌺','🦁','🎬',
];

type FormState = {
  nameEn: string;
  nameUr: string;
  emoji: string;
  color: string;
};

const EMPTY_FORM: FormState = { nameEn: '', nameUr: '', emoji: '📰', color: '#2979ff' };

export default function CategoriesManager() {
  const { isAdminLoggedIn, activeLauncher } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [categories, setCategories] = useState<NewsCategory[]>(DEFAULT_CATEGORIES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Load categories from storage
  useEffect(() => {
    AsyncStorage.getItem(CAT_STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as NewsCategory[];
          if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
        } catch {}
      }
    });
  }, []);

  const save = (cats: NewsCategory[]) => {
    setCategories(cats);
    AsyncStorage.setItem(CAT_STORAGE_KEY, JSON.stringify(cats)).catch(() => {});
  };

  const openAdd = () => {
    setEditingId('new');
    setForm(EMPTY_FORM);
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  };

  const openEdit = (cat: NewsCategory) => {
    setEditingId(cat.id);
    setForm({ nameEn: cat.nameEn, nameUr: cat.nameUr, emoji: cat.emoji, color: cat.color });
    setShowEmojiPicker(false);
    setShowColorPicker(false);
  };

  const handleSave = () => {
    if (!form.nameEn.trim() && !form.nameUr.trim()) {
      showAlert('Error', 'Please enter a category name.');
      return;
    }
    if (editingId === 'new') {
      const newCat: NewsCategory = {
        id: `cat_${Date.now()}`,
        nameEn: form.nameEn.trim() || form.nameUr.trim(),
        nameUr: form.nameUr.trim() || form.nameEn.trim(),
        emoji: form.emoji,
        color: form.color,
        isActive: true,
        isDefault: false,
      };
      save([...categories, newCat]);
      showAlert('Added!', `Category "${newCat.nameEn}" created.`);
    } else if (editingId) {
      save(categories.map(c =>
        c.id === editingId
          ? { ...c, nameEn: form.nameEn, nameUr: form.nameUr, emoji: form.emoji, color: form.color }
          : c
      ));
      showAlert('Updated!', 'Category updated.');
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, isDefault: boolean) => {
    if (isDefault) { showAlert('Notice', 'Default categories cannot be deleted. You can disable them instead.'); return; }
    Alert.alert('Delete Category', 'Remove this category permanently?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => save(categories.filter(c => c.id !== id)) },
    ]);
  };

  const toggleActive = (id: string) => {
    save(categories.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const inp = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];
  const lbl = [styles.label, { color: theme.primary }];

  const activeCount = categories.filter(c => c.isActive).length;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => { setEditingId(null); router.back(); }}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>CATEGORY MANAGER</Text>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: theme.gold }]}>{categories.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: theme.primary }]}>{activeCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statCount, { color: theme.textMuted }]}>{categories.length - activeCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textDim }]}>Hidden</Text>
            </View>
          </View>

          {/* Editor form */}
          {editingId !== null && (
            <View style={[styles.form, { backgroundColor: theme.surface, borderColor: theme.gold + '55' }]}>
              <LinearGradient colors={[theme.primary + '15', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <Text style={[styles.formTitle, { color: theme.gold }]}>
                {editingId === 'new' ? '+ NEW CATEGORY' : '✏ EDIT CATEGORY'}
              </Text>

              {/* Emoji + color row */}
              <View style={styles.emojiColorRow}>
                <TouchableOpacity
                  onPress={() => { setShowEmojiPicker(p => !p); setShowColorPicker(false); }}
                  style={[styles.emojiBtn, { backgroundColor: theme.surface2, borderColor: theme.primary + '55' }]}
                >
                  <Text style={styles.emojiBtnIcon}>{form.emoji}</Text>
                  <Text style={[styles.emojiBtnLabel, { color: theme.textMuted }]}>Icon</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setShowColorPicker(p => !p); setShowEmojiPicker(false); }}
                  style={[styles.colorBtn, { backgroundColor: form.color + '22', borderColor: form.color + '88' }]}
                >
                  <View style={[styles.colorSwatch, { backgroundColor: form.color }]} />
                  <Text style={[styles.emojiBtnLabel, { color: theme.textMuted }]}>Color</Text>
                </TouchableOpacity>

                <View style={{ flex: 1, gap: 6 }}>
                  <TextInput
                    style={inp}
                    value={form.nameEn}
                    onChangeText={v => setForm(p => ({ ...p, nameEn: v }))}
                    placeholder="English name"
                    placeholderTextColor={theme.textDim}
                  />
                  <TextInput
                    style={[inp, { textAlign: 'right' }]}
                    value={form.nameUr}
                    onChangeText={v => setForm(p => ({ ...p, nameUr: v }))}
                    placeholder="اردو نام"
                    placeholderTextColor={theme.textDim}
                  />
                </View>
              </View>

              {/* Emoji picker */}
              {showEmojiPicker && (
                <View style={[styles.pickerGrid, { backgroundColor: theme.surface2, borderColor: theme.primary + '44' }]}>
                  <Text style={[styles.pickerLabel, { color: theme.textDim }]}>SELECT ICON</Text>
                  <View style={styles.emojiGrid}>
                    {EMOJI_PRESETS.map(em => (
                      <TouchableOpacity
                        key={em}
                        onPress={() => { setForm(p => ({ ...p, emoji: em })); setShowEmojiPicker(false); }}
                        style={[
                          styles.emojiOption,
                          form.emoji === em && { backgroundColor: theme.primary + '33' },
                        ]}
                      >
                        <Text style={styles.emojiOptionText}>{em}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Color picker */}
              {showColorPicker && (
                <View style={[styles.pickerGrid, { backgroundColor: theme.surface2, borderColor: theme.primary + '44' }]}>
                  <Text style={[styles.pickerLabel, { color: theme.textDim }]}>SELECT COLOR</Text>
                  <View style={styles.colorGrid}>
                    {COLOR_PRESETS.map(col => (
                      <TouchableOpacity
                        key={col}
                        onPress={() => { setForm(p => ({ ...p, color: col })); setShowColorPicker(false); }}
                        style={[
                          styles.colorOption,
                          { backgroundColor: col },
                          form.color === col && styles.colorOptionActive,
                        ]}
                      >
                        {form.color === col && (
                          <MaterialIcons name="check" size={14} color="#fff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  {/* Custom hex input */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <View style={[styles.colorSwatch, { backgroundColor: form.color, width: 28, height: 28, borderRadius: 4 }]} />
                    <TextInput
                      style={[inp, { flex: 1, fontFamily: 'monospace', fontSize: 12 }]}
                      value={form.color}
                      onChangeText={v => {
                        const hex = v.startsWith('#') ? v : `#${v}`;
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) setForm(p => ({ ...p, color: hex }));
                      }}
                      placeholder="#ffffff"
                      placeholderTextColor={theme.textDim}
                      maxLength={7}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                      <MaterialIcons name="check" size={20} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Preview */}
              <View style={[styles.previewRow, { backgroundColor: form.color + '18', borderColor: form.color + '66' }]}>
                <Text style={styles.previewEmoji}>{form.emoji}</Text>
                <Text style={[styles.previewName, { color: form.color }]}>
                  {form.nameEn || 'Category Name'} · {form.nameUr || 'نام'}
                </Text>
              </View>

              {/* Save / Cancel */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={() => setEditingId(null)}
                  style={[styles.cancelBtn, { borderColor: theme.textDim }]}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                >
                  <MaterialIcons name="save" size={15} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Category</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Category list */}
          <Text style={[styles.sectionLabel, { color: theme.textDim }]}>
            {categories.length} CATEGORIE{categories.length !== 1 ? 'S' : ''}
          </Text>
          {categories.map(cat => (
            <View
              key={cat.id}
              style={[
                styles.catCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: cat.isActive ? cat.color + '55' : theme.primary + '22',
                  opacity: cat.isActive ? 1 : 0.55,
                },
              ]}
            >
              <View style={[styles.catColorStripe, { backgroundColor: cat.color }]} />
              <View style={[styles.catEmoji, { backgroundColor: cat.color + '22' }]}>
                <Text style={styles.catEmojiText}>{cat.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.catTopRow}>
                  <Text style={[styles.catNameEn, { color: theme.text }]}>{cat.nameEn}</Text>
                  {cat.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: theme.surface2 }]}>
                      <Text style={[styles.defaultBadgeText, { color: theme.textDim }]}>DEFAULT</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.catNameUr, { color: theme.textMuted }]}>{cat.nameUr}</Text>
              </View>
              <Switch
                value={cat.isActive}
                onValueChange={() => toggleActive(cat.id)}
                trackColor={{ true: cat.color + '88' }}
                thumbColor={cat.isActive ? cat.color : '#aaa'}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
              <TouchableOpacity
                onPress={() => openEdit(cat)}
                style={[styles.catActionBtn, { backgroundColor: theme.surface2 }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialIcons name="edit" size={14} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(cat.id, cat.isDefault)}
                style={[styles.catActionBtn, { backgroundColor: '#ff52520F' }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <MaterialIcons name="delete" size={14} color={cat.isDefault ? theme.textDim : '#ff5252'} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 12, borderBottomWidth: 1, gap: 10,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  addBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 14 },

  statsRow: {
    flexDirection: 'row', borderRadius: 8, borderWidth: 1, marginBottom: 14, overflow: 'hidden',
  },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  statCount: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 9, letterSpacing: 1, marginTop: 2 },

  form: {
    borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 16,
    overflow: 'hidden', position: 'relative',
  },
  formTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 14 },
  emojiColorRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginBottom: 10 },
  emojiBtn: {
    width: 64, height: 64, borderRadius: 8, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', gap: 3,
  },
  emojiBtnIcon: { fontSize: 24 },
  emojiBtnLabel: { fontSize: 8, fontWeight: '600' },
  colorBtn: {
    width: 64, height: 64, borderRadius: 8, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', gap: 4,
  },
  colorSwatch: { width: 22, height: 22, borderRadius: 11 },

  pickerGrid: {
    borderRadius: 8, borderWidth: 1, padding: 10, marginBottom: 10,
  },
  pickerLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  emojiOption: { width: 38, height: 38, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  emojiOptionText: { fontSize: 20 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  colorOption: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },
  colorOptionActive: {
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#fff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4, elevation: 4,
  },

  previewRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, borderRadius: 6, borderWidth: 1, marginBottom: 12,
  },
  previewEmoji: { fontSize: 22 },
  previewName: { fontSize: 13, fontWeight: '700' },

  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 6 },
  input: {
    borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 13, height: 40,
  },
  btnRow: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 11, borderRadius: 4, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: 13, fontWeight: '600' },
  saveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 11, borderRadius: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  sectionLabel: { fontSize: 9, letterSpacing: 3, fontWeight: '700', marginBottom: 10 },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 8, borderWidth: 1, marginBottom: 8,
    overflow: 'hidden', paddingRight: 8,
  },
  catColorStripe: { width: 4, alignSelf: 'stretch' },
  catEmoji: {
    width: 44, height: 44, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
  },
  catEmojiText: { fontSize: 22 },
  catTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  catNameEn: { fontSize: 13, fontWeight: '700' },
  catNameUr: { fontSize: 11, textAlign: 'right' },
  defaultBadge: { paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  defaultBadgeText: { fontSize: 7, fontWeight: '700', letterSpacing: 1 },
  catActionBtn: {
    width: 30, height: 30, borderRadius: 6,
    justifyContent: 'center', alignItems: 'center',
  },
});
