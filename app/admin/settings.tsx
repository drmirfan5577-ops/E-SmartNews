import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import T from '@/constants/translations';
import { useAlert } from '@/template';
import { clearTranslationCache } from '@/services/translation';

export default function Settings() {
  const {
    isAdminLoggedIn, language, setLanguage, changeAdminPassword,
    activeLauncher, channelLogoUri, setChannelLogoUri,
    bgMusicEnabled, setBgMusicEnabled, bgMusicVolume, setBgMusicVolume,
  } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPassCur, setShowPassCur] = useState(false);
  const [showPassNew, setShowPassNew] = useState(false);

  const handleChangePass = () => {
    if (!curPass || !newPass || !confirmPass) { showAlert('Error', 'All fields required.'); return; }
    if (newPass !== confirmPass) { showAlert('Error', t.passwordMismatch); return; }
    if (newPass.length < 4) { showAlert('Error', 'Password must be at least 4 characters.'); return; }
    const ok = changeAdminPassword(curPass, newPass);
    if (ok) {
      showAlert('Success', t.passwordChanged);
      setCurPass(''); setNewPass(''); setConfirmPass('');
    } else {
      showAlert('Error', t.wrongCurrentPass);
    }
  };

  const pickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { showAlert('Permission', 'Photo library access required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      setChannelLogoUri(result.assets[0].uri);
      showAlert('Logo Updated', 'Channel logo saved successfully.');
    }
  };

  const inp = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];
  const lbl = [styles.label, { color: theme.primary }];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.settings}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Language */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="language" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>{t.language}</Text>
            </View>
            <View style={styles.langRow}>
              {(['en', 'ur'] as const).map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLanguage(l)}
                  style={[styles.langBtn, { backgroundColor: language === l ? theme.primary : theme.surface2, borderColor: theme.primary + '66' }]}
                >
                  <Text style={[styles.langBtnText, { color: language === l ? '#fff' : theme.textMuted }]}>
                    {l === 'en' ? '🇬🇧 English' : '🇵🇰 اردو'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Channel Logo */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="star" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>CHANNEL LOGO</Text>
            </View>
            <View style={styles.logoSection}>
              {channelLogoUri ? (
                <View style={styles.logoPreviewWrap}>
                  <Image source={{ uri: channelLogoUri }} style={styles.logoPreview} contentFit="contain" />
                  <Text style={[styles.logoNote, { color: theme.textMuted }]}>Current custom logo</Text>
                </View>
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: theme.primary, width: 60, height: 60, borderRadius: 30 }]}>
                  <Text style={styles.logoPlaceholderText}>SW</Text>
                </View>
              )}
              <TouchableOpacity onPress={pickLogo} style={[styles.uploadLogoBtn, { backgroundColor: theme.primary + '22', borderColor: theme.primary + '77' }]}>
                <MaterialIcons name="add-photo-alternate" size={18} color={theme.primary} />
                <Text style={[styles.uploadLogoText, { color: theme.primary }]}>Upload Custom Logo</Text>
              </TouchableOpacity>
              {channelLogoUri && (
                <TouchableOpacity onPress={() => setChannelLogoUri(null)} style={[styles.removeLogoBtn, { borderColor: '#ff525255' }]}>
                  <Text style={{ color: '#ff5252', fontSize: 12, fontWeight: '600' }}>✕ Remove Logo (Use Default)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Background Music Quick Toggle */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="music-note" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>BACKGROUND MUSIC</Text>
            </View>
            <View style={styles.toggleRowCard}>
              <Text style={[styles.toggleLabel, { color: theme.text }]}>Enable Background Music</Text>
              <Switch value={bgMusicEnabled} onValueChange={setBgMusicEnabled} trackColor={{ true: theme.primary + '99' }} thumbColor={bgMusicEnabled ? theme.primary : '#aaa'} />
            </View>
            <TouchableOpacity onPress={() => router.push('/admin/music')} style={[styles.goMusicBtn, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '55' }]}>
              <Text style={[styles.goMusicText, { color: theme.primary }]}>Open Full Music Manager →</Text>
            </TouchableOpacity>
          </View>

          {/* Change Password */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="lock" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>{t.changePassword}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={lbl}>{t.currentPassword}</Text>
              <View style={[styles.inputRow, { borderColor: theme.primary + '44', backgroundColor: theme.surface2 }]}>
                <TextInput style={[styles.inputInner, { color: theme.text }]} value={curPass} onChangeText={setCurPass} secureTextEntry={!showPassCur} autoCapitalize="none" placeholderTextColor={theme.textDim} placeholder="Current password" />
                <TouchableOpacity onPress={() => setShowPassCur(p => !p)} style={styles.eyeBtn}>
                  <MaterialIcons name={showPassCur ? 'visibility-off' : 'visibility'} size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={lbl}>{t.newPassword}</Text>
              <View style={[styles.inputRow, { borderColor: theme.primary + '44', backgroundColor: theme.surface2 }]}>
                <TextInput style={[styles.inputInner, { color: theme.text }]} value={newPass} onChangeText={setNewPass} secureTextEntry={!showPassNew} autoCapitalize="none" placeholderTextColor={theme.textDim} placeholder="New password (min 4 chars)" />
                <TouchableOpacity onPress={() => setShowPassNew(p => !p)} style={styles.eyeBtn}>
                  <MaterialIcons name={showPassNew ? 'visibility-off' : 'visibility'} size={16} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={lbl}>{t.confirmPassword}</Text>
              <TextInput style={inp} value={confirmPass} onChangeText={setConfirmPass} secureTextEntry autoCapitalize="none" placeholderTextColor={theme.textDim} placeholder="Confirm new password" />
              <TouchableOpacity onPress={handleChangePass} style={[styles.updatePassBtn, { backgroundColor: theme.primary }]}>
                <MaterialIcons name="lock-reset" size={16} color="#fff" />
                <Text style={styles.updatePassText}>{t.updatePassword}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Admin Info */}
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '12', borderColor: theme.primary + '33' }]}>
            <MaterialIcons name="info-outline" size={14} color={theme.gold} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              {language === 'ur'
                ? 'تمام ایڈیٹنگ فیچرز فقط ایڈمن ایکسیس اونلی ہیں۔ پاس ورڈ بدلنے کے بعد تمام سب ایڈمنز کو نیا پاس ورڈ دیں۔'
                : 'All editing features are admin-only and password protected. After changing password, inform sub-admins of their credentials separately.'}
            </Text>
          </View>

          {/* Translation Cache */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="translate" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>TRANSLATION CACHE</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.toggleLabel, { color: theme.textMuted, fontSize: 11, marginBottom: 10 }]}>
                Translation results are cached for 7 days. Clear cache if translations seem outdated.
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await clearTranslationCache();
                  showAlert('Cache Cleared', 'Translation cache has been cleared. Fresh translations will be fetched on next news rotation.');
                }}
                style={[styles.uploadLogoBtn, { borderColor: '#ff980055', backgroundColor: '#ff980015' }]}
              >
                <MaterialIcons name="delete-sweep" size={18} color="#ff9800" />
                <Text style={{ color: '#ff9800', fontSize: 13, fontWeight: '600' }}>Clear Translation Cache</Text>
              </TouchableOpacity>
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
  title: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  scroll: { padding: 14, gap: 12 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  cardTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  cardBody: { padding: 14 },
  langRow: { flexDirection: 'row', gap: 10, padding: 14 },
  langBtn: { flex: 1, padding: 12, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  langBtnText: { fontSize: 14, fontWeight: '600' },
  logoSection: { padding: 14, alignItems: 'center', gap: 12 },
  logoPreviewWrap: { alignItems: 'center', gap: 6 },
  logoPreview: { width: 80, height: 80, borderRadius: 8 },
  logoNote: { fontSize: 10, letterSpacing: 0.5 },
  logoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  uploadLogoBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 6, borderWidth: 1 },
  uploadLogoText: { fontSize: 13, fontWeight: '600' },
  removeLogoBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, borderWidth: 1 },
  toggleRowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  toggleLabel: { fontSize: 14, fontWeight: '500' },
  goMusicBtn: { marginHorizontal: 14, marginBottom: 14, padding: 10, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  goMusicText: { fontSize: 13, fontWeight: '600' },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 8, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 10, fontSize: 13, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 4, marginBottom: 6 },
  inputInner: { flex: 1, fontSize: 13, padding: 10 },
  eyeBtn: { padding: 10 },
  updatePassBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 13, borderRadius: 4, marginTop: 10 },
  updatePassText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  infoCard: { borderRadius: 6, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 12 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17 },
});
