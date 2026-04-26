import { CACHE_KEY, CACHE_DURATION } from './constants.js';

// Сохранение курсов в localStorage
export function saveRatesToCache(rates, baseCurrency) {
    const cacheData = {
        baseCurrency: baseCurrency,
        rates: rates,
        savedAt: Date.now() //текущее время 
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData)); //setItem - сохраняет данные в браузере, stringify - превращает объект в строку JSON, тк localStorage хранит только строки
    console.log('Курсы сохранены в кэш');
}

// Загрузка курсов из localStorage
export function loadRatesFromCache() {
    const cachedData = localStorage.getItem(CACHE_KEY); //получает данные из localStorage
    if (!cachedData) return null; //если данных нет - возвращаем null
    
    try { //блок для обработки ошибок
        const cache = JSON.parse(cachedData); //превращает JSON строку обратно в объект
        const isExpired = (Date.now() - cache.savedAt) > CACHE_DURATION; //true если прошло больше 24 часов с момента сохранения
        
        if (isExpired) {
            console.log('Кэш устарел (старше 24 часов)');
            localStorage.removeItem(CACHE_KEY); //удаляет устаревший кэш
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