import { getCurrentBaseCurrency, setCurrentBaseCurrency, fetchRates, getAllRates, setAllRates } from './api.js';
import { addToHistory } from './history.js';

let isUpdating = false; //блокировка, чтобы не запускать конвертацию одновременно из двух полей

export function getIsUpdating() {
    return isUpdating;
}

export function setIsUpdating(value) {
    isUpdating = value;
}

// Сохранение выбранных валют и суммы в localStorage
export function saveUserPreferences(fromCurrencySelect, toCurrencySelect, amountInput1) {
    localStorage.setItem('lastFromCurrency', fromCurrencySelect.value);
    localStorage.setItem('lastToCurrency', toCurrencySelect.value);
    localStorage.setItem('lastAmount', amountInput1.value);
}

// Главная функция конвертации
export async function convert(sourceInput, targetInput, fromCurrency, toCurrency, renderCallback) {
    if (isUpdating) return;
    isUpdating = true;

    const sourceValue = parseFloat(sourceInput.value); //превращает строку в число с плавающей точкой

    if (isNaN(sourceValue) || sourceValue <= 0) {
        targetInput.value = '';
        isUpdating = false;
        return;
    }

    // При необходимости перезагружаем курсы для новой базовой валюты
    if (getCurrentBaseCurrency() !== fromCurrency) {
        await fetchRates(fromCurrency);
    }

    const allRates = getAllRates();
    if (allRates[toCurrency]) {
        const exchangeRate = allRates[toCurrency]; //берет курс нужной валюты
        const convertedAmount = sourceValue * exchangeRate; //формула конвертации
        targetInput.value = convertedAmount.toFixed(2);
        
        // Сохранение операции в историю
        addToHistory(sourceValue, fromCurrency, convertedAmount, toCurrency, renderCallback);
    }

    isUpdating = false;
}