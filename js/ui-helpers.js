import { getAllRates, fetchRates, getCurrentBaseCurrency } from './api.js';
import { convert, saveUserPreferences } from './converter.js';
import { getConversionHistory, clearHistory as clearHistoryData } from './history.js';
import { CACHE_KEY } from './constants.js';

// Отрисовка истории
export function renderHistory(historyList, repeatCallback) {
    const conversionHistory = getConversionHistory();
    
    if (!historyList) return;
    
    if (conversionHistory.length === 0) {
        historyList.innerHTML = '<div class="history-empty">История конвертаций пуста</div>';
        return;
    }
    
    //map - преобразует массив объектов в массив HTML-строк
    historyList.innerHTML = conversionHistory.map(item => `
        <div class="history-item" data-id="${item.id}">
            <div class="history-time">${item.timestamp}</div>
            <div class="history-conversion">
                <span class="history-from">${item.fromAmount} ${item.fromCurrency}</span>
                <span class="history-arrow">→</span>
                <span class="history-to">${item.toAmount} ${item.toCurrency}</span>
            </div>
            <button class="history-repeat">Повторить</button>
        </div>
    `).join(''); //соединяет все строки в одну
    
    // Добавляем обработчики для кнопок повтора
    if (repeatCallback) {
        document.querySelectorAll('.history-repeat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.closest('.history-item').dataset.id); //closest - находит ближайший родительский элемент с классом ".history-item", dataset - читает значение атрибута data-id
                repeatCallback(id);
            });
        });
    }
}

// Повтор конвертации из истории
export async function repeatConversion(id, conversionHistory, fromCurrencySelect, toCurrencySelect, amountInput1, amountInput2, getCurrentBaseCurrency, fetchRates, convert, renderCallback) {
    const item = conversionHistory.find(h => h.id === id);
    if (!item) return;
    
    // Устанавливаем значения в поля
    fromCurrencySelect.value = item.fromCurrency;
    toCurrencySelect.value = item.toCurrency;
    amountInput1.value = item.fromAmount;
    
    // Загружаем курсы для новой валюты
    if (getCurrentBaseCurrency() !== item.fromCurrency) {
        await fetchRates(item.fromCurrency);
    }
    
    // Выполняем конвертацию
    await convert(amountInput1, amountInput2, item.fromCurrency, item.toCurrency, renderCallback);
}

// Переключение панели истории
export function toggleHistory(historyPanel, toggleHistoryBtn) {
    if (historyPanel) {
        historyPanel.classList.toggle('show');
        if (toggleHistoryBtn) {
            toggleHistoryBtn.textContent = historyPanel.classList.contains('show') ? 'Скрыть историю' : 'Показать историю';
        }
    }
}

// Заполнение выпадающих списков валют
export async function populateCurrencies(
    fromCurrencySelect, toCurrencySelect, amountInput1, amountInput2,
    fetchRates, convert, renderCallback
) {
    // Пытаемся загрузить курсы из кэша или API
    const success = await fetchRates('USD');
    if (!success) return;

    const allRates = getAllRates();
    const currencies = Object.keys(allRates); //получает массив кодов валют, например 'USD', 'EUR'

    // Очищаем списки перед заполнением
    fromCurrencySelect.innerHTML = '';
    toCurrencySelect.innerHTML = '';

    currencies.forEach(currency => {
        const option1 = document.createElement('option');
        option1.value = currency;
        option1.textContent = currency;
        fromCurrencySelect.appendChild(option1); //добавляет созданный элемент в выпадающий список

        const option2 = document.createElement('option');
        option2.value = currency;
        option2.textContent = currency;
        toCurrencySelect.appendChild(option2);
    });

    // Восстанавливаем сохранённые значения валют из localStorage (если есть)
    const savedFromCurrency = localStorage.getItem('lastFromCurrency');
    const savedToCurrency = localStorage.getItem('lastToCurrency');
    
    fromCurrencySelect.value = savedFromCurrency || 'USD';
    toCurrencySelect.value = savedToCurrency || 'RUB';

    // Восстанавливаем последнюю сумму
    const lastAmount = localStorage.getItem('lastAmount');
    if (lastAmount && !isNaN(parseFloat(lastAmount))) {
        amountInput1.value = lastAmount;
    } else {
        amountInput1.value = '1';
    }
    amountInput2.value = '';

    await convert(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value, renderCallback);
    
    // Выводим информацию о состоянии кэша в консоль
    const cacheInfo = localStorage.getItem(CACHE_KEY);
    if (cacheInfo) {
        const cache = JSON.parse(cacheInfo);
        const age = Math.round((Date.now() - cache.savedAt) / (1000 * 60 * 60));
        console.log(`Кэш курсов актуален (возраст: ${age}ч)`);
    }
}