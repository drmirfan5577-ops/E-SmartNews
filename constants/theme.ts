export const ADMIN_PASSWORD_DEFAULT = 'Daood5577';

export const STORAGE_KEYS = {
  NEWS_ITEMS: '@swn_news',
  TICKER_EN: '@swn_ten',
  TICKER_UR: '@swn_tur',
  TICKER_SPEED: '@swn_tspd',
  LANGUAGE: '@swn_lang',
  ACTIVE_LAUNCHER: '@swn_launcher',
  LINKS: '@swn_links',
  BG_MUSIC_URI: '@swn_muri',
  BG_MUSIC_ON: '@swn_mon',
  BG_MUSIC_NAME: '@swn_mname',
  BG_MUSIC_SLOT: '@swn_mslot',
  MUSIC_SLOTS: '@swn_mslots',
  ADMIN_PASS: '@swn_apass',
  BREAKING_NEWS: '@swn_brk',
  TRANSLATIONS_CACHE: '@swn_trans',
  SUB_ADMINS: '@swn_subadmins',
  CHANNEL_LOGO_URI: '@swn_logo',
  SUBTITLE_SETTINGS: '@swn_subsettings',
  ADS: '@swn_ads',
  INTRO_OUTRO: '@swn_introutro',
  DISPLAY_FILTERS: '@swn_filters',
  FLASH_SETTINGS: '@swn_flash',
};

export const CHANNEL = {
  nameEn: 'SMART WORLD NEWS',
  nameUr: 'سمارٹ ورلڈ نیوز',
  tagline: 'Truth through the Lens',
  sloganEn: 'BREAKING · LIVE · GLOBAL',
  sloganUr: 'بریکنگ · براہ راست · عالمی',
  aboutEn: 'EvEr SmArT-DiGiTaL-wOrLd\nDr M Irfan Qadir Thaheem\nThe One Man Army.\nA project of SMART WORLD ORDER\nA Global Family Platform Vision.\nEmail: dr.mirfan5577@gmail.com',
  aboutUr: 'ایور سمارٹ ڈیجیٹل ورلڈ\nڈاکٹر ایم عرفان قادر تھاہیم\nدی ون مین آرمی\nایک پروجیکٹ - سمارٹ ورلڈ آرڈر\nایک عالمی فیملی پلیٹ فارم وژن\nای میل: dr.mirfan5577@gmail.com',
  email: 'dr.mirfan5577@gmail.com',
};

export const NARRATIVES = [
  '"EvEr SmArT nEwS"',
  'Truth through the Lens',
  'We bring what they hide',
  'Breaking Realities — not just news',
  'Both eyes on what\'s really going on',
  'Realities and Facts at your doorstep',
  'Dark Realities · Hidden Facts · Deeper Insights',
  'Stay connected, keep on watching',
  'EvEr SmArT nEwS — Truth, Always',
  'The Global Family Platform Vision',
  'SMART WORLD ORDER · One Man Army',
  'We report what others fear to speak',
];

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export type NewsSection = 'ticker' | 'breaking' | 'regular';

export type NewsItem = {
  id: string;
  en: string;
  ur: string;
  cat: string;
  catUr: string;
  section: NewsSection;
  imageUri: string | null;
  imageUris: string[];
  videoUris: string[];
  isBreaking: boolean;
  isEnabled: boolean;
  isPublished: boolean;
  durationSec: number;
  repeatCount: number;
  publishedAt: string;
  scheduledAt?: string;       // ISO string — when set, item auto-publishes at this time
  translations?: Record<string, string>;
};

export type AppLink = {
  id: string;
  type: 'email' | 'website' | 'social' | 'media';
  label: string;
  url: string;
  isActive: boolean;
};

export type MusicSlot = {
  id: string;
  name: string;
  uri: string | null;
  isBuiltIn: boolean;
  builtInUrl?: string;
};

export type SubAdmin = {
  id: string;
  name: string;
  password: string;
  isActive: boolean;
  createdAt: string;
};

// ─── SUBTITLE SETTINGS ─────────────────────────────────────────────────────────
export type SubtitleSettings = {
  fontSize: number;
  fontFamily: 'system' | 'serif' | 'monospace';
  textBrightness: number;
  speed: number;
  rowHeight: number;
  rowWidthPercent: number;
  showBadge: boolean;
  showArrow: boolean;
  customBgColors: Record<string, string>;
  customTextColors: Record<string, string>;
  customEnabled: Record<string, boolean>;
  textShadow: boolean;
  glowEffect: boolean;
  roundedBadge: boolean;
};

export const DEFAULT_SUBTITLE_SETTINGS: SubtitleSettings = {
  fontSize: 10,
  fontFamily: 'system',
  textBrightness: 1,
  speed: 28000,
  rowHeight: 22,
  rowWidthPercent: 100,
  showBadge: true,
  showArrow: true,
  customBgColors: {},
  customTextColors: {},
  customEnabled: {},
  textShadow: true,
  glowEffect: false,
  roundedBadge: false,
};

// ─── ADS ──────────────────────────────────────────────────────────────────────
export type AdItem = {
  id: string;
  title: string;
  type: 'image' | 'video' | 'text' | 'html';
  mediaUri: string | null;
  text: string;
  bgColor: string;
  textColor: string;
  durationSec: number;
  frequency: number;
  isEnabled: boolean;
  isPublished: boolean;
  link: string;
  createdAt: string;
};

export const DEFAULT_ADS: AdItem[] = [];

// ─── INTRO / OUTRO ────────────────────────────────────────────────────────────
export type IntroOutroSettings = {
  introEnabled: boolean;
  outroEnabled: boolean;
  introUri: string | null;
  outroUri: string | null;
  introTitle: string;
  outroTitle: string;
  introDurationSec: number;
  outroDurationSec: number;
  introEffect: 'fade' | 'slide' | 'zoom' | 'flash';
  outroEffect: 'fade' | 'slide' | 'zoom' | 'flash';
  showOnLaunch: boolean;
  showBetweenNews: boolean;
  bgMusicDuringIntro: boolean;
};

export const DEFAULT_INTRO_OUTRO: IntroOutroSettings = {
  introEnabled: false,
  outroEnabled: false,
  introUri: null,
  outroUri: null,
  introTitle: 'SMART WORLD NEWS',
  outroTitle: 'Thank You for Watching',
  introDurationSec: 10,
  outroDurationSec: 8,
  introEffect: 'fade',
  outroEffect: 'fade',
  showOnLaunch: true,
  showBetweenNews: false,
  bgMusicDuringIntro: true,
};

// ─── DISPLAY FILTERS ──────────────────────────────────────────────────────────
export type DisplayFilters = {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  vignette: boolean;
  grayscale: boolean;
  sepia: boolean;
  scanlines: boolean;
  filmGrain: boolean;
  glassEffect: boolean;
  neonGlow: boolean;
  darkMode: boolean;
  imageAspect: '16:9' | '4:3' | '1:1' | '9:16' | 'fill';
};

export const DEFAULT_DISPLAY_FILTERS: DisplayFilters = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  blur: 0,
  vignette: false,
  grayscale: false,
  sepia: false,
  scanlines: true,
  filmGrain: false,
  glassEffect: false,
  neonGlow: false,
  darkMode: false,
  imageAspect: 'fill',
};

export const BUILTIN_MUSIC: Omit<MusicSlot, 'id'>[] = [
  { name: 'News Studio Intro', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
  { name: 'Breaking Alert Beat', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-04.mp3' },
  { name: 'Corporate Report Theme', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/communication/sounds/telephone-ring-01a.mp3' },
  { name: 'Global Affairs Ambient', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/mechanical/sounds/clock-ticking-2.mp3' },
  { name: 'Prime Time Evening', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/magic-chime-02.mp3' },
  { name: 'Urgent Bulletin Pulse', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/beep-09.mp3' },
  { name: 'World News Background', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/beep-07.mp3' },
  { name: 'Digital Age Report', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/beep-10.mp3' },
  { name: 'Late Night Update', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/magic-chime-04.mp3' },
  { name: 'Special Bulletin', isBuiltIn: true, uri: null, builtInUrl: 'https://www.soundjay.com/misc/sounds/magic-chime-03.mp3' },
];

export const DEFAULT_MUSIC_SLOTS: MusicSlot[] = [
  ...BUILTIN_MUSIC.map((m, i) => ({ id: `builtin_${i}`, ...m })),
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `custom_${i}`,
    name: `Custom Track ${i + 1}`,
    isBuiltIn: false,
    uri: null,
  })),
];

export const DEFAULT_NEWS: NewsItem[] = [
  {
    id: '1',
    en: 'World Leaders Gather for Emergency Climate Summit',
    ur: 'عالمی رہنما ہنگامی موسمیاتی سربراہی اجلاس کے لیے اکٹھے',
    cat: 'WORLD NEWS', catUr: 'عالمی خبریں',
    section: 'regular',
    imageUri: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
    imageUris: [
      'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80',
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80',
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    ],
    videoUris: [],
    isBreaking: false, isEnabled: true, isPublished: true,
    durationSec: 10, repeatCount: 1, publishedAt: new Date().toISOString(),
    translations: {
      ur: 'عالمی رہنما ہنگامی موسمیاتی سربراہی اجلاس کے لیے اکٹھے',
      en: 'World Leaders Gather for Emergency Climate Summit',
      ar: 'يجتمع زعماء العالم للقمة المناخية الطارئة',
      hi: 'विश्व नेता आपातकालीन जलवायु शिखर सम्मेलन के लिए एकत्रित',
      tr: 'Dünya Liderleri Acil İklim Zirvesi İçin Bir Araya Geldi',
    },
  },
  {
    id: '2',
    en: 'Global Markets Surge to Record High Amid Peace Talks',
    ur: 'امن مذاکرات کے دوران عالمی منڈیاں ریکارڈ بلندی پر',
    cat: 'ECONOMY', catUr: 'معیشت',
    section: 'regular',
    imageUri: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    imageUris: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    ],
    videoUris: [],
    isBreaking: false, isEnabled: true, isPublished: true,
    durationSec: 10, repeatCount: 1, publishedAt: new Date().toISOString(),
    translations: {
      ur: 'امن مذاکرات کے دوران عالمی منڈیاں ریکارڈ بلندی پر',
      en: 'Global Markets Surge to Record High Amid Peace Talks',
      ar: 'ترتفع الأسواق العالمية إلى مستوى قياسي وسط محادثات السلام',
      hi: 'शांति वार्ता के बीच वैश्विक बाजार रिकॉर्ड ऊंचाई पर',
    },
  },
  {
    id: '3',
    en: 'Major Earthquake Strikes Pacific Region — Aid Mobilised',
    ur: 'بحرالکاہل خطے میں زبردست زلزلہ — امدادی کام شروع',
    cat: 'BREAKING', catUr: 'بریکنگ',
    section: 'breaking',
    imageUri: 'https://images.unsplash.com/photo-1584553391547-908a2f66b2f0?w=800&q=80',
    imageUris: [
      'https://images.unsplash.com/photo-1584553391547-908a2f66b2f0?w=800&q=80',
      'https://images.unsplash.com/photo-1574781330855-d0db8cc6a79c?w=800&q=80',
    ],
    videoUris: [],
    isBreaking: true, isEnabled: true, isPublished: true,
    durationSec: 8, repeatCount: 2, publishedAt: new Date().toISOString(),
    translations: {
      ur: 'بحرالکاہل خطے میں زبردست زلزلہ — امدادی کام شروع',
      en: 'Major Earthquake Strikes Pacific Region — Aid Mobilised',
      ar: 'زلزال كبير يضرب منطقة المحيط الهادئ — تعبئة المساعدات',
    },
  },
  {
    id: '4',
    en: 'Technology Giants Race to Deploy Next-Gen AI Systems',
    ur: 'ٹیکنالوجی دیو اگلی نسل کے AI سسٹمز تعینات کرنے کی دوڑ میں',
    cat: 'TECHNOLOGY', catUr: 'ٹیکنالوجی',
    section: 'regular',
    imageUri: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    imageUris: [
      'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
      'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80',
    ],
    videoUris: [],
    isBreaking: false, isEnabled: true, isPublished: true,
    durationSec: 10, repeatCount: 1, publishedAt: new Date().toISOString(),
    translations: {
      ur: 'ٹیکنالوجی دیو اگلی نسل کے AI سسٹمز تعینات کرنے کی دوڑ میں',
      en: 'Technology Giants Race to Deploy Next-Gen AI Systems',
    },
  },
  {
    id: '5',
    en: 'Pakistan Cricket Team Wins Historic Series Against England',
    ur: 'پاکستان کرکٹ ٹیم نے انگلینڈ کے خلاف تاریخی سیریز جیت لی',
    cat: 'SPORTS', catUr: 'کھیل',
    section: 'regular',
    imageUri: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
    imageUris: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80',
      'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800&q=80',
    ],
    videoUris: [],
    isBreaking: false, isEnabled: true, isPublished: true,
    durationSec: 10, repeatCount: 1, publishedAt: new Date().toISOString(),
    translations: {
      ur: 'پاکستان کرکٹ ٹیم نے انگلینڈ کے خلاف تاریخی سیریز جیت لی',
      en: 'Pakistan Cricket Team Wins Historic Series Against England',
    },
  },
];

export const DEFAULT_LINKS: AppLink[] = Array.from({ length: 20 }, (_, i) => ({
  id: `link_${i + 1}`, type: 'website' as const, label: '', url: '', isActive: false,
}));

export const DEFAULT_BREAKING = [
  'WORLD LEADERS CONVENE FOR EMERGENCY SUMMIT',
  'SEISMIC ALERT — EVACUATIONS UNDERWAY',
  'MARKETS IN FREEFALL — EMERGENCY RESPONSE',
  'GLOBAL PEACE TALKS REACH CRITICAL JUNCTURE',
  'SMART WORLD NEWS — TRUTH THROUGH THE LENS',
];
