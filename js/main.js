import { CACHE_KEY } from './constants.js';
import { fetchRates, getCurrentBaseCurrency, getAllRates } from './api.js';
import { loadHistory, getConversionHistory, clearHistory as clearHistoryData } from './history.js';
import { convert, saveUserPreferences, getIsUpdating, setIsUpdating } from './converter.js';
import { renderHistory, repeatConversion, toggleHistory, populateCurrencies } from './ui-helpers.js';

document.addEventListener('DOMContentLoaded', () => {
    const amountInput1 = document.getElementById('amount1');
    const amountInput2 = document.getElementById('amount2');
    const fromCurrencySelect = document.getElementById('from-currency');
    const toCurrencySelect = document.getElementById('to-currency');
    
    // Элементы для истории
    const historyList = document.getElementById('history-list');
    const toggleHistoryBtn = document.getElementById('toggle-history');
    const historyPanel = document.getElementById('history-panel');
    const clearHistoryBtn = document.getElementById('clear-history');

    // Функция-обёртка для рендеринга истории с правильным контекстом
    const renderHistoryWrapper = () => {
        renderHistory(historyList, (id) => {
            repeatConversion(
                id, getConversionHistory(), fromCurrencySelect, toCurrencySelect,
                amountInput1, amountInput2, getCurrentBaseCurrency, fetchRates, convert, renderHistoryWrapper
            );
        });
    };

    // Функция-обёртка для очистки истории
    const handleClearHistory = () => {
        clearHistoryData(renderHistoryWrapper);
    };

    // Функция-обёртка для конвертации с обновлением истории
    const convertWrapper = async (sourceInput, targetInput, fromCurrency, toCurrency) => {
        await convert(sourceInput, targetInput, fromCurrency, toCurrency, renderHistoryWrapper);
    };

    // Функция-обёртка для populateCurrencies
    const populateCurrenciesWrapper = async () => {
        await populateCurrencies(
            fromCurrencySelect, toCurrencySelect, amountInput1, amountInput2,
            fetchRates, convertWrapper, renderHistoryWrapper
        );
    };

    // Обработчики событий
    amountInput1.addEventListener('input', () => {
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        convertWrapper(amountInput1, amountInput2, fromCurrency, toCurrency);
    });

    amountInput2.addEventListener('input', () => {
        const fromCurrency = toCurrencySelect.value;
        const toCurrency = fromCurrencySelect.value;
        convertWrapper(amountInput2, amountInput1, fromCurrency, toCurrency);
    });

    fromCurrencySelect.addEventListener('change', async () => {
        const fromCurrency = fromCurrencySelect.value;
        saveUserPreferences(fromCurrencySelect, toCurrencySelect, amountInput1);
        
        if (getCurrentBaseCurrency() !== fromCurrency) {
            await fetchRates(fromCurrency);
        }
        
        const amount1Val = parseFloat(amountInput1.value);
        const amount2Val = parseFloat(amountInput2.value);
        
        if (!isNaN(amount1Val) && amount1Val > 0) {
            convertWrapper(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        } else if (!isNaN(amount2Val) && amount2Val > 0) {
            convertWrapper(amountInput2, amountInput1, toCurrencySelect.value, fromCurrencySelect.value);
        } else {
            amountInput1.value = '1';
            convertWrapper(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        }
    });

    toCurrencySelect.addEventListener('change', () => {
        saveUserPreferences(fromCurrencySelect, toCurrencySelect, amountInput1);
        const amount1Val = parseFloat(amountInput1.value);
        const amount2Val = parseFloat(amountInput2.value);
        
        if (!isNaN(amount1Val) && amount1Val > 0) {
            convertWrapper(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        } else if (!isNaN(amount2Val) && amount2Val > 0) {
            convertWrapper(amountInput2, amountInput1, toCurrencySelect.value, fromCurrencySelect.value);
        }
    });

    // Добавляем обработчики для кнопок истории
    if (toggleHistoryBtn) toggleHistoryBtn.addEventListener('click', () => toggleHistory(historyPanel, toggleHistoryBtn));
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', handleClearHistory);
    
    // Загружаем историю и запускаем приложение
    loadHistory(renderHistoryWrapper);
    populateCurrenciesWrapper();
});