import { CACHE_KEY, CACHE_DURATION } from './constants.js';

// Сохранение курсов в localStorage
export function saveRatesToCache(rates, baseCurrency) {
    const cacheData = {
        baseCurrency: baseCurrency,
        rates: rates,
        savedAt: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    console.log('Курсы сохранены в кэш');
}

// Загрузка курсов из localStorage
export function loadRatesFromCache() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (!cachedData) return null;
    
    try {
        const cache = JSON.parse(cachedData);
        const isExpired = (Date.now() - cache.savedAt) > CACHE_DURATION;
        
        if (isExpired) {
            console.log('Кэш устарел (старше 24 часов)');
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        
        console.log('Загружены курсы из кэша');
        return cache;
    } catch (error) {
        console.error('Ошибка при чтении кэша:', error);
        return null;
    }
}

// Проверка, есть ли в кэше курсы для запрашиваемой валюты
export function hasCachedRatesForCurrency(baseCurrency) {
    const cachedData = loadRatesFromCache();
    if (!cachedData) return false;
    return cachedData.baseCurrency === baseCurrency;
}