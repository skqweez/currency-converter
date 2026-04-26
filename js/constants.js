// Константы для кэширования
export const CACHE_KEY = 'cachedCurrencyRates';
export const CACHE_TIMESTAMP_KEY = 'cacheTimestamp';
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

// API
export const apiKey = '7cd15dc31a604ce3d5d1af8a';
export const baseApiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;