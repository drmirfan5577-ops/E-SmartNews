import React, { createContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { storage } from '@/services/storage';
import {
  STORAGE_KEYS, DEFAULT_NEWS, DEFAULT_LINKS, DEFAULT_BREAKING,
  ADMIN_PASSWORD_DEFAULT, DEFAULT_MUSIC_SLOTS,
  NewsItem, AppLink, MusicSlot, SubAdmin,
  SubtitleSettings, DEFAULT_SUBTITLE_SETTINGS,
  AdItem, DEFAULT_ADS,
  IntroOutroSettings, DEFAULT_INTRO_OUTRO,
  DisplayFilters, DEFAULT_DISPLAY_FILTERS,
} from '@/constants/theme';
import { LiveData, DEFAULT_LIVE_DATA, fetchLiveData } from '@/services/weather';

const DEFAULT_TICKER_EN = 'WORLD SUMMIT BEGINS TODAY ● MARKETS REACH NEW HIGH ● RELIEF OPERATIONS UNDERWAY ● ELECTION RESULTS AWAITED ●';
const DEFAULT_TICKER_UR = 'عالمی سربراہی اجلاس آج سے شروع ● مارکیٹس نئی بلندی پر ● امدادی آپریشن جاری ● انتخابی نتائج کا انتظار ●';

const THREE_HOURS = 3 * 60 * 60 * 1000;
const SCHEDULE_CHECK_INTERVAL = 60 * 1000; // 60 seconds

type AppContextType = {
  newsItems: NewsItem[];
  publishedNews: NewsItem[];
  scheduledNews: NewsItem[];
  tickerEn: string;
  tickerUr: string;
  tickerSpeed: number;
  breakingNews: string[];
  isAdminLoggedIn: boolean;
  language: 'en' | 'ur';
  activeLauncher: number;
  links: AppLink[];
  bgMusicUri: string | null;
  bgMusicEnabled: boolean;
  bgMusicName: string;
  bgMusicVolume: number;
  activeMusicSlot: number;
  musicSlots: MusicSlot[];
  subAdmins: SubAdmin[];
  liveData: LiveData;
  isLoaded: boolean;
  channelLogoUri: string | null;
  subtitleSettings: SubtitleSettings;
  ads: AdItem[];
  introOutro: IntroOutroSettings;
  displayFilters: DisplayFilters;
  flashNewsText: string;
  flashNewsActive: boolean;
  flashNewsEffect: string;
  login: (password: string) => boolean;
  logout: () => void;
  addNews: (item: Omit<NewsItem, 'id' | 'publishedAt'>) => void;
  updateNews: (id: string, updates: Partial<NewsItem>) => void;
  deleteNews: (id: string) => void;
  publishNews: (id: string) => void;
  scheduleNews: (id: string, scheduledAt: string) => void;
  toggleNewsEnabled: (id: string) => void;
  setTickerEn: (text: string) => void;
  setTickerUr: (text: string) => void;
  setTickerSpeed: (speed: number) => void;
  setBreakingNews: (items: string[]) => void;
  setLanguage: (lang: 'en' | 'ur') => void;
  setActiveLauncher: (idx: number) => void;
  updateLink: (id: string, updates: Partial<AppLink>) => void;
  setBgMusic: (uri: string | null, name: string) => void;
  setBgMusicEnabled: (enabled: boolean) => void;
  setBgMusicVolume: (vol: number) => void;
  setActiveMusicSlot: (idx: number) => void;
  updateMusicSlot: (id: string, updates: Partial<MusicSlot>) => void;
  changeAdminPassword: (currentPass: string, newPass: string) => boolean;
  addSubAdmin: (name: string, password: string) => void;
  updateSubAdmin: (id: string, updates: Partial<SubAdmin>) => void;
  deleteSubAdmin: (id: string) => void;
  refreshLiveData: () => void;
  setChannelLogoUri: (uri: string | null) => void;
  updateSubtitleSettings: (updates: Partial<SubtitleSettings>) => void;
  addAd: (ad: Omit<AdItem, 'id' | 'createdAt'>) => void;
  updateAd: (id: string, updates: Partial<AdItem>) => void;
  deleteAd: (id: string) => void;
  publishAd: (id: string) => void;
  updateIntroOutro: (updates: Partial<IntroOutroSettings>) => void;
  updateDisplayFilters: (updates: Partial<DisplayFilters>) => void;
  triggerFlashNews: (text: string, effect: string) => void;
  clearFlashNews: () => void;
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [newsItems, setNewsItemsState] = useState<NewsItem[]>(DEFAULT_NEWS);
  const [tickerEn, setTickerEnState] = useState(DEFAULT_TICKER_EN);
  const [tickerUr, setTickerUrState] = useState(DEFAULT_TICKER_UR);
  const [tickerSpeed, setTickerSpeedState] = useState(40);
  const [breakingNews, setBreakingNewsState] = useState<string[]>(DEFAULT_BREAKING);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [language, setLanguageState] = useState<'en' | 'ur'>('en');
  const [activeLauncher, setActiveLauncherState] = useState(0);
  const [links, setLinksState] = useState<AppLink[]>(DEFAULT_LINKS);
  const [bgMusicUri, setBgMusicUriState] = useState<string | null>(null);
  const [bgMusicEnabled, setBgMusicEnabledState] = useState(false);
  const [bgMusicName, setBgMusicNameState] = useState('');
  const [bgMusicVolume, setBgMusicVolumeState] = useState(0.3);
  const [activeMusicSlot, setActiveMusicSlotState] = useState(0);
  const [musicSlots, setMusicSlotsState] = useState<MusicSlot[]>(DEFAULT_MUSIC_SLOTS);
  const [subAdmins, setSubAdminsState] = useState<SubAdmin[]>([]);
  const [liveData, setLiveDataState] = useState<LiveData>(DEFAULT_LIVE_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [channelLogoUri, setChannelLogoUriState] = useState<string | null>(null);
  const [subtitleSettings, setSubtitleSettingsState] = useState<SubtitleSettings>(DEFAULT_SUBTITLE_SETTINGS);
  const [ads, setAdsState] = useState<AdItem[]>(DEFAULT_ADS);
  const [introOutro, setIntroOutroState] = useState<IntroOutroSettings>(DEFAULT_INTRO_OUTRO);
  const [displayFilters, setDisplayFiltersState] = useState<DisplayFilters>(DEFAULT_DISPLAY_FILTERS);
  const [flashNewsText, setFlashNewsText] = useState('');
  const [flashNewsActive, setFlashNewsActive] = useState(false);
  const [flashNewsEffect, setFlashNewsEffect] = useState('redAlert');
  const adminPassRef = useRef(ADMIN_PASSWORD_DEFAULT);

  const publishedNews = newsItems.filter(n => n.isEnabled && n.isPublished);
  const scheduledNews = newsItems.filter(n => n.scheduledAt && !n.isPublished);

  // ─── Load from storage ────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const results = await Promise.allSettled([
          storage.get<NewsItem[]>(STORAGE_KEYS.NEWS_ITEMS, DEFAULT_NEWS),
          storage.get<string>(STORAGE_KEYS.TICKER_EN, DEFAULT_TICKER_EN),
          storage.get<string>(STORAGE_KEYS.TICKER_UR, DEFAULT_TICKER_UR),
          storage.get<number>(STORAGE_KEYS.TICKER_SPEED, 40),
          storage.get<'en' | 'ur'>(STORAGE_KEYS.LANGUAGE, 'en'),
          storage.get<number>(STORAGE_KEYS.ACTIVE_LAUNCHER, 0),
          storage.get<AppLink[]>(STORAGE_KEYS.LINKS, DEFAULT_LINKS),
          storage.get<string | null>(STORAGE_KEYS.BG_MUSIC_URI, null),
          storage.get<boolean>(STORAGE_KEYS.BG_MUSIC_ON, false),
          storage.get<string>(STORAGE_KEYS.BG_MUSIC_NAME, ''),
          storage.get<string>(STORAGE_KEYS.ADMIN_PASS, ADMIN_PASSWORD_DEFAULT),
          storage.get<string[]>(STORAGE_KEYS.BREAKING_NEWS, DEFAULT_BREAKING),
          storage.get<MusicSlot[]>(STORAGE_KEYS.MUSIC_SLOTS, DEFAULT_MUSIC_SLOTS),
          storage.get<number>(STORAGE_KEYS.BG_MUSIC_SLOT, 0),
          storage.get<SubAdmin[]>(STORAGE_KEYS.SUB_ADMINS, []),
          storage.get<string | null>(STORAGE_KEYS.CHANNEL_LOGO_URI, null),
          storage.get<SubtitleSettings>(STORAGE_KEYS.SUBTITLE_SETTINGS, DEFAULT_SUBTITLE_SETTINGS),
          storage.get<AdItem[]>(STORAGE_KEYS.ADS, DEFAULT_ADS),
          storage.get<IntroOutroSettings>(STORAGE_KEYS.INTRO_OUTRO, DEFAULT_INTRO_OUTRO),
          storage.get<DisplayFilters>(STORAGE_KEYS.DISPLAY_FILTERS, DEFAULT_DISPLAY_FILTERS),
        ]);
        const v = results.map(r => r.status === 'fulfilled' ? r.value : undefined);
        // Merge stored news with defaults — stored items override defaults by id
        if (v[0] && Array.isArray(v[0]) && (v[0] as NewsItem[]).length > 0) {
          const stored = v[0] as NewsItem[];
          // Fill in missing imageUris from DEFAULT_NEWS if a stored item has none
          const merged = stored.map(item => {
            const def = DEFAULT_NEWS.find(d => d.id === item.id);
            if (def && (!item.imageUris || item.imageUris.length === 0) && def.imageUris.length > 0) {
              return { ...item, imageUri: def.imageUri, imageUris: def.imageUris };
            }
            return item;
          });
          // Add any new DEFAULT_NEWS items not yet in storage
          const storedIds = new Set(stored.map(n => n.id));
          DEFAULT_NEWS.forEach(def => {
            if (!storedIds.has(def.id)) merged.push(def);
          });
          setNewsItemsState(merged);
        }
        if (v[1]) setTickerEnState(v[1] as string);
        if (v[2]) setTickerUrState(v[2] as string);
        if (v[3] !== undefined) setTickerSpeedState(v[3] as number);
        if (v[4]) setLanguageState(v[4] as 'en' | 'ur');
        if (v[5] !== undefined) setActiveLauncherState(v[5] as number);
        if (v[6]) setLinksState(v[6] as AppLink[]);
        setBgMusicUriState(v[7] as string | null);
        if (v[8] !== undefined) setBgMusicEnabledState(v[8] as boolean);
        if (v[9]) setBgMusicNameState(v[9] as string);
        if (v[10]) adminPassRef.current = v[10] as string;
        if (v[11]) setBreakingNewsState(v[11] as string[]);
        if (v[12]) setMusicSlotsState(v[12] as MusicSlot[]);
        if (v[13] !== undefined) setActiveMusicSlotState(v[13] as number);
        if (v[14]) setSubAdminsState(v[14] as SubAdmin[]);
        if (v[15] !== undefined) setChannelLogoUriState(v[15] as string | null);
        if (v[16]) setSubtitleSettingsState({ ...DEFAULT_SUBTITLE_SETTINGS, ...(v[16] as SubtitleSettings) });
        if (v[17]) setAdsState(v[17] as AdItem[]);
        if (v[18]) setIntroOutroState({ ...DEFAULT_INTRO_OUTRO, ...(v[18] as IntroOutroSettings) });
        if (v[19]) setDisplayFiltersState({ ...DEFAULT_DISPLAY_FILTERS, ...(v[19] as DisplayFilters) });
      } finally {
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  // ─── Live data refresh ───────────────────────────────────────────────────
  useEffect(() => {
    const doFetch = async () => {
      const updated = await fetchLiveData({ ...DEFAULT_LIVE_DATA, lastUpdated: 0 });
      setLiveDataState(updated);
    };
    doFetch();
    const interval = setInterval(async () => {
      const updated = await fetchLiveData({ ...DEFAULT_LIVE_DATA, lastUpdated: 0 });
      setLiveDataState(updated);
    }, THREE_HOURS);
    return () => clearInterval(interval);
  }, []);

  // ─── Scheduled news auto-publisher (every 60 seconds) ────────────────────
  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      setNewsItemsState(prev => {
        const updated = prev.map(item => {
          if (!item.scheduledAt || item.isPublished) return item;
          const scheduledTime = new Date(item.scheduledAt);
          if (scheduledTime <= now) {
            // Auto-publish this item
            return {
              ...item,
              isPublished: true,
              isEnabled: true,
              scheduledAt: undefined, // clear schedule after publishing
              publishedAt: now.toISOString(),
            };
          }
          return item;
        });
        // Only save if something changed
        const hasChanges = updated.some((item, idx) => item.isPublished !== prev[idx].isPublished);
        if (hasChanges) {
          storage.set(STORAGE_KEYS.NEWS_ITEMS, updated);
        }
        return updated;
      });
    };

    // Check immediately on mount
    checkScheduled();
    const interval = setInterval(checkScheduled, SCHEDULE_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const refreshLiveData = useCallback(async () => {
    const updated = await fetchLiveData({ ...DEFAULT_LIVE_DATA, lastUpdated: 0 });
    setLiveDataState(updated);
  }, []);

  const login = useCallback((password: string) => {
    if (password === adminPassRef.current) { setIsAdminLoggedIn(true); return true; }
    const sub = subAdmins.find(s => s.isActive && s.password === password);
    if (sub) { setIsAdminLoggedIn(true); return true; }
    return false;
  }, [subAdmins]);

  const logout = useCallback(() => setIsAdminLoggedIn(false), []);

  const addNews = useCallback((item: Omit<NewsItem, 'id' | 'publishedAt'>) => {
    const newItem: NewsItem = {
      ...item, id: Date.now().toString(), publishedAt: new Date().toISOString(),
      imageUri: item.imageUri || (item.imageUris && item.imageUris[0]) || null,
      imageUris: item.imageUris || [], videoUris: item.videoUris || [],
      isEnabled: item.isEnabled ?? true, isPublished: item.isPublished ?? false,
      section: item.section || 'regular', durationSec: item.durationSec || 10, repeatCount: item.repeatCount || 1,
    };
    setNewsItemsState(prev => { const u = [newItem, ...prev]; storage.set(STORAGE_KEYS.NEWS_ITEMS, u); return u; });
  }, []);

  const updateNews = useCallback((id: string, updates: Partial<NewsItem>) => {
    setNewsItemsState(prev => {
      const u = prev.map(n => n.id === id ? { ...n, ...updates } : n);
      storage.set(STORAGE_KEYS.NEWS_ITEMS, u);
      return u;
    });
  }, []);

  const deleteNews = useCallback((id: string) => {
    setNewsItemsState(prev => { const u = prev.filter(n => n.id !== id); storage.set(STORAGE_KEYS.NEWS_ITEMS, u); return u; });
  }, []);

  const publishNews = useCallback((id: string) => {
    setNewsItemsState(prev => {
      const u = prev.map(n => n.id === id
        ? { ...n, isPublished: true, isEnabled: true, scheduledAt: undefined, publishedAt: new Date().toISOString() }
        : n
      );
      storage.set(STORAGE_KEYS.NEWS_ITEMS, u);
      return u;
    });
  }, []);

  // Schedule a news item for future auto-publish
  const scheduleNews = useCallback((id: string, scheduledAt: string) => {
    setNewsItemsState(prev => {
      const u = prev.map(n => n.id === id
        ? { ...n, scheduledAt, isPublished: false }
        : n
      );
      storage.set(STORAGE_KEYS.NEWS_ITEMS, u);
      return u;
    });
  }, []);

  const toggleNewsEnabled = useCallback((id: string) => {
    setNewsItemsState(prev => {
      const u = prev.map(n => n.id === id ? { ...n, isEnabled: !n.isEnabled } : n);
      storage.set(STORAGE_KEYS.NEWS_ITEMS, u);
      return u;
    });
  }, []);

  const setTickerEn = useCallback((text: string) => { setTickerEnState(text); storage.set(STORAGE_KEYS.TICKER_EN, text); }, []);
  const setTickerUr = useCallback((text: string) => { setTickerUrState(text); storage.set(STORAGE_KEYS.TICKER_UR, text); }, []);
  const setTickerSpeed = useCallback((speed: number) => { setTickerSpeedState(speed); storage.set(STORAGE_KEYS.TICKER_SPEED, speed); }, []);
  const setBreakingNews = useCallback((items: string[]) => { setBreakingNewsState(items); storage.set(STORAGE_KEYS.BREAKING_NEWS, items); }, []);
  const setLanguage = useCallback((lang: 'en' | 'ur') => { setLanguageState(lang); storage.set(STORAGE_KEYS.LANGUAGE, lang); }, []);
  const setActiveLauncher = useCallback((idx: number) => { setActiveLauncherState(idx); storage.set(STORAGE_KEYS.ACTIVE_LAUNCHER, idx); }, []);

  const updateLink = useCallback((id: string, updates: Partial<AppLink>) => {
    setLinksState(prev => { const u = prev.map(l => l.id === id ? { ...l, ...updates } : l); storage.set(STORAGE_KEYS.LINKS, u); return u; });
  }, []);

  const setBgMusic = useCallback((uri: string | null, name: string) => {
    setBgMusicUriState(uri); setBgMusicNameState(name);
    storage.set(STORAGE_KEYS.BG_MUSIC_URI, uri); storage.set(STORAGE_KEYS.BG_MUSIC_NAME, name);
  }, []);
  const setBgMusicEnabled = useCallback((enabled: boolean) => { setBgMusicEnabledState(enabled); storage.set(STORAGE_KEYS.BG_MUSIC_ON, enabled); }, []);
  const setBgMusicVolume = useCallback((vol: number) => { setBgMusicVolumeState(vol); }, []);

  const setActiveMusicSlot = useCallback((idx: number) => {
    setActiveMusicSlotState(idx); storage.set(STORAGE_KEYS.BG_MUSIC_SLOT, idx);
    const slot = musicSlots[idx];
    if (slot) {
      const uri = slot.isBuiltIn ? (slot.builtInUrl || null) : slot.uri;
      setBgMusicUriState(uri); setBgMusicNameState(slot.name);
      storage.set(STORAGE_KEYS.BG_MUSIC_URI, uri); storage.set(STORAGE_KEYS.BG_MUSIC_NAME, slot.name);
    }
  }, [musicSlots]);

  const updateMusicSlot = useCallback((id: string, updates: Partial<MusicSlot>) => {
    setMusicSlotsState(prev => { const u = prev.map(s => s.id === id ? { ...s, ...updates } : s); storage.set(STORAGE_KEYS.MUSIC_SLOTS, u); return u; });
  }, []);

  const changeAdminPassword = useCallback((currentPass: string, newPass: string) => {
    if (currentPass !== adminPassRef.current) return false;
    adminPassRef.current = newPass; storage.set(STORAGE_KEYS.ADMIN_PASS, newPass); return true;
  }, []);

  const addSubAdmin = useCallback((name: string, password: string) => {
    const s: SubAdmin = { id: Date.now().toString(), name, password, isActive: true, createdAt: new Date().toISOString() };
    setSubAdminsState(prev => { const u = [...prev, s]; storage.set(STORAGE_KEYS.SUB_ADMINS, u); return u; });
  }, []);

  const updateSubAdmin = useCallback((id: string, updates: Partial<SubAdmin>) => {
    setSubAdminsState(prev => { const u = prev.map(s => s.id === id ? { ...s, ...updates } : s); storage.set(STORAGE_KEYS.SUB_ADMINS, u); return u; });
  }, []);

  const deleteSubAdmin = useCallback((id: string) => {
    setSubAdminsState(prev => { const u = prev.filter(s => s.id !== id); storage.set(STORAGE_KEYS.SUB_ADMINS, u); return u; });
  }, []);

  const setChannelLogoUri = useCallback((uri: string | null) => {
    setChannelLogoUriState(uri); storage.set(STORAGE_KEYS.CHANNEL_LOGO_URI, uri);
  }, []);

  const updateSubtitleSettings = useCallback((updates: Partial<SubtitleSettings>) => {
    setSubtitleSettingsState(prev => { const u = { ...prev, ...updates }; storage.set(STORAGE_KEYS.SUBTITLE_SETTINGS, u); return u; });
  }, []);

  const addAd = useCallback((ad: Omit<AdItem, 'id' | 'createdAt'>) => {
    const newAd: AdItem = { ...ad, id: Date.now().toString(), createdAt: new Date().toISOString() };
    setAdsState(prev => { const u = [...prev, newAd]; storage.set(STORAGE_KEYS.ADS, u); return u; });
  }, []);

  const updateAd = useCallback((id: string, updates: Partial<AdItem>) => {
    setAdsState(prev => { const u = prev.map(a => a.id === id ? { ...a, ...updates } : a); storage.set(STORAGE_KEYS.ADS, u); return u; });
  }, []);

  const deleteAd = useCallback((id: string) => {
    setAdsState(prev => { const u = prev.filter(a => a.id !== id); storage.set(STORAGE_KEYS.ADS, u); return u; });
  }, []);

  const publishAd = useCallback((id: string) => {
    setAdsState(prev => { const u = prev.map(a => a.id === id ? { ...a, isPublished: true } : a); storage.set(STORAGE_KEYS.ADS, u); return u; });
  }, []);

  const updateIntroOutro = useCallback((updates: Partial<IntroOutroSettings>) => {
    setIntroOutroState(prev => { const u = { ...prev, ...updates }; storage.set(STORAGE_KEYS.INTRO_OUTRO, u); return u; });
  }, []);

  const updateDisplayFilters = useCallback((updates: Partial<DisplayFilters>) => {
    setDisplayFiltersState(prev => { const u = { ...prev, ...updates }; storage.set(STORAGE_KEYS.DISPLAY_FILTERS, u); return u; });
  }, []);

  const triggerFlashNews = useCallback((text: string, effect: string) => {
    setFlashNewsText(text); setFlashNewsEffect(effect); setFlashNewsActive(true);
  }, []);

  const clearFlashNews = useCallback(() => {
    setFlashNewsActive(false); setFlashNewsText('');
  }, []);

  return (
    <AppContext.Provider value={{
      newsItems, publishedNews, scheduledNews, tickerEn, tickerUr, tickerSpeed, breakingNews,
      isAdminLoggedIn, language, activeLauncher, links,
      bgMusicUri, bgMusicEnabled, bgMusicName, bgMusicVolume,
      activeMusicSlot, musicSlots, subAdmins, liveData, isLoaded,
      channelLogoUri, subtitleSettings, ads, introOutro, displayFilters,
      flashNewsText, flashNewsActive, flashNewsEffect,
      login, logout, addNews, updateNews, deleteNews, publishNews, scheduleNews, toggleNewsEnabled,
      setTickerEn, setTickerUr, setTickerSpeed, setBreakingNews,
      setLanguage, setActiveLauncher, updateLink,
      setBgMusic, setBgMusicEnabled, setBgMusicVolume,
      setActiveMusicSlot, updateMusicSlot,
      changeAdminPassword, addSubAdmin, updateSubAdmin, deleteSubAdmin,
      refreshLiveData, setChannelLogoUri,
      updateSubtitleSettings, addAd, updateAd, deleteAd, publishAd,
      updateIntroOutro, updateDisplayFilters,
      triggerFlashNews, clearFlashNews,
    }}>
      {children}
    </AppContext.Provider>
  );
}
