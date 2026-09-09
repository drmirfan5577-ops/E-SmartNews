import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Switch, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { AdItem } from '@/constants/theme';
import { useAlert } from '@/template';

type AdForm = Omit<AdItem, 'id' | 'createdAt'>;

const EMPTY_FORM: AdForm = {
  title: '', type: 'text', mediaUri: null, text: '',
  bgColor: '#0a0f1e', textColor: '#ffffff',
  durationSec: 10, frequency: 3,
  isEnabled: true, isPublished: false, link: '',
};

const TYPE_OPTIONS: AdItem['type'][] = ['text', 'image', 'video'];

export default function AdsManager() {
  const { isAdminLoggedIn, ads, addAd, updateAd, deleteAd, publishAd, activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AdForm>(EMPTY_FORM);

  const openAdd = () => { setEditingId('new'); setForm(EMPTY_FORM); };
  const openEdit = (ad: AdItem) => {
    setEditingId(ad.id);
    setForm({ title: ad.title, type: ad.type, mediaUri: ad.mediaUri, text: ad.text, bgColor: ad.bgColor, textColor: ad.textColor, durationSec: ad.durationSec, frequency: ad.frequency, isEnabled: ad.isEnabled, isPublished: ad.isPublished, link: ad.link });
  };

  const handleSave = () => {
    if (!form.title.trim()) { showAlert('Error', 'Ad title is required.'); return; }
    if (editingId === 'new') {
      addAd(form);
      showAlert('Saved', 'Ad saved. Tap "Publish" to go live.');
    } else if (editingId) {
      updateAd(editingId, form);
      showAlert('Updated', 'Ad updated successfully.');
    }
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Ad', 'This will permanently remove the ad.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteAd(id); if (editingId === id) setEditingId(null); } },
    ]);
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Media access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: form.type === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setForm(p => ({ ...p, mediaUri: result.assets[0].uri }));
    }
  };

  const inp = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];
  const lbl = [styles.label, { color: theme.primary }];

  const activeCount = ads.filter(a => a.isEnabled && a.isPublished).length;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => { setEditingId(null); router.back(); }}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>ADS MANAGER 24/7</Text>
            <Text style={[styles.subtitle, { color: theme.textDim }]}>{activeCount} Active · {ads.length} Total</Text>
          </View>
          <TouchableOpacity onPress={openAdd} style={[styles.addBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Info banner */}
          <View style={[styles.infoBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '44' }]}>
            <MaterialIcons name="ad-units" size={14} color={theme.gold} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              Ads appear below the subtitle panel 24/7. Set frequency (every N news items) and duration per ad.
            </Text>
          </View>

          {/* FORM */}
          {editingId !== null && (
            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.gold + '55' }]}>
              <LinearGradient colors={[theme.primary + '15', 'transparent']} style={StyleSheet.absoluteFillObject} />
              <Text style={[styles.formTitle, { color: theme.gold }]}>
                {editingId === 'new' ? '+ NEW AD' : '✏ EDIT AD'}
              </Text>

              {/* Type selector */}
              <Text style={lbl}>AD TYPE</Text>
              <View style={styles.typeRow}>
                {TYPE_OPTIONS.map(tp => (
                  <TouchableOpacity
                    key={tp}
                    onPress={() => setForm(p => ({ ...p, type: tp, mediaUri: null }))}
                    style={[styles.typeBtn, { backgroundColor: form.type === tp ? theme.primary : theme.surface2, borderColor: theme.primary + '55' }]}
                  >
                    <MaterialIcons name={tp === 'text' ? 'text-fields' : tp === 'image' ? 'image' : 'videocam'} size={14} color={form.type === tp ? '#fff' : theme.textMuted} />
                    <Text style={[styles.typeBtnText, { color: form.type === tp ? '#fff' : theme.textMuted }]}>
                      {tp.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={lbl}>AD TITLE *</Text>
              <TextInput style={inp} value={form.title} onChangeText={v => setForm(p => ({ ...p, title: v }))} placeholder="Advertisement title..." placeholderTextColor={theme.textDim} />

              <Text style={lbl}>AD BODY TEXT</Text>
              <TextInput style={[inp, { minHeight: 60 }]} value={form.text} onChangeText={v => setForm(p => ({ ...p, text: v }))} multiline placeholder="Ad description or call-to-action..." placeholderTextColor={theme.textDim} />

              {/* Media Upload */}
              {(form.type === 'image' || form.type === 'video') && (
                <>
                  <Text style={lbl}>{form.type === 'image' ? 'AD IMAGE' : 'AD VIDEO'}</Text>
                  {form.mediaUri ? (
                    <View style={styles.mediaPreviewRow}>
                      {form.type === 'image' ? (
                        <Image source={{ uri: form.mediaUri }} style={styles.mediaPreview} contentFit="cover" />
                      ) : (
                        <View style={[styles.mediaPreview, { backgroundColor: theme.surface2, justifyContent: 'center', alignItems: 'center' }]}>
                          <MaterialIcons name="play-circle-filled" size={32} color={theme.primary} />
                        </View>
                      )}
                      <TouchableOpacity onPress={() => setForm(p => ({ ...p, mediaUri: null }))} style={[styles.removeMediaBtn, { backgroundColor: '#ff5252' }]}>
                        <MaterialIcons name="close" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={pickMedia} style={[styles.uploadBtn, { borderColor: theme.primary + '88', backgroundColor: theme.primary + '15' }]}>
                      <MaterialIcons name={form.type === 'image' ? 'add-photo-alternate' : 'video-library'} size={20} color={theme.primary} />
                      <Text style={[styles.uploadText, { color: theme.primary }]}>Upload {form.type === 'image' ? 'Image' : 'Video'}</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <Text style={lbl}>CLICK LINK (optional)</Text>
              <TextInput style={inp} value={form.link} onChangeText={v => setForm(p => ({ ...p, link: v }))} placeholder="https://..." placeholderTextColor={theme.textDim} autoCapitalize="none" />

              {/* Colors */}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>BG COLOR (hex)</Text>
                  <TextInput style={inp} value={form.bgColor} onChangeText={v => setForm(p => ({ ...p, bgColor: v }))} placeholder="#0a0f1e" placeholderTextColor={theme.textDim} />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>TEXT COLOR (hex)</Text>
                  <TextInput style={inp} value={form.textColor} onChangeText={v => setForm(p => ({ ...p, textColor: v }))} placeholder="#ffffff" placeholderTextColor={theme.textDim} />
                </View>
              </View>

              {/* Duration & Frequency */}
              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>DURATION (sec)</Text>
                  <TextInput style={inp} value={String(form.durationSec)} onChangeText={v => setForm(p => ({ ...p, durationSec: Math.max(3, parseInt(v) || 10) }))} keyboardType="numeric" placeholderTextColor={theme.textDim} />
                </View>
                <View style={{ width: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={lbl}>FREQUENCY (every N)</Text>
                  <TextInput style={inp} value={String(form.frequency)} onChangeText={v => setForm(p => ({ ...p, frequency: Math.max(1, parseInt(v) || 3) }))} keyboardType="numeric" placeholderTextColor={theme.textDim} />
                </View>
              </View>

              {/* Toggle */}
              <View style={[styles.toggleRow, { borderColor: theme.primary + '22' }]}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>Enable Ad</Text>
                <Switch value={form.isEnabled} onValueChange={v => setForm(p => ({ ...p, isEnabled: v }))} trackColor={{ true: theme.primary + '99' }} thumbColor={form.isEnabled ? theme.primary : '#aaa'} />
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity onPress={() => setEditingId(null)} style={[styles.cancelBtn, { borderColor: theme.textDim }]}>
                  <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                  <MaterialIcons name="save" size={15} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Ad</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ADS LIST */}
          <Text style={[styles.sectionLabel, { color: theme.textDim }]}>
            {ads.length === 0 ? 'No ads yet. Tap + to create.' : `${ads.length} ADS`}
          </Text>

          {ads.map(ad => {
            const isLive = ad.isPublished && ad.isEnabled;
            return (
              <View key={ad.id} style={[styles.adCard, {
                backgroundColor: theme.surface,
                borderColor: isLive ? theme.gold + '88' : theme.primary + '22',
              }]}>
                <View style={[styles.adStripe, { backgroundColor: isLive ? theme.gold : 'transparent' }]} />
                <View style={styles.adCardRow}>
                  {/* Type icon */}
                  <View style={[styles.adTypeIcon, { backgroundColor: theme.primary + '22' }]}>
                    <MaterialIcons name={ad.type === 'text' ? 'text-fields' : ad.type === 'image' ? 'image' : 'videocam'} size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.adMeta}>
                      <View style={[styles.adStatusBadge, { backgroundColor: isLive ? theme.gold + '33' : theme.surface2 }]}>
                        <Text style={[styles.adStatusText, { color: isLive ? theme.gold : theme.textDim }]}>
                          {isLive ? '● LIVE' : ad.isPublished ? '○ Disabled' : '○ Draft'}
                        </Text>
                      </View>
                      <Text style={[styles.adMetaText, { color: theme.textDim }]}>⏱ {ad.durationSec}s · every {ad.frequency} news</Text>
                    </View>
                    <Text style={[styles.adTitle, { color: theme.text }]} numberOfLines={1}>{ad.title}</Text>
                    {ad.text ? <Text style={[styles.adBody, { color: theme.textMuted }]} numberOfLines={1}>{ad.text}</Text> : null}
                  </View>
                </View>
                {/* Actions */}
                <View style={[styles.adActions, { borderTopColor: theme.primary + '22' }]}>
                  <TouchableOpacity onPress={() => openEdit(ad)} style={[styles.adActionBtn, { borderRightColor: theme.primary + '22' }]}>
                    <MaterialIcons name="edit" size={14} color={theme.primary} />
                    <Text style={[styles.adActionText, { color: theme.primary }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => updateAd(ad.id, { isEnabled: !ad.isEnabled })} style={[styles.adActionBtn, { borderRightColor: theme.primary + '22' }]}>
                    <MaterialIcons name={ad.isEnabled ? 'toggle-on' : 'toggle-off'} size={14} color={ad.isEnabled ? theme.gold : theme.textDim} />
                    <Text style={[styles.adActionText, { color: ad.isEnabled ? theme.gold : theme.textDim }]}>
                      {ad.isEnabled ? 'ON' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                  {!ad.isPublished ? (
                    <TouchableOpacity onPress={() => { publishAd(ad.id); showAlert('Published!', 'Ad is now live 24/7.'); }} style={[styles.adActionBtn, { borderRightColor: theme.primary + '22', backgroundColor: theme.primary + '15' }]}>
                      <MaterialIcons name="publish" size={14} color={theme.primary} />
                      <Text style={[styles.adActionText, { color: theme.primary, fontWeight: '700' }]}>Publish</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => updateAd(ad.id, { isPublished: false })} style={[styles.adActionBtn, { borderRightColor: theme.primary + '22' }]}>
                      <MaterialIcons name="stop" size={14} color="#ff9800" />
                      <Text style={[styles.adActionText, { color: '#ff9800' }]}>Stop</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(ad.id)} style={styles.adActionBtn}>
                    <MaterialIcons name="delete" size={14} color="#ff5252" />
                    <Text style={[styles.adActionText, { color: '#ff5252' }]}>Del</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  subtitle: { fontSize: 9, letterSpacing: 1, marginTop: 1 },
  addBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 14 },
  infoBanner: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 6, borderWidth: 1, marginBottom: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17 },
  formCard: { borderRadius: 8, borderWidth: 1, padding: 14, marginBottom: 16, overflow: 'hidden', position: 'relative' },
  formTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 13, marginBottom: 4, minHeight: 40 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  typeBtnText: { fontSize: 11, fontWeight: '600' },
  mediaPreviewRow: { position: 'relative', alignSelf: 'flex-start', marginBottom: 8 },
  mediaPreview: { width: 100, height: 70, borderRadius: 6, overflow: 'hidden' },
  removeMediaBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 6, borderWidth: 2, borderStyle: 'dashed', marginBottom: 8 },
  uploadText: { fontSize: 13, fontWeight: '600' },
  twoCol: { flexDirection: 'row' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, marginTop: 8 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: { flex: 1, padding: 11, borderRadius: 4, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 11, borderRadius: 4 },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  sectionLabel: { fontSize: 9, letterSpacing: 3, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase' },
  adCard: { borderRadius: 6, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  adStripe: { height: 3 },
  adCardRow: { flexDirection: 'row', gap: 10, padding: 10, alignItems: 'flex-start' },
  adTypeIcon: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  adMeta: { flexDirection: 'row', gap: 6, marginBottom: 4, alignItems: 'center' },
  adStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  adStatusText: { fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  adMetaText: { fontSize: 9, letterSpacing: 0.5 },
  adTitle: { fontSize: 13, fontWeight: '600' },
  adBody: { fontSize: 10, marginTop: 2 },
  adActions: { flexDirection: 'row', borderTopWidth: 1 },
  adActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRightWidth: 1 },
  adActionText: { fontSize: 10.5, fontWeight: '600' },
});
