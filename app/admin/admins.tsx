import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { SubAdmin } from '@/constants/theme';
import T from '@/constants/translations';
import { useAlert } from '@/template';

export default function AdminsManager() {
  const { isAdminLoggedIn, subAdmins, addSubAdmin, updateSubAdmin, deleteSubAdmin, activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editPass, setEditPass] = useState('');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  const handleAdd = () => {
    if (!newName.trim() || !newPass.trim()) { showAlert('Error', 'Name and password required.'); return; }
    if (newPass.length < 4) { showAlert('Error', 'Password must be at least 4 characters.'); return; }
    if (subAdmins.length >= 10) { showAlert('Limit', 'Maximum 10 sub-admins allowed.'); return; }
    addSubAdmin(newName.trim(), newPass.trim());
    setNewName(''); setNewPass(''); setShowAdd(false);
    showAlert('Added', `Sub-admin "${newName}" created successfully.`);
  };

  const handleDelete = (admin: SubAdmin) => {
    Alert.alert('Delete Sub-Admin', `Remove "${admin.name}"? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSubAdmin(admin.id) },
    ]);
  };

  const handleUpdatePass = (id: string) => {
    if (!editPass.trim() || editPass.length < 4) { showAlert('Error', 'Password must be at least 4 characters.'); return; }
    updateSubAdmin(id, { password: editPass.trim() });
    setEditId(null); setEditPass('');
    showAlert('Updated', 'Password changed successfully.');
  };

  const inputS = [styles.input, { backgroundColor: theme.surface2, borderColor: theme.primary + '44', color: theme.text }];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>{t.adminsManager}</Text>
          <TouchableOpacity
            onPress={() => setShowAdd(p => !p)}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <MaterialIcons name="person-add" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Info */}
          <View style={[styles.infoCard, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '44' }]}>
            <MaterialIcons name="info-outline" size={16} color={theme.gold} />
            <Text style={[styles.infoText, { color: theme.textMuted }]}>
              {language === 'ur'
                ? 'مین ایڈمن مزید ۱۰ سب ایڈمنز بنا سکتا ہے۔ تمام اختیارات مین ایڈمن کے پاس ہوں گے۔ سب ایڈمن کے تمام پاس ورڈز مین ایڈمن دیکھ سکتا ہے۔'
                : 'Main admin can create up to 10 sub-admins. All access rights remain with main admin. Main admin can view and modify all sub-admin passwords at any time.'}
            </Text>
          </View>

          {/* Capacity */}
          <View style={[styles.capacityBar, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <Text style={[styles.capacityText, { color: theme.textMuted }]}>
              {subAdmins.length}/10 Sub-Admins Used
            </Text>
            <View style={[styles.capacityTrack, { backgroundColor: theme.surface2 }]}>
              <View style={[styles.capacityFill, { width: `${(subAdmins.length / 10) * 100}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>

          {/* Add Form */}
          {showAdd && (
            <View style={[styles.addCard, { backgroundColor: theme.surface, borderColor: theme.gold + '66' }]}>
              <Text style={[styles.addTitle, { color: theme.gold }]}>ADD NEW SUB-ADMIN</Text>
              <Text style={[styles.fieldLabel, { color: theme.primary }]}>NAME</Text>
              <TextInput
                style={inputS}
                value={newName}
                onChangeText={setNewName}
                placeholder="Sub-admin name..."
                placeholderTextColor={theme.textDim}
              />
              <Text style={[styles.fieldLabel, { color: theme.primary }]}>PASSWORD</Text>
              <TextInput
                style={inputS}
                value={newPass}
                onChangeText={setNewPass}
                placeholder="Minimum 4 characters"
                placeholderTextColor={theme.textDim}
                secureTextEntry
                autoCapitalize="none"
              />
              <View style={styles.addActions}>
                <TouchableOpacity onPress={() => setShowAdd(false)} style={[styles.cancelBtn, { borderColor: theme.textDim }]}>
                  <Text style={[styles.cancelText, { color: theme.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAdd} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                  <Text style={styles.saveBtnText}>Create Sub-Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sub-admin List */}
          {subAdmins.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="group-add" size={48} color={theme.textDim} />
              <Text style={[styles.emptyText, { color: theme.textDim }]}>No sub-admins yet</Text>
              <Text style={[styles.emptySubText, { color: theme.textDim }]}>Tap + to add up to 10 sub-admins</Text>
            </View>
          ) : (
            subAdmins.map((admin, idx) => (
              <View key={admin.id} style={[styles.adminCard, {
                backgroundColor: theme.surface,
                borderColor: admin.isActive ? theme.primary + '55' : theme.textDim + '44',
              }]}>
                <View style={[styles.adminLeft, { backgroundColor: admin.isActive ? theme.primary + '22' : theme.surface2 }]}>
                  <Text style={[styles.adminNum, { color: admin.isActive ? theme.primary : theme.textDim }]}>
                    #{idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.adminName, { color: theme.text }]}>{admin.name}</Text>
                  <View style={styles.adminMeta}>
                    <View style={[styles.statusChip, { backgroundColor: admin.isActive ? theme.primary + '33' : theme.textDim + '22' }]}>
                      <View style={[styles.statusDot, { backgroundColor: admin.isActive ? theme.primary : theme.textDim }]} />
                      <Text style={[styles.statusText, { color: admin.isActive ? theme.primary : theme.textDim }]}>
                        {admin.isActive ? 'ACTIVE' : 'DISABLED'}
                      </Text>
                    </View>
                  </View>
                  {/* Password reveal */}
                  <TouchableOpacity
                    onPress={() => setShowPassMap(p => ({ ...p, [admin.id]: !p[admin.id] }))}
                    style={styles.passReveal}
                  >
                    <MaterialIcons name={showPassMap[admin.id] ? 'visibility-off' : 'visibility'} size={12} color={theme.textDim} />
                    <Text style={[styles.passText, { color: theme.textDim }]}>
                      {showPassMap[admin.id] ? `Password: ${admin.password}` : 'Show Password'}
                    </Text>
                  </TouchableOpacity>
                  {/* Edit password inline */}
                  {editId === admin.id && (
                    <View style={styles.editPassRow}>
                      <TextInput
                        style={[inputS, { flex: 1, marginBottom: 0 }]}
                        value={editPass}
                        onChangeText={setEditPass}
                        placeholder="New password"
                        placeholderTextColor={theme.textDim}
                        secureTextEntry
                        autoCapitalize="none"
                      />
                      <TouchableOpacity onPress={() => handleUpdatePass(admin.id)} style={[styles.savePassBtn, { backgroundColor: theme.primary }]}>
                        <Text style={styles.savePassText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setEditId(null)}>
                        <MaterialIcons name="close" size={16} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {/* Actions */}
                <View style={styles.adminActions}>
                  <Switch
                    value={admin.isActive}
                    onValueChange={v => updateSubAdmin(admin.id, { isActive: v })}
                    trackColor={{ false: theme.textDim + '66', true: theme.primary + '88' }}
                    thumbColor={admin.isActive ? theme.primary : '#ccc'}
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <TouchableOpacity
                    onPress={() => { setEditId(admin.id); setEditPass(''); }}
                    style={styles.iconBtn}
                  >
                    <MaterialIcons name="edit" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(admin)} style={styles.iconBtn}>
                    <MaterialIcons name="delete" size={16} color="#ff5252" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={[styles.mainAdminNote, { backgroundColor: theme.gold + '18', borderColor: theme.gold + '44' }]}>
            <MaterialIcons name="verified-user" size={14} color={theme.gold} />
            <Text style={[styles.mainAdminText, { color: theme.gold }]}>
              {t.mainAdminOnly} — Password: Daood5577 (changeable in Settings)
            </Text>
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
  addBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 14, gap: 10 },
  infoCard: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', gap: 10, padding: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 11, lineHeight: 17 },
  capacityBar: { borderRadius: 6, borderWidth: 1, padding: 10, gap: 8 },
  capacityText: { fontSize: 11, letterSpacing: 1 },
  capacityTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  capacityFill: { height: '100%', borderRadius: 2 },
  addCard: { borderRadius: 8, borderWidth: 1, padding: 14 },
  addTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  fieldLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 10, fontSize: 13, marginBottom: 10 },
  addActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, padding: 11, borderRadius: 4, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 13, fontWeight: '600' },
  saveBtn: { flex: 2, padding: 11, borderRadius: 4, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', padding: 32, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubText: { fontSize: 12 },
  adminCard: { borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  adminLeft: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  adminNum: { fontSize: 13, fontWeight: '800' },
  adminName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  adminMeta: { flexDirection: 'row', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5 },
  passReveal: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  passText: { fontSize: 10, letterSpacing: 0.5 },
  editPassRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  savePassBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  savePassText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  adminActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  iconBtn: { padding: 6 },
  mainAdminNote: { borderRadius: 6, borderWidth: 1, flexDirection: 'row', gap: 8, padding: 10, alignItems: 'center' },
  mainAdminText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
