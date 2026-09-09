// Live Weather service using Open-Meteo API (free, no API key required)
// + Exchange rate API for currencies
// Auto-refresh every 3 hours

export type WeatherData = {
  city: string;
  temp: string;
  condition: string;
  icon: string;
};

export type CurrencyRate = {
  code: string;
  name: string;
  rate: string;
  flag: string;
};

export type LiveData = {
  weather: WeatherData[];
  currencies: CurrencyRate[];
  lastUpdated: number;
};

// City coordinates for Open-Meteo
const CITY_COORDS: { city: string; lat: number; lon: number; tz: string }[] = [
  { city: 'Karachi',   lat: 24.8607, lon: 67.0011, tz: 'Asia/Karachi' },
  { city: 'Lahore',    lat: 31.5204, lon: 74.3587, tz: 'Asia/Karachi' },
  { city: 'Islamabad', lat: 33.6844, lon: 73.0479, tz: 'Asia/Karachi' },
  { city: 'Peshawar',  lat: 34.0151, lon: 71.5249, tz: 'Asia/Karachi' },
  { city: 'Quetta',    lat: 30.1798, lon: 66.9750, tz: 'Asia/Karachi' },
  { city: 'Dubai',     lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { city: 'London',    lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { city: 'New York',  lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { city: 'Beijing',   lat: 39.9042, lon: 116.4074, tz: 'Asia/Shanghai' },
  { city: 'Tokyo',     lat: 35.6762, lon: 139.6503, tz: 'Asia/Tokyo' },
  { city: 'Riyadh',    lat: 24.7136, lon: 46.6753, tz: 'Asia/Riyadh' },
  { city: 'Ankara',    lat: 39.9334, lon: 32.8597, tz: 'Europe/Istanbul' },
];

// WMO weather code to icon/description mapping
function wmoToCondition(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️' };
  if (code <= 2) return { condition: 'Partly Cloudy', icon: '⛅' };
  if (code === 3) return { condition: 'Overcast', icon: '☁️' };
  if (code <= 49) return { condition: 'Foggy', icon: '🌫️' };
  if (code <= 57) return { condition: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { condition: 'Rainy', icon: '🌧️' };
  if (code <= 77) return { condition: 'Snowy', icon: '❄️' };
  if (code <= 82) return { condition: 'Rain Showers', icon: '🌦️' };
  if (code <= 86) return { condition: 'Snow Showers', icon: '🌨️' };
  if (code <= 99) return { condition: 'Thunderstorm', icon: '⛈️' };
  return { condition: 'Clear', icon: '🌤️' };
}

async function fetchWeatherForCity(
  cityCoord: typeof CITY_COORDS[number],
  fallback: WeatherData
): Promise<WeatherData> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${cityCoord.lat}&longitude=${cityCoord.lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m` +
      `&timezone=${encodeURIComponent(cityCoord.tz)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return fallback;
    const data = await res.json();
    const current = data?.current;
    if (!current) return fallback;
    const tempC = Math.round(current.temperature_2m ?? 0);
    const wcode = current.weather_code ?? 0;
    const { condition, icon } = wmoToCondition(wcode);
    return { city: cityCoord.city, temp: `${tempC}°C`, condition, icon };
  } catch {
    return fallback;
  }
}

async function fetchCurrencies(): Promise<CurrencyRate[]> {
  const defaults: CurrencyRate[] = [
    { code: 'USD', name: 'US Dollar',       rate: '278.50', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro',            rate: '302.40', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound',   rate: '352.80', flag: '🇬🇧' },
    { code: 'SAR', name: 'Saudi Riyal',     rate: '74.20',  flag: '🇸🇦' },
    { code: 'AED', name: 'UAE Dirham',      rate: '75.80',  flag: '🇦🇪' },
    { code: 'CNY', name: 'Chinese Yuan',    rate: '38.60',  flag: '🇨🇳' },
    { code: 'TRY', name: 'Turkish Lira',    rate: '8.45',   flag: '🇹🇷' },
    { code: 'JPY', name: 'Japanese Yen',    rate: '1.84',   flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', rate: '205.30', flag: '🇨🇦' },
    { code: 'AUD', name: 'Aus Dollar',      rate: '182.60', flag: '🇦🇺' },
  ];
  try {
    // Using exchangerate.host (free, no key)
    const res = await fetch(
      'https://api.exchangerate-api.com/v4/latest/PKR',
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error('Exchange rate API failed');
    const data = await res.json();
    const rates = data?.rates;
    if (!rates) return defaults;
    return defaults.map(c => {
      const pkrPerForeign = rates[c.code];
      if (pkrPerForeign && pkrPerForeign > 0) {
        // 1 foreign = 1/pkrPerForeign PKR → round to 2 decimals
        const val = (1 / pkrPerForeign).toFixed(2);
        return { ...c, rate: val };
      }
      return c;
    });
  } catch {
    // Try fallback: frankfurter API for major currencies
    try {
      const res2 = await fetch(
        'https://api.frankfurter.app/latest?from=PKR&to=USD,EUR,GBP,AED,SAR,CNY,TRY,JPY,CAD,AUD',
        { signal: AbortSignal.timeout(6000) }
      );
      if (res2.ok) {
        const data2 = await res2.json();
        const r2 = data2?.rates ?? {};
        return defaults.map(c => {
          const pct = r2[c.code];
          if (pct && pct > 0) return { ...c, rate: (1 / pct).toFixed(2) };
          return c;
        });
      }
    } catch {}
    return defaults;
  }
}

const DEFAULT_WEATHER_FALLBACKS: WeatherData[] = CITY_COORDS.map((c, i) => ({
  city: c.city,
  temp: ['32°C','28°C','24°C','26°C','20°C','38°C','18°C','22°C','26°C','30°C','40°C','22°C'][i] ?? '25°C',
  condition: ['Sunny','Partly Cloudy','Clear','Hazy','Windy','Hot','Cloudy','Fair','Hazy','Humid','Hot','Partly Cloudy'][i] ?? 'Clear',
  icon: ['☀️','⛅','🌤️','🌫️','💨','🌡️','🌥️','🌤️','🌫️','💧','☀️','⛅'][i] ?? '🌤️',
}));

export const DEFAULT_LIVE_DATA: LiveData = {
  weather: DEFAULT_WEATHER_FALLBACKS,
  currencies: [
    { code: 'USD', name: 'US Dollar',       rate: '278.50', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro',            rate: '302.40', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound',   rate: '352.80', flag: '🇬🇧' },
    { code: 'SAR', name: 'Saudi Riyal',     rate: '74.20',  flag: '🇸🇦' },
    { code: 'AED', name: 'UAE Dirham',      rate: '75.80',  flag: '🇦🇪' },
    { code: 'CNY', name: 'Chinese Yuan',    rate: '38.60',  flag: '🇨🇳' },
    { code: 'TRY', name: 'Turkish Lira',    rate: '8.45',   flag: '🇹🇷' },
    { code: 'JPY', name: 'Japanese Yen',    rate: '1.84',   flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', rate: '205.30', flag: '🇨🇦' },
    { code: 'AUD', name: 'Aus Dollar',      rate: '182.60', flag: '🇦🇺' },
  ],
  lastUpdated: 0,
};

const THREE_HOURS = 3 * 60 * 60 * 1000;

export async function fetchLiveData(prevData: LiveData): Promise<LiveData> {
  const now = Date.now();
  if (now - prevData.lastUpdated < THREE_HOURS) return prevData;

  try {
    const [currResult, ...weatherResults] = await Promise.allSettled([
      fetchCurrencies(),
      ...CITY_COORDS.map((coord, i) => fetchWeatherForCity(coord, DEFAULT_WEATHER_FALLBACKS[i])),
    ]);

    const newCurrencies =
      currResult.status === 'fulfilled' ? currResult.value : prevData.currencies;

    const newWeather = CITY_COORDS.map((_, i) => {
      const r = weatherResults[i];
      return r?.status === 'fulfilled' ? r.value : (prevData.weather[i] ?? DEFAULT_WEATHER_FALLBACKS[i]);
    });

    return { weather: newWeather, currencies: newCurrencies, lastUpdated: now };
  } catch {
    return { ...prevData, lastUpdated: now };
  }
}
