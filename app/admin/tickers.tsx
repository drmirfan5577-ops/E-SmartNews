import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import T from '@/constants/translations';
import { useAlert } from '@/template';

export default function TickerEditor() {
  const { isAdminLoggedIn, tickerEn, tickerUr, tickerSpeed, breakingNews, setTickerEn, setTickerUr, setTickerSpeed, setBreakingNews, activeLauncher, language } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const t = T[language];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const [localEn, setLocalEn] = useState(tickerEn);
  const [localUr, setLocalUr] = useState(tickerUr);
  const [localSpeed, setLocalSpeed] = useState(tickerSpeed);
  const [newBreaking, setNewBreaking] = useState('');
  const [editingBreakIdx, setEditingBreakIdx] = useState<number | null>(null);
  const [editBreakText, setEditBreakText] = useState('');

  const applyTickers = () => {
    setTickerEn(localEn);
    setTickerUr(localUr);
    setTickerSpeed(localSpeed);
    showAlert('Applied', 'Tickers updated and published live!');
  };

  const addBreaking = () => {
    if (!newBreaking.trim()) return;
    setBreakingNews([...breakingNews, newBreaking.trim().toUpperCase()]);
    setNewBreaking('');
    showAlert('Added', 'Breaking news item added.');
  };

  const deleteBreaking = (idx: number) => {
    const updated = breakingNews.filter((_, i) => i !== idx);
    setBreakingNews(updated);
  };

  const saveBreakEdit = (idx: number) => {
    if (!editBreakText.trim()) return;
    const updated = breakingNews.map((b, i) => i === idx ? editBreakText.trim().toUpperCase() : b);
    setBreakingNews(updated);
    setEditingBreakIdx(null);
    setEditBreakText('');
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
          <Text style={[styles.title, { color: theme.text }]}>{t.tickerEditor}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* EN Ticker */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: '#d4a02022', borderBottomColor: theme.gold + '44' }]}>
              <View style={[styles.tickerLabelBadge, { backgroundColor: theme.gold }]}>
                <Text style={[styles.tickerLabelText, { color: theme.background }]}>EN LIVE</Text>
              </View>
              <Text style={[styles.cardTitle, { color: theme.gold }]}>{t.tickerEnLabel}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={lbl}>TICKER TEXT (separate items with ●)</Text>
              <TextInput style={[inp, { minHeight: 80 }]} value={localEn} onChangeText={setLocalEn} multiline placeholder="News 1 ● News 2 ● News 3 ●" placeholderTextColor={theme.textDim} />
            </View>
          </View>

          {/* UR Ticker */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.primary + '22', borderBottomColor: theme.primary + '44' }]}>
              <View style={[styles.tickerLabelBadge, { backgroundColor: theme.primary }]}>
                <Text style={styles.tickerLabelText}>براہ راست</Text>
              </View>
              <Text style={[styles.cardTitle, { color: theme.primary }]}>{t.tickerUrLabel}</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={lbl}>ٹکر ٹیکسٹ (● سے الگ کریں)</Text>
              <TextInput style={[inp, { minHeight: 80, textAlign: 'right' }]} value={localUr} onChangeText={setLocalUr} multiline placeholder="خبر ۱ ● خبر ۲ ● خبر ۳ ●" placeholderTextColor={theme.textDim} />
            </View>
          </View>

          {/* Speed */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '44' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '33' }]}>
              <MaterialIcons name="speed" size={18} color={theme.gold} />
              <Text style={[styles.cardTitle, { color: theme.gold }]}>{t.speed} CONTROL</Text>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.speedRow}>
                <Text style={[styles.speedLabel, { color: theme.textMuted }]}>Slow</Text>
                <View style={styles.speedBtns}>
                  {[20, 30, 40, 50, 60].map(s => (
                    <TouchableOpacity key={s} onPress={() => setLocalSpeed(s)}
                      style={[styles.speedBtn, { backgroundColor: localSpeed === s ? theme.primary : theme.surface2, borderColor: theme.primary + '55' }]}>
                      <Text style={[styles.speedBtnText, { color: localSpeed === s ? '#fff' : theme.textMuted }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.speedLabel, { color: theme.textMuted }]}>Fast</Text>
              </View>
              <Text style={[styles.currentSpeed, { color: theme.gold }]}>Current: {localSpeed}</Text>
            </View>
          </View>

          {/* Apply */}
          <TouchableOpacity onPress={applyTickers} style={[styles.applyBtn, { backgroundColor: theme.primary }]}>
            <MaterialIcons name="publish" size={18} color="#fff" />
            <Text style={styles.applyBtnText}>{t.applyTicker} — GO LIVE</Text>
          </TouchableOpacity>

          {/* Breaking News Manager */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '77' }]}>
            <View style={[styles.cardHeader, { backgroundColor: theme.primary + '28', borderBottomColor: theme.primary + '55' }]}>
              <MaterialIcons name="flash-on" size={18} color={theme.primary} />
              <Text style={[styles.cardTitle, { color: theme.primary }]}>⚡ BREAKING NEWS PANEL</Text>
              <Text style={[styles.breakCount, { color: theme.textDim }]}>{breakingNews.length} items</Text>
            </View>

            {/* Add new */}
            <View style={[styles.addBreakRow, { borderBottomColor: theme.primary + '22' }]}>
              <TextInput
                style={[inp, { flex: 1, marginBottom: 0 }]}
                value={newBreaking}
                onChangeText={setNewBreaking}
                placeholder="Type breaking news..."
                placeholderTextColor={theme.textDim}
              />
              <TouchableOpacity onPress={addBreaking} style={[styles.addBreakBtn, { backgroundColor: theme.primary }]}>
                <MaterialIcons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            {breakingNews.map((brk, idx) => (
              <View key={idx} style={[styles.brkItem, { borderBottomColor: theme.primary + '18' }]}>
                {editingBreakIdx === idx ? (
                  <View style={styles.brkEditRow}>
                    <TextInput
                      style={[inp, { flex: 1, marginBottom: 0, fontSize: 11 }]}
                      value={editBreakText}
                      onChangeText={setEditBreakText}
                      autoFocus
                    />
                    <TouchableOpacity onPress={() => saveBreakEdit(idx)} style={[styles.brkActionBtn, { backgroundColor: theme.primary }]}>
                      <MaterialIcons name="check" size={14} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingBreakIdx(null)} style={styles.brkActionBtn}>
                      <MaterialIcons name="close" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={[styles.brkDot, { backgroundColor: theme.primary }]} />
                    <Text style={[styles.brkText, { color: theme.text }]} numberOfLines={2}>{brk}</Text>
                    <TouchableOpacity onPress={() => { setEditingBreakIdx(idx); setEditBreakText(brk); }} style={styles.brkActionBtn}>
                      <MaterialIcons name="edit" size={14} color={theme.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteBreaking(idx)} style={styles.brkActionBtn}>
                      <MaterialIcons name="delete" size={14} color="#ff5252" />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            ))}
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
  cardTitle: { flex: 1, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  cardBody: { padding: 14 },
  tickerLabelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 2 },
  tickerLabelText: { fontSize: 9, fontWeight: '800', letterSpacing: 2, color: '#fff' },
  label: { fontSize: 9, fontWeight: '700', letterSpacing: 3, marginBottom: 5, marginTop: 4, textTransform: 'uppercase' },
  input: { borderWidth: 1, borderRadius: 4, padding: 9, fontSize: 13, marginBottom: 4 },
  speedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  speedLabel: { fontSize: 10, letterSpacing: 1 },
  speedBtns: { flex: 1, flexDirection: 'row', gap: 6 },
  speedBtn: { flex: 1, paddingVertical: 8, borderRadius: 4, borderWidth: 1, alignItems: 'center' },
  speedBtnText: { fontSize: 12, fontWeight: '600' },
  currentSpeed: { textAlign: 'center', fontSize: 11, marginTop: 8, fontWeight: '600' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 6 },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1.5 },
  breakCount: { fontSize: 11, letterSpacing: 1 },
  addBreakRow: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1, alignItems: 'center' },
  addBreakBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  brkItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1 },
  brkDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  brkText: { flex: 1, fontSize: 11, fontWeight: '600', letterSpacing: 1 },
  brkEditRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  brkActionBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
});
