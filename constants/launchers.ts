export type LauncherTheme = {
  id: number;
  name: string;
  nameUr: string;
  primary: string;
  primary2: string;
  gold: string;
  background: string;
  surface: string;
  surface2: string;
  text: string;
  textMuted: string;
  textDim: string;
  glow: string;
  description: string;
  descriptionUr: string;
  emoji: string;
  gradientColors: [string, string, string];
  // Layout & animation identity
  headerLayout: 'classic' | 'centered' | 'minimal' | 'bold' | 'split' | 'overlay' | 'glass' | 'neon' | 'broadcast' | 'editorial';
  tickerPosition: 'top' | 'bottom' | 'both';
  cardStyle: 'sharp' | 'rounded' | 'pill' | 'hexagonal' | 'outlined' | 'ghost';
  animationType: 'fade' | 'slide' | 'pulse' | 'zoom' | 'flip' | 'glitch' | 'wave' | 'sparkle' | 'matrix' | 'typewriter';
  accentBorder: string;
  headerBg: [string, string];
};

export const LAUNCHERS: LauncherTheme[] = [
  {
    id: 0, name: 'CLASSIC RED', nameUr: 'کلاسک ریڈ', emoji: '🔴',
    primary: '#c8102e', primary2: '#ff1a35', gold: '#d4a020',
    background: '#060a14', surface: '#0d1428', surface2: '#101c38',
    text: '#f0f4fc', textMuted: '#8899bb', textDim: '#3a4a66',
    glow: 'rgba(200,16,46,0.45)',
    gradientColors: ['rgba(200,16,46,0.15)', 'rgba(200,16,46,0.04)', 'transparent'],
    description: 'Original red-navy professional broadcast — classic BBC/CNN style with bold red banners, sharp edges, high contrast typography, and side-sweep transition animations.',
    descriptionUr: 'اصل ریڈ نیوی پروفیشنل نشریاتی تھیم',
    headerLayout: 'classic', tickerPosition: 'top', cardStyle: 'sharp',
    animationType: 'slide', accentBorder: '#c8102e',
    headerBg: ['#0d1428', '#060a14'],
  },
  {
    id: 1, name: 'MIDNIGHT BLUE', nameUr: 'مڈنائٹ بلیو', emoji: '🔵',
    primary: '#1565c0', primary2: '#1976d2', gold: '#64b5f6',
    background: '#010a18', surface: '#051520', surface2: '#081c2c',
    text: '#e3f2fd', textMuted: '#90caf9', textDim: '#1a4060',
    glow: 'rgba(21,101,192,0.45)',
    gradientColors: ['rgba(21,101,192,0.18)', 'rgba(21,101,192,0.06)', 'transparent'],
    description: 'Deep corporate blue — Al-Jazeera/Reuters inspired. Centered header with logo dominance, glass-morphic panels, smooth fade transitions, and horizontally-split lower thirds.',
    descriptionUr: 'پروفیشنل گہری نیلی کارپوریٹ نشریات',
    headerLayout: 'centered', tickerPosition: 'top', cardStyle: 'rounded',
    animationType: 'fade', accentBorder: '#1565c0',
    headerBg: ['#081c2c', '#010a18'],
  },
  {
    id: 2, name: 'GOLDEN ERA', nameUr: 'گولڈن ایرا', emoji: '🌟',
    primary: '#d4a020', primary2: '#ffd740', gold: '#ffab00',
    background: '#0a0800', surface: '#1a1400', surface2: '#221a00',
    text: '#fff8e1', textMuted: '#ffe082', textDim: '#5a4800',
    glow: 'rgba(212,160,32,0.45)',
    gradientColors: ['rgba(212,160,32,0.18)', 'rgba(212,160,32,0.06)', 'transparent'],
    description: 'Luxury gold prestige — inspired by premium broadcast networks. Bold editorial header, gilded borders, sparkle animations, serif-style typography with warm amber glow overlays.',
    descriptionUr: 'لگژری گولڈ پریسٹیج نشریات',
    headerLayout: 'editorial', tickerPosition: 'top', cardStyle: 'outlined',
    animationType: 'sparkle', accentBorder: '#d4a020',
    headerBg: ['#221a00', '#0a0800'],
  },
  {
    id: 3, name: 'EMERALD', nameUr: 'زمرد', emoji: '💚',
    primary: '#00695c', primary2: '#00897b', gold: '#69f0ae',
    background: '#001a14', surface: '#002018', surface2: '#003025',
    text: '#e0f2f1', textMuted: '#80cbc4', textDim: '#004d40',
    glow: 'rgba(0,105,92,0.45)',
    gradientColors: ['rgba(0,105,92,0.18)', 'rgba(0,105,92,0.06)', 'transparent'],
    description: 'Nature-tone emerald broadcast — split-screen layout, wave-motion transitions between news items, overlapping green gradients, and minimal UI with maximum visual breathing room.',
    descriptionUr: 'گہری زمرد سبز نیچر نشریات',
    headerLayout: 'split', tickerPosition: 'top', cardStyle: 'pill',
    animationType: 'wave', accentBorder: '#00695c',
    headerBg: ['#003025', '#001a14'],
  },
  {
    id: 4, name: 'ROYAL PURPLE', nameUr: 'رائل پرپل', emoji: '🟣',
    primary: '#6a1b9a', primary2: '#8e24aa', gold: '#ce93d8',
    background: '#0d0014', surface: '#18002a', surface2: '#220040',
    text: '#f3e5f5', textMuted: '#ce93d8', textDim: '#4a0072',
    glow: 'rgba(106,27,154,0.45)',
    gradientColors: ['rgba(106,27,154,0.18)', 'rgba(106,27,154,0.06)', 'transparent'],
    description: 'Regal purple prestige — inspired by royal decree channels. Bold overlay header, flip-card news transitions, deep velvet background, hexagonal content cards with jewel-tone accents.',
    descriptionUr: 'شاہانہ بنفشی رنگ کا پریسٹیج چینل',
    headerLayout: 'overlay', tickerPosition: 'top', cardStyle: 'hexagonal',
    animationType: 'flip', accentBorder: '#6a1b9a',
    headerBg: ['#220040', '#0d0014'],
  },
  {
    id: 5, name: 'ARCTIC FROST', nameUr: 'آرکٹک فراسٹ', emoji: '🧊',
    primary: '#0277bd', primary2: '#0288d1', gold: '#b3e5fc',
    background: '#010d14', surface: '#031520', surface2: '#041c2a',
    text: '#e1f5fe', textMuted: '#81d4fa', textDim: '#01579b',
    glow: 'rgba(2,119,189,0.45)',
    gradientColors: ['rgba(2,119,189,0.18)', 'rgba(2,119,189,0.06)', 'transparent'],
    description: 'Ice-glass arctic minimal — glass-morphic frosted panels, zoom-pulse transitions, icy blue crystalline borders, minimal header with ultra-clean typography and breathable white space.',
    descriptionUr: 'آرکٹک آئس بلیو ڈیجیٹل نشریات',
    headerLayout: 'glass', tickerPosition: 'top', cardStyle: 'ghost',
    animationType: 'zoom', accentBorder: '#0277bd',
    headerBg: ['#041c2a', '#010d14'],
  },
  {
    id: 6, name: 'SUNSET FIRE', nameUr: 'سن سیٹ فائر', emoji: '🌅',
    primary: '#e65100', primary2: '#ff6d00', gold: '#ffcc02',
    background: '#0f0700', surface: '#201200', surface2: '#2a1800',
    text: '#fff3e0', textMuted: '#ffcc80', textDim: '#6a2c00',
    glow: 'rgba(230,81,0,0.45)',
    gradientColors: ['rgba(230,81,0,0.18)', 'rgba(230,81,0,0.06)', 'transparent'],
    description: 'Fiery broadcast drama — diagonal gradient headers, pulse-glow transitions, ember-orange content overlays, and bold broadcast-style full-width typography banners.',
    descriptionUr: 'گرم شعلہ سن سیٹ ڈراما نشریات',
    headerLayout: 'bold', tickerPosition: 'top', cardStyle: 'sharp',
    animationType: 'pulse', accentBorder: '#e65100',
    headerBg: ['#2a1800', '#0f0700'],
  },
  {
    id: 7, name: 'NEON PULSE', nameUr: 'نیون پلس', emoji: '⚡',
    primary: '#00c853', primary2: '#00e676', gold: '#b9f6ca',
    background: '#000000', surface: '#020d04', surface2: '#041408',
    text: '#f1fff5', textMuted: '#69ff88', textDim: '#1b5e20',
    glow: 'rgba(0,200,83,0.45)',
    gradientColors: ['rgba(0,200,83,0.18)', 'rgba(0,200,83,0.06)', 'transparent'],
    description: 'Cyberpunk matrix — terminal-style neon header, glitch-animation transitions, matrix rain effect overlay, scanline textures, monospace text and neon-green CRT-inspired UI.',
    descriptionUr: 'میٹرکس نیون گرین ڈیجیٹل سائبر نشریات',
    headerLayout: 'neon', tickerPosition: 'top', cardStyle: 'outlined',
    animationType: 'glitch', accentBorder: '#00c853',
    headerBg: ['#041408', '#000000'],
  },
  {
    id: 8, name: 'CRIMSON SHADOW', nameUr: 'کریمسن شیڈو', emoji: '🩸',
    primary: '#b71c1c', primary2: '#c62828', gold: '#ef9a9a',
    background: '#0a0000', surface: '#160000', surface2: '#200505',
    text: '#ffebee', textMuted: '#ef9a9a', textDim: '#7f0000',
    glow: 'rgba(183,28,28,0.45)',
    gradientColors: ['rgba(183,28,28,0.18)', 'rgba(183,28,28,0.06)', 'transparent'],
    description: 'Dark dramatic shadow — broadcast emergency style. Stark full-bleed header, typewriter news transitions, deep blood-red vignette, high-contrast stark typography for urgent impact.',
    descriptionUr: 'گہری کریمسن ڈراماتک شیڈو نشریات',
    headerLayout: 'broadcast', tickerPosition: 'top', cardStyle: 'sharp',
    animationType: 'typewriter', accentBorder: '#b71c1c',
    headerBg: ['#200505', '#0a0000'],
  },
  {
    id: 9, name: 'STEEL CITY', nameUr: 'اسٹیل سٹی', emoji: '⚙️',
    primary: '#546e7a', primary2: '#607d8b', gold: '#b0bec5',
    background: '#080c0e', surface: '#101318', surface2: '#161c20',
    text: '#eceff1', textMuted: '#90a4ae', textDim: '#37474f',
    glow: 'rgba(84,110,122,0.45)',
    gradientColors: ['rgba(84,110,122,0.18)', 'rgba(84,110,122,0.06)', 'transparent'],
    description: 'Industrial minimal steel — technical broadcast aesthetic. Monochrome headers, smooth slide transitions, gridline content separation, industrial-strength layout with data-dense lower thirds.',
    descriptionUr: 'کارپوریٹ اسٹیل گرے پروفیشنل نیوز',
    headerLayout: 'minimal', tickerPosition: 'top', cardStyle: 'rounded',
    animationType: 'slide', accentBorder: '#546e7a',
    headerBg: ['#161c20', '#080c0e'],
  },
];
