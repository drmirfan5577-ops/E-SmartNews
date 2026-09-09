import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { CHANNEL } from '@/constants/theme';
import T from '@/constants/translations';

export default function AdminLogin() {
  const { login, activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!password.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const ok = login(password);
      if (ok) {
        router.replace('/admin');
      } else {
        setError(t.wrongPassword);
        setPassword('');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.glow, 'transparent']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
              <Text style={[styles.backText, { color: theme.textMuted }]}>{t.back}</Text>
            </TouchableOpacity>

            {/* Logo */}
            <View style={styles.logoSection}>
              <View style={[styles.logoBall, { backgroundColor: theme.primary }]}>
                <Text style={styles.logoSW}>SW</Text>
              </View>
              <Text style={[styles.channelName, { color: theme.text }]}>{CHANNEL.nameEn}</Text>
              <Text style={[styles.channelUr, { color: theme.textMuted }]}>{CHANNEL.nameUr}</Text>
            </View>

            {/* Card */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
              <View style={[styles.cardHeader, { borderBottomColor: theme.primary + '33', backgroundColor: theme.primary + '18' }]}>
                <MaterialIcons name="admin-panel-settings" size={22} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>{t.adminLogin}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={[styles.fieldLabel, { color: theme.primary }]}>{t.password}</Text>
                <View style={[styles.inputRow, { borderColor: theme.primary + '44', backgroundColor: theme.surface2 }]}>
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={password}
                    onChangeText={v => { setPassword(v); setError(''); }}
                    secureTextEntry={secure}
                    placeholder="Enter admin password"
                    placeholderTextColor={theme.textDim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity onPress={() => setSecure(p => !p)} style={styles.eyeBtn}>
                    <MaterialIcons name={secure ? 'visibility-off' : 'visibility'} size={18} color={theme.textMuted} />
                  </TouchableOpacity>
                </View>

                {!!error && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={14} color="#ff5252" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.loginBtn, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="lock-open" size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>{loading ? '...' : t.login}</Text>
                </TouchableOpacity>

                <Text style={[styles.hint, { color: theme.textDim }]}>
                  🔒 Admin access only · Default: Daood5577
                </Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, justifyContent: 'center', paddingBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  backText: { fontSize: 14 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoBall: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 12, shadowOffset: { width: 0, height: 0 }, shadowRadius: 20, shadowOpacity: 0.8, elevation: 15 },
  logoSW: { color: '#fff', fontWeight: '900', fontSize: 22, letterSpacing: 2 },
  channelName: { fontSize: 18, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  channelUr: { fontSize: 13 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  cardBody: { padding: 16 },
  fieldLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 6, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 4, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, padding: 12 },
  eyeBtn: { padding: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  errorText: { color: '#ff5252', fontSize: 12 },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 4, marginBottom: 14 },
  loginBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 2 },
  hint: { textAlign: 'center', fontSize: 11, letterSpacing: 1 },
});
