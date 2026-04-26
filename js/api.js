import { baseApiUrl } from './constants.js';
import { saveRatesToCache, loadRatesFromCache, hasCachedRatesForCurrency } from './cache.js';

let allRates = {}; //пустой объект для хранения курсов
let currentBaseCurrency = 'USD';

export function getAllRates() { //возвращает объект с курсами
    return allRates;
}

export function getCurrentBaseCurrency() {
    return currentBaseCurrency;
}

export function setAllRates(rates) { //устанавливает новый объект курсов
    allRates = rates;
}

export function setCurrentBaseCurrency(currency) {
    currentBaseCurrency = currency;
}

export async function fetchRates(baseCurrency) { //async - ключевое слово для асинхронной функции
    // Сначала проверяем кэш
    if (hasCachedRatesForCurrency(baseCurrency)) {
        const cache = loadRatesFromCache();
        if (cache) {
            allRates = cache.rates;
            currentBaseCurrency = cache.baseCurrency;
            return true;
        }
    }

    // Если в кэше нет или он устарел — делаем запрос к API
    try {
        console.log(`Загрузка курсов для ${baseCurrency} из API...`);
        const response = await fetch(baseApiUrl + baseCurrency); //await - ждет завершения асинхронной операции, fetch - выполняет запрос к api
        const data = await response.json(); //превращает ответ api в jS-объект

        if (data.result === 'success') { //проверяет, успешно ли завершился запрос
            allRates = data.conversion_rates; //объект с курсами, который приходит от api
            currentBaseCurrency = baseCurrency;
            // Сохраняем полученные курсы в кэш
            saveRatesToCache(allRates, currentBaseCurrency);
            return true;
        } else {
            console.error('API Error:', data['error-type']);
            return false;
        }
    } catch (error) {
        console.error('Ошибка при загрузке курсов:', error);
        
        // В случае ошибки сети пробуем использовать устаревший кэш
        const expiredCache = localStorage.getItem(CACHE_KEY);
        if (expiredCache) {
            const cache = JSON.parse(expiredCache);
            console.warn('Используем устаревшие курсы из кэша'); //выводит предупреждение в консоль
            allRates = cache.rates;
            currentBaseCurrency = cache.baseCurrency;
            return true;
        }
        return false;
    }
}

// Принудительное обновление курсов (игнорирует кэш)
export async function forceRefreshRates(baseCurrency) {
    try {
        console.log(`Принудительная загрузка курсов для ${baseCurrency} из API...`);
        const response = await fetch(baseApiUrl + baseCurrency);
        const data = await response.json();

        if (data.result === 'success') {
            allRates = data.conversion_rates;
            currentBaseCurrency = baseCurrency;
            saveRatesToCache(allRates, currentBaseCurrency);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Ошибка при принудительной загрузке курсов:', error);
        return false;
    }
}