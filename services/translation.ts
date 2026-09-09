/**
 * Translation service — Urdu → 11 languages
 * 3-tier fallback: MyMemory → Google unofficial → Lingva
 * 7-day AsyncStorage cache + in-memory layer
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LangCode = 'ur' | 'en' | 'ar' | 'fa' | 'ps' | 'tr' | 'bn' | 'hi' | 'ru' | 'zh' | 'sd';

export type SubtitleLang = {
  code: LangCode;
  label: string;
  nativeLabel: string;
  isRTL: boolean;
  bgColor: string;
  textColor: string;
  myMemoryCode: string;   // langpair code for MyMemory
  googleCode: string;     // Google Translate lang code
  lingvaCode: string;     // Lingva lang code
};

export const SUBTITLE_LANGS: SubtitleLang[] = [
  {
    code: 'en', label: 'English', nativeLabel: 'English', isRTL: false,
    bgColor: '#071a2e', textColor: '#60cfff',
    myMemoryCode: 'en', googleCode: 'en', lingvaCode: 'en',
  },
  {
    code: 'ar', label: 'Arabic', nativeLabel: 'عربي', isRTL: true,
    bgColor: '#1a1200', textColor: '#ffd740',
    myMemoryCode: 'ar', googleCode: 'ar', lingvaCode: 'ar',
  },
  {
    code: 'fa', label: 'Farsi', nativeLabel: 'فارسی', isRTL: true,
    bgColor: '#0d2200', textColor: '#a5d6a7',
    myMemoryCode: 'fa', googleCode: 'fa', lingvaCode: 'fa',
  },
  {
    code: 'ps', label: 'Pashto', nativeLabel: 'پښتو', isRTL: true,
    bgColor: '#1a1000', textColor: '#ffcc80',
    myMemoryCode: 'ps', googleCode: 'ps', lingvaCode: 'ps',
  },
  {
    code: 'tr', label: 'Turkish', nativeLabel: 'Türkçe', isRTL: false,
    bgColor: '#1a0010', textColor: '#f48fb1',
    myMemoryCode: 'tr', googleCode: 'tr', lingvaCode: 'tr',
  },
  {
    code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', isRTL: false,
    bgColor: '#001220', textColor: '#80cbc4',
    myMemoryCode: 'bn', googleCode: 'bn', lingvaCode: 'bn',
  },
  {
    code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', isRTL: false,
    bgColor: '#1a0000', textColor: '#ff8a65',
    myMemoryCode: 'hi', googleCode: 'hi', lingvaCode: 'hi',
  },
  {
    code: 'ru', label: 'Russian', nativeLabel: 'Русский', isRTL: false,
    bgColor: '#00001a', textColor: '#ce93d8',
    myMemoryCode: 'ru', googleCode: 'ru', lingvaCode: 'ru',
  },
  {
    code: 'zh', label: 'Chinese', nativeLabel: '中文', isRTL: false,
    bgColor: '#1a0a00', textColor: '#ef9a9a',
    myMemoryCode: 'zh-CN', googleCode: 'zh-CN', lingvaCode: 'zh',
  },
  {
    code: 'sd', label: 'Sindhi', nativeLabel: 'سنڌي', isRTL: true,
    bgColor: '#001a14', textColor: '#69f0ae',
    myMemoryCode: 'sd', googleCode: 'sd', lingvaCode: 'sd',
  },
];

export type Translations = Partial<Record<LangCode, string>>;

const CACHE_KEY = '@swn_trans_v3';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_CACHE_ENTRIES = 150;

type CacheEntry = { translations: Translations; ts: number };
type Cache = Record<string, CacheEntry>;

let memCache: Cache = {};
let cacheLoaded = false;

async function getCache(): Promise<Cache> {
  if (cacheLoaded) return memCache;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) memCache = JSON.parse(raw);
  } catch {}
  cacheLoaded = true;
  return memCache;
}

async function persistCache() {
  try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(memCache)); } catch {}
}

export async function clearTranslationCache() {
  memCache = {};
  cacheLoaded = false;
  try { await AsyncStorage.removeItem(CACHE_KEY); } catch {}
}

// ─── Tier 1: MyMemory (5000 chars/day free, no key) ─────────────────────────
async function myMemory(text: string, targetCode: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(text.slice(0, 350));
    const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=ur%7C${targetCode}&de=dr.mirfan5577%40gmail.com`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const status: number = data?.responseStatus;
    const translated: string = data?.responseData?.translatedText ?? '';
    if (
      status === 200 &&
      translated &&
      translated.trim() &&
      translated.trim() !== text.trim() &&
      !translated.toUpperCase().includes('INVALID') &&
      !translated.toUpperCase().includes('PLEASE SELECT') &&
      !translated.toUpperCase().includes('MYMEMORY WARNING')
    ) {
      return translated.trim();
    }
    // Try matches fallback
    const matches: any[] = data?.matches ?? [];
    const best = matches.find(m => Number(m.quality) >= 60 && m.translation && m.translation !== text);
    if (best) return String(best.translation).trim();
    return null;
  } catch { return null; }
}

// ─── Tier 2: Google Translate unofficial endpoint ────────────────────────────
async function googleTranslate(text: string, targetCode: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(text.slice(0, 500));
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ur&tl=${targetCode}&dt=t&q=${q}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const parts: string[] = data[0]
        .filter((part: any) => Array.isArray(part) && typeof part[0] === 'string')
        .map((part: any) => String(part[0]));
      const joined = parts.join('').trim();
      if (joined && joined !== text.trim()) return joined;
    }
    return null;
  } catch { return null; }
}

// ─── Tier 3: Lingva (free, open source) ─────────────────────────────────────
async function lingva(text: string, targetCode: string): Promise<string | null> {
  try {
    const q = encodeURIComponent(text.slice(0, 300));
    const url = `https://lingva.ml/api/v1/ur/${targetCode}/${q}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const result: string = data?.translation ?? '';
    if (result && result.trim() && result.trim() !== text.trim()) return result.trim();
    return null;
  } catch { return null; }
}

// ─── Translate one language with full fallback chain ─────────────────────────
async function translateOne(text: string, lang: SubtitleLang): Promise<string> {
  // Tier 1: MyMemory
  const r1 = await myMemory(text, lang.myMemoryCode);
  if (r1) return r1;
  // Tier 2: Google
  const r2 = await googleTranslate(text, lang.googleCode);
  if (r2) return r2;
  // Tier 3: Lingva
  const r3 = await lingva(text, lang.lingvaCode);
  if (r3) return r3;
  // Return original Urdu text as last resort so subtitles still show
  return text;
}

// ─── Main export ─────────────────────────────────────────────────────────────
export async function translateToAllLanguages(urduText: string): Promise<Translations> {
  if (!urduText.trim()) return {};

  const key = urduText.trim().slice(0, 200);
  const cache = await getCache();
  const hit = cache[key];

  if (hit && Date.now() - hit.ts < CACHE_TTL) {
    return hit.translations;
  }

  const results: Translations = { ur: urduText };
  const targets = SUBTITLE_LANGS.filter(l => l.code !== 'ur');

  // Translate all in parallel — each language is independent
  const settled = await Promise.allSettled(
    targets.map(async lang => {
      const translated = await translateOne(urduText, lang);
      return { code: lang.code as LangCode, text: translated };
    })
  );

  settled.forEach(r => {
    if (r.status === 'fulfilled' && r.value.text) {
      results[r.value.code] = r.value.text;
    }
  });

  // Save to cache — evict oldest if over limit
  cache[key] = { translations: results, ts: Date.now() };
  const keys = Object.keys(cache);
  if (keys.length > MAX_CACHE_ENTRIES) {
    keys
      .sort((a, b) => (cache[a]?.ts ?? 0) - (cache[b]?.ts ?? 0))
      .slice(0, keys.length - MAX_CACHE_ENTRIES)
      .forEach(k => delete cache[k]);
  }
  memCache = cache;
  persistCache();

  return results;
}

// ─── Single translation helper (for admin preview) ───────────────────────────
export async function translateSingle(text: string, targetLang: string): Promise<string> {
  const r = await myMemory(text, targetLang);
  if (r) return r;
  const r2 = await googleTranslate(text, targetLang);
  if (r2) return r2;
  return text;
}
