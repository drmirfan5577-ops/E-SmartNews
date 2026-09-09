import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/hooks/useApp';
import { LAUNCHERS } from '@/constants/launchers';
import { DisplayFilters } from '@/constants/theme';
import { useAlert } from '@/template';

// ─── Canvas layout presets ───────────────────────────────────────────────────
type CanvasLayout = {
  id: string;
  label: string;
  ratio: string;
  shape: 'rect' | 'circle';
  w: number; // relative display units
  h: number;
};

const CANVAS_LAYOUTS: CanvasLayout[] = [
  { id: '16:9',  label: '16:9',  ratio: 'Landscape HD',      shape: 'rect',   w: 80, h: 45 },
  { id: '9:16',  label: '9:16',  ratio: 'Portrait / Story',   shape: 'rect',   w: 45, h: 80 },
  { id: '4:3',   label: '4:3',   ratio: 'Classic TV',         shape: 'rect',   w: 80, h: 60 },
  { id: '3:4',   label: '3:4',   ratio: 'Portrait Classic',   shape: 'rect',   w: 60, h: 80 },
  { id: '1:1',   label: '1:1',   ratio: 'Square',             shape: 'rect',   w: 70, h: 70 },
  { id: '2:3',   label: '2:3',   ratio: 'Portrait Post',      shape: 'rect',   w: 53, h: 80 },
  { id: '3:2',   label: '3:2',   ratio: 'Photo Landscape',    shape: 'rect',   w: 80, h: 53 },
  { id: '5:3',   label: '5:3',   ratio: 'Widescreen',         shape: 'rect',   w: 80, h: 48 },
  { id: '21:9',  label: '21:9',  ratio: 'Cinema Ultra-wide',  shape: 'rect',   w: 80, h: 34 },
  { id: 'fill',  label: 'Fill',  ratio: 'Stretch to Fill',    shape: 'rect',   w: 80, h: 60 },
  { id: 'circle-sm',  label: '●', ratio: 'Circle Small',  shape: 'circle', w: 48, h: 48 },
  { id: 'circle-md',  label: '◉', ratio: 'Circle Medium', shape: 'circle', w: 62, h: 62 },
  { id: 'circle-lg',  label: '🔴', ratio: 'Circle Large', shape: 'circle', w: 76, h: 76 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
type SliderRowProps = {
  label: string; value: number; min: number; max: number; step: number;
  onDecrease: () => void; onIncrease: () => void;
  theme: any; valueDisplay?: string;
  unit?: string;
};

function SliderRow({ label, value, min, max, step, onDecrease, onIncrease, theme, valueDisplay, unit }: SliderRowProps) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return (
    <View style={fStyles.sliderRow}>
      <Text style={[fStyles.sliderLabel, { color: theme.textMuted }]}>{label}</Text>
      <View style={fStyles.sliderControls}>
        <TouchableOpacity
          onPress={onDecrease}
          style={[fStyles.sliderBtn, { backgroundColor: theme.surface2, opacity: value <= min ? 0.3 : 1 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[fStyles.sliderBtnText, { color: theme.textMuted }]}>−</Text>
        </TouchableOpacity>
        <View style={[fStyles.track, { backgroundColor: theme.surface2 }]}>
          <View style={[fStyles.fill, { backgroundColor: theme.primary, width: `${Math.round(pct * 100)}%` }]} />
        </View>
        <TouchableOpacity
          onPress={onIncrease}
          style={[fStyles.sliderBtn, { backgroundColor: theme.surface2, opacity: value >= max ? 0.3 : 1 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[fStyles.sliderBtnText, { color: theme.text }]}>+</Text>
        </TouchableOpacity>
        <Text style={[fStyles.sliderVal, { color: theme.gold }]}>
          {valueDisplay ?? value.toFixed(1)}{unit ? unit : ''}
        </Text>
      </View>
    </View>
  );
}

type ToggleRowProps = { label: string; desc: string; value: boolean; onToggle: () => void; theme: any };
function ToggleRow({ label, desc, value, onToggle, theme }: ToggleRowProps) {
  return (
    <View style={[fStyles.toggleRow, { borderBottomColor: theme.primary + '18' }]}>
      <View style={{ flex: 1 }}>
        <Text style={[fStyles.toggleLabel, { color: theme.text }]}>{label}</Text>
        <Text style={[fStyles.toggleDesc, { color: theme.textDim }]}>{desc}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: theme.primary + '99' }}
        thumbColor={value ? theme.primary : '#aaa'}
      />
    </View>
  );
}

// ─── Extended DisplayFilters with canvas fields ───────────────────────────────
type ExtFilters = DisplayFilters & {
  canvasLayout?: string;    // canvas layout id
  circleSize?: number;      // 60–200 px
  cornerRadius?: number;    // 0–50
  borderWidth?: number;     // 0–8
  borderColor?: string;
  shadowIntensity?: number; // 0–1
  textureOverlay?: 'none' | 'paper' | 'metal' | 'noise' | 'glass' | 'holographic';
  colorGrade?: 'none' | 'warm' | 'cool' | 'vintage' | 'fade' | 'dramatic' | 'matrix';
};

export default function FiltersManager() {
  const { isAdminLoggedIn, displayFilters, updateDisplayFilters, activeLauncher } = useApp();
  const theme = LAUNCHERS[activeLauncher] ?? LAUNCHERS[0];
  const router = useRouter();
  const { showAlert } = useAlert();

  if (!isAdminLoggedIn) return <Redirect href="/admin/login" />;

  const f = displayFilters as ExtFilters;
  const step = 0.1;

  // Extended state (local until proper context support added)
  const [canvasLayout, setCanvasLayout] = useState<string>(f.canvasLayout ?? '16:9');
  const [circleSize, setCircleSize] = useState<number>(f.circleSize ?? 120);
  const [cornerRadius, setCornerRadius] = useState<number>(f.cornerRadius ?? 0);
  const [borderWidth, setBorderWidth] = useState<number>(f.borderWidth ?? 0);
  const [shadowIntensity, setShadowIntensity] = useState<number>(f.shadowIntensity ?? 0);
  const [textureOverlay, setTextureOverlay] = useState<ExtFilters['textureOverlay']>(f.textureOverlay ?? 'none');
  const [colorGrade, setColorGrade] = useState<ExtFilters['colorGrade']>(f.colorGrade ?? 'none');

  const resetAll = () => {
    updateDisplayFilters({
      brightness: 1, contrast: 1, saturation: 1, blur: 0,
      vignette: false, grayscale: false, sepia: false, scanlines: true,
      filmGrain: false, glassEffect: false, neonGlow: false, darkMode: false,
      imageAspect: 'fill',
    });
    setCanvasLayout('16:9');
    setCircleSize(120);
    setCornerRadius(0);
    setBorderWidth(0);
    setShadowIntensity(0);
    setTextureOverlay('none');
    setColorGrade('none');
    showAlert('Reset', 'All display filters and canvas settings reset to defaults.');
  };

  const ASPECT_OPTIONS: DisplayFilters['imageAspect'][] = ['16:9', '4:3', '1:1', '9:16', 'fill'];
  const TEXTURE_OPTIONS: ExtFilters['textureOverlay'][] = ['none', 'paper', 'metal', 'noise', 'glass', 'holographic'];
  const COLOR_GRADES: ExtFilters['colorGrade'][] = ['none', 'warm', 'cool', 'vintage', 'fade', 'dramatic', 'matrix'];

  const selectedCanvas = CANVAS_LAYOUTS.find(c => c.id === canvasLayout) ?? CANVAS_LAYOUTS[0];
  const isCircle = selectedCanvas.shape === 'circle';

  return (
    <View style={[fStyles.root, { backgroundColor: theme.background }]}>
      <LinearGradient colors={[theme.glow, 'transparent']} style={StyleSheet.absoluteFillObject} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={[fStyles.header, { backgroundColor: theme.surface, borderBottomColor: theme.primary + '44' }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={theme.textMuted} />
          </TouchableOpacity>
          <Text style={[fStyles.title, { color: theme.text }]}>DISPLAY FILTERS & CANVAS</Text>
          <TouchableOpacity onPress={resetAll} style={[fStyles.resetBtn, { borderColor: theme.primary + '66' }]}>
            <MaterialIcons name="refresh" size={14} color={theme.primary} />
            <Text style={[fStyles.resetText, { color: theme.primary }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={fStyles.scroll} showsVerticalScrollIndicator={false}>

          {/* Live preview banner */}
          <View style={[fStyles.previewBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '44' }]}>
            <MaterialIcons name="preview" size={14} color={theme.gold} />
            <Text style={[fStyles.previewText, { color: theme.textMuted }]}>
              Changes apply live on the channel display immediately. Canvas layouts apply to image/video areas.
            </Text>
          </View>

          {/* ── CANVAS LAYOUT SECTION ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="crop" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>CANVAS LAYOUTS</Text>
              <Text style={[fStyles.cardBadge, { backgroundColor: theme.primary + '22', color: theme.primary }]}>
                {canvasLayout.toUpperCase()}
              </Text>
            </View>
            <View style={fStyles.cardBody}>
              {/* Canvas preview */}
              <View style={fStyles.canvasPreviewArea}>
                <View style={[
                  fStyles.canvasPreview,
                  {
                    width: selectedCanvas.w,
                    height: isCircle ? selectedCanvas.w : selectedCanvas.h,
                    borderRadius: isCircle ? selectedCanvas.w / 2 : Math.max(2, cornerRadius),
                    backgroundColor: theme.primary + '33',
                    borderColor: theme.primary,
                    borderWidth: Math.max(1, borderWidth),
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: shadowIntensity,
                    shadowRadius: 8,
                    elevation: Math.round(shadowIntensity * 10),
                  },
                ]}>
                  <Text style={[fStyles.canvasPreviewText, { color: theme.gold }]}>{canvasLayout}</Text>
                  <Text style={[fStyles.canvasPreviewSub, { color: theme.textDim }]}>{selectedCanvas.ratio}</Text>
                </View>
              </View>

              {/* Layout grid */}
              <Text style={[fStyles.sectionLabel, { color: theme.textMuted }]}>SELECT CANVAS</Text>
              <View style={fStyles.canvasGrid}>
                {CANVAS_LAYOUTS.map(cl => (
                  <TouchableOpacity
                    key={cl.id}
                    onPress={() => setCanvasLayout(cl.id)}
                    style={[
                      fStyles.canvasChip,
                      {
                        backgroundColor: canvasLayout === cl.id ? theme.primary : theme.surface2,
                        borderColor: canvasLayout === cl.id ? theme.primary : theme.primary + '33',
                      },
                    ]}
                  >
                    <Text style={[fStyles.canvasChipLabel, { color: canvasLayout === cl.id ? '#fff' : theme.textMuted }]}>
                      {cl.label}
                    </Text>
                    <Text style={[fStyles.canvasChipRatio, { color: canvasLayout === cl.id ? 'rgba(255,255,255,0.7)' : theme.textDim }]}>
                      {cl.ratio}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Circle size (only for circle layouts) */}
              {isCircle && (
                <>
                  <Text style={[fStyles.sectionLabel, { color: theme.textMuted, marginTop: 12 }]}>CIRCLE SIZE</Text>
                  <SliderRow
                    label="DIAMETER (px)"
                    value={circleSize} min={60} max={300} step={10}
                    onDecrease={() => setCircleSize(v => Math.max(60, v - 10))}
                    onIncrease={() => setCircleSize(v => Math.min(300, v + 10))}
                    theme={theme} valueDisplay={String(circleSize)} unit="px"
                  />
                </>
              )}

              {/* Corner radius (only for rect) */}
              {!isCircle && (
                <SliderRow
                  label="CORNER RADIUS"
                  value={cornerRadius} min={0} max={50} step={2}
                  onDecrease={() => setCornerRadius(v => Math.max(0, v - 2))}
                  onIncrease={() => setCornerRadius(v => Math.min(50, v + 2))}
                  theme={theme} valueDisplay={String(cornerRadius)} unit="px"
                />
              )}

              {/* Border width */}
              <SliderRow
                label="BORDER WIDTH"
                value={borderWidth} min={0} max={8} step={1}
                onDecrease={() => setBorderWidth(v => Math.max(0, v - 1))}
                onIncrease={() => setBorderWidth(v => Math.min(8, v + 1))}
                theme={theme} valueDisplay={String(borderWidth)} unit="px"
              />

              {/* Shadow intensity */}
              <SliderRow
                label="SHADOW / GLOW INTENSITY"
                value={shadowIntensity} min={0} max={1} step={0.1}
                onDecrease={() => setShadowIntensity(v => Math.max(0, +(v - 0.1).toFixed(1)))}
                onIncrease={() => setShadowIntensity(v => Math.min(1, +(v + 0.1).toFixed(1)))}
                theme={theme}
              />
            </View>
          </View>

          {/* ── IMAGE ADJUSTMENTS ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="brightness-6" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>IMAGE ADJUSTMENTS</Text>
            </View>
            <View style={fStyles.cardBody}>
              <SliderRow label="BRIGHTNESS" value={f.brightness} min={0.3} max={1.8} step={step}
                onDecrease={() => updateDisplayFilters({ brightness: Math.max(0.3, +(f.brightness - step).toFixed(1)) })}
                onIncrease={() => updateDisplayFilters({ brightness: Math.min(1.8, +(f.brightness + step).toFixed(1)) })}
                theme={theme} />
              <SliderRow label="CONTRAST" value={f.contrast} min={0.5} max={2.0} step={step}
                onDecrease={() => updateDisplayFilters({ contrast: Math.max(0.5, +(f.contrast - step).toFixed(1)) })}
                onIncrease={() => updateDisplayFilters({ contrast: Math.min(2.0, +(f.contrast + step).toFixed(1)) })}
                theme={theme} />
              <SliderRow label="SATURATION" value={f.saturation} min={0} max={2.0} step={step}
                onDecrease={() => updateDisplayFilters({ saturation: Math.max(0, +(f.saturation - step).toFixed(1)) })}
                onIncrease={() => updateDisplayFilters({ saturation: Math.min(2.0, +(f.saturation + step).toFixed(1)) })}
                theme={theme} />
              <SliderRow label="BACKGROUND BLUR" value={f.blur} min={0} max={5} step={0.5}
                onDecrease={() => updateDisplayFilters({ blur: Math.max(0, +(f.blur - 0.5).toFixed(1)) })}
                onIncrease={() => updateDisplayFilters({ blur: Math.min(5, +(f.blur + 0.5).toFixed(1)) })}
                theme={theme} valueDisplay={`${f.blur}`} />
            </View>
          </View>

          {/* ── IMAGE ASPECT RATIO ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="aspect-ratio" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>IMAGE ASPECT RATIO</Text>
            </View>
            <View style={fStyles.cardBody}>
              <View style={fStyles.aspectRow}>
                {ASPECT_OPTIONS.map(asp => (
                  <TouchableOpacity
                    key={asp}
                    onPress={() => updateDisplayFilters({ imageAspect: asp })}
                    style={[fStyles.aspectBtn, {
                      backgroundColor: f.imageAspect === asp ? theme.primary : theme.surface2,
                      borderColor: theme.primary + '55',
                    }]}
                  >
                    <Text style={[fStyles.aspectBtnText, { color: f.imageAspect === asp ? '#fff' : theme.textMuted }]}>{asp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── TEXTURE OVERLAYS ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="texture" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>TEXTURE OVERLAYS</Text>
            </View>
            <View style={fStyles.cardBody}>
              <View style={fStyles.aspectRow}>
                {TEXTURE_OPTIONS.map(t => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTextureOverlay(t)}
                    style={[fStyles.aspectBtn, {
                      backgroundColor: textureOverlay === t ? theme.primary : theme.surface2,
                      borderColor: theme.primary + '55',
                    }]}
                  >
                    <Text style={[fStyles.aspectBtnText, { color: textureOverlay === t ? '#fff' : theme.textMuted }]}>
                      {t === 'none' ? 'None' : t === 'paper' ? '📄 Paper' : t === 'metal' ? '⚙️ Metal' : t === 'noise' ? '📺 Noise' : t === 'glass' ? '🪟 Glass' : '🌈 Holo'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ── COLOR GRADING ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="color-lens" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>COLOR GRADING</Text>
            </View>
            <View style={fStyles.cardBody}>
              <View style={fStyles.colorGradeRow}>
                {COLOR_GRADES.map(cg => {
                  const colorMap: Record<string, string> = {
                    none: '#555', warm: '#e65100', cool: '#0277bd', vintage: '#7b4f29',
                    fade: '#78909c', dramatic: '#c8102e', matrix: '#00c853',
                  };
                  return (
                    <TouchableOpacity
                      key={cg}
                      onPress={() => setColorGrade(cg)}
                      style={[fStyles.colorGradeBtn, {
                        backgroundColor: colorGrade === cg ? (colorMap[cg] ?? theme.primary) : theme.surface2,
                        borderColor: colorMap[cg] ?? theme.primary + '55',
                      }]}
                    >
                      <Text style={[fStyles.colorGradeBtnText, { color: colorGrade === cg ? '#fff' : theme.textMuted }]}>
                        {cg === 'none' ? 'None' : cg === 'warm' ? '🔶 Warm' : cg === 'cool' ? '🔷 Cool' : cg === 'vintage' ? '📼 Vintage' : cg === 'fade' ? '🌫️ Fade' : cg === 'dramatic' ? '🎬 Drama' : '💚 Matrix'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* ── VISUAL EFFECTS ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="auto-fix-high" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>VISUAL EFFECTS & FILTERS</Text>
            </View>
            <View style={fStyles.cardBody}>
              <ToggleRow label="Vignette" desc="Dark edges around the display" value={f.vignette} onToggle={() => updateDisplayFilters({ vignette: !f.vignette })} theme={theme} />
              <ToggleRow label="Grayscale" desc="Black & white mode" value={f.grayscale} onToggle={() => updateDisplayFilters({ grayscale: !f.grayscale })} theme={theme} />
              <ToggleRow label="Sepia" desc="Warm vintage tone" value={f.sepia} onToggle={() => updateDisplayFilters({ sepia: !f.sepia })} theme={theme} />
              <ToggleRow label="Scanlines" desc="CRT scanline texture overlay" value={f.scanlines} onToggle={() => updateDisplayFilters({ scanlines: !f.scanlines })} theme={theme} />
              <ToggleRow label="Film Grain" desc="Subtle cinematic film grain" value={f.filmGrain} onToggle={() => updateDisplayFilters({ filmGrain: !f.filmGrain })} theme={theme} />
              <ToggleRow label="Glass Effect" desc="Frosted glass panel style" value={f.glassEffect} onToggle={() => updateDisplayFilters({ glassEffect: !f.glassEffect })} theme={theme} />
              <ToggleRow label="Neon Glow" desc="Neon border glow effects" value={f.neonGlow} onToggle={() => updateDisplayFilters({ neonGlow: !f.neonGlow })} theme={theme} />
              <ToggleRow label="Dark Mode +" desc="Extra dark background boost" value={f.darkMode} onToggle={() => updateDisplayFilters({ darkMode: !f.darkMode })} theme={theme} />
            </View>
          </View>

          {/* ── ADVANCED DISPLAY ── */}
          <View style={[fStyles.card, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]}>
            <View style={[fStyles.cardHeader, { backgroundColor: theme.surface2, borderBottomColor: theme.primary + '22' }]}>
              <MaterialIcons name="settings-overscan" size={16} color={theme.gold} />
              <Text style={[fStyles.cardTitle, { color: theme.gold }]}>PROFESSIONAL BROADCAST SETTINGS</Text>
            </View>
            <View style={fStyles.cardBody}>
              <Text style={[fStyles.infoText, { color: theme.textDim }]}>
                {'Professional broadcast settings apply to the live channel display. These settings persist across app restarts and affect all viewers.'}
              </Text>

              {/* Preset buttons */}
              <Text style={[fStyles.sectionLabel, { color: theme.textMuted, marginTop: 8 }]}>QUICK PRESETS</Text>
              <View style={fStyles.presetRow}>
                {[
                  { label: '📺 Studio', action: () => { updateDisplayFilters({ brightness: 1.1, contrast: 1.2, saturation: 1.1, scanlines: false, vignette: true }); } },
                  { label: '🎬 Cinema', action: () => { updateDisplayFilters({ brightness: 0.9, contrast: 1.4, saturation: 0.8, filmGrain: true, vignette: true }); } },
                  { label: '🌑 Night', action: () => { updateDisplayFilters({ brightness: 0.7, contrast: 1.1, saturation: 0.6, darkMode: true, neonGlow: true }); } },
                  { label: '☀️ Bright', action: () => { updateDisplayFilters({ brightness: 1.4, contrast: 1.0, saturation: 1.3, darkMode: false }); } },
                  { label: '💻 Matrix', action: () => { updateDisplayFilters({ brightness: 1, contrast: 1.3, saturation: 0, scanlines: true, neonGlow: true }); } },
                ].map(preset => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={preset.action}
                    style={[fStyles.presetBtn, { backgroundColor: theme.surface2, borderColor: theme.primary + '44' }]}
                  >
                    <Text style={[fStyles.presetBtnText, { color: theme.textMuted }]}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const fStyles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  title: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, borderWidth: 1 },
  resetText: { fontSize: 11, fontWeight: '600' },
  scroll: { padding: 14, gap: 12 },
  previewBanner: { flexDirection: 'row', gap: 8, padding: 10, borderRadius: 6, borderWidth: 1, alignItems: 'center' },
  previewText: { flex: 1, fontSize: 10 },
  card: { borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
  cardTitle: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  cardBadge: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  cardBody: { padding: 14 },
  sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  infoText: { fontSize: 10, lineHeight: 16 },

  // Canvas preview
  canvasPreviewArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  canvasPreview: {
    justifyContent: 'center', alignItems: 'center',
    overflow: 'hidden',
  },
  canvasPreviewText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  canvasPreviewSub: { fontSize: 8, letterSpacing: 0.5, marginTop: 3 },

  // Canvas grid
  canvasGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  canvasChip: {
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: 5, borderWidth: 1,
    alignItems: 'center', minWidth: 68,
  },
  canvasChipLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  canvasChipRatio: { fontSize: 8, marginTop: 2 },

  // Slider
  sliderRow: { marginBottom: 14 },
  sliderLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  sliderControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sliderBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  sliderBtnText: { fontSize: 18, fontWeight: '700', lineHeight: 20 },
  track: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2 },
  sliderVal: { fontSize: 11, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  toggleLabel: { fontSize: 13, fontWeight: '500' },
  toggleDesc: { fontSize: 9, marginTop: 2 },

  // Aspect ratio
  aspectRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  aspectBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, borderWidth: 1 },
  aspectBtnText: { fontSize: 11, fontWeight: '600' },

  // Texture
  // Color grading
  colorGradeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  colorGradeBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 5, borderWidth: 1 },
  colorGradeBtnText: { fontSize: 10, fontWeight: '600' },

  // Presets
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  presetBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 5, borderWidth: 1 },
  presetBtnText: { fontSize: 11, fontWeight: '600' },
});
