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

    const apiKey = '7cd15dc31a604ce3d5d1af8a';
    const baseApiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;

    // Константы для кэширования
    const CACHE_KEY = 'cachedCurrencyRates';
    const CACHE_TIMESTAMP_KEY = 'cacheTimestamp';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах

    let allRates = {};
    let currentBaseCurrency = 'USD';
    let isUpdating = false;
    let conversionHistory = []; // Массив для хранения истории

    // ========== ФУНКЦИИ КЭШИРОВАНИЯ КУРСОВ ==========

    // Сохранение курсов в localStorage
    function saveRatesToCache(rates, baseCurrency) {
        const cacheData = {
            baseCurrency: baseCurrency,
            rates: rates,
            savedAt: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('Курсы сохранены в кэш');
    }

    // Загрузка курсов из localStorage
    function loadRatesFromCache() {
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
    function hasCachedRatesForCurrency(baseCurrency) {
        const cachedData = loadRatesFromCache();
        if (!cachedData) return false;
        return cachedData.baseCurrency === baseCurrency;
    }

    // ========== ОСНОВНЫЕ ФУНКЦИИ РАБОТЫ С API ==========

    async function fetchRates(baseCurrency) {
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
            const response = await fetch(baseApiUrl + baseCurrency);
            const data = await response.json();

            if (data.result === 'success') {
                allRates = data.conversion_rates;
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
                console.warn('Используем устаревшие курсы из кэша');
                allRates = cache.rates;
                currentBaseCurrency = cache.baseCurrency;
                return true;
            }
            return false;
        }
    }

    // Принудительное обновление курсов (игнорирует кэш)
    async function forceRefreshRates(baseCurrency) {
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

    // ========== ФУНКЦИИ РАБОТЫ С ИСТОРИЕЙ ==========

    // Загрузка истории из localStorage
    function loadHistory() {
        const saved = localStorage.getItem('conversionHistory');
        if (saved) {
            conversionHistory = JSON.parse(saved);
            renderHistory();
        }
    }

    // Сохранение истории в localStorage
    function saveHistory() {
        localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
    }

    // Добавление новой конвертации в историю
    function addToHistory(fromAmount, fromCurrency, toAmount, toCurrency) {
        const timestamp = new Date().toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const historyItem = {
            id: Date.now(),
            timestamp,
            fromAmount: fromAmount.toFixed(2),
            fromCurrency,
            toAmount: toAmount.toFixed(2),
            toCurrency
        };
        
        // Добавляем в начало массива
        conversionHistory.unshift(historyItem);
        
        // Оставляем только последние 10 записей
        if (conversionHistory.length > 10) {
            conversionHistory = conversionHistory.slice(0, 10);
        }
        
        saveHistory();
        renderHistory();
    }

    // Отрисовка истории
    function renderHistory() {
        if (!historyList) return;
        
        if (conversionHistory.length === 0) {
            historyList.innerHTML = '<div class="history-empty">История конвертаций пуста</div>';
            return;
        }
        
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
        `).join('');
        
        // Добавляем обработчики для кнопок повтора
        document.querySelectorAll('.history-repeat').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.closest('.history-item').dataset.id);
                repeatConversion(id);
            });
        });
    }

    // Повтор конвертации из истории
    async function repeatConversion(id) {
        const item = conversionHistory.find(h => h.id === id);
        if (!item) return;
        
        // Устанавливаем значения в поля
        fromCurrencySelect.value = item.fromCurrency;
        toCurrencySelect.value = item.toCurrency;
        amountInput1.value = item.fromAmount;
        
        // Загружаем курсы для новой валюты
        if (currentBaseCurrency !== item.fromCurrency) {
            await fetchRates(item.fromCurrency);
        }
        
        // Выполняем конвертацию
        await convert(amountInput1, amountInput2, item.fromCurrency, item.toCurrency);
    }

    // Очистка истории
    function clearHistory() {
        if (confirm('Очистить всю историю конвертаций?')) {
            conversionHistory = [];
            saveHistory();
            renderHistory();
        }
    }

    // Переключение панели истории
    function toggleHistory() {
        if (historyPanel) {
            historyPanel.classList.toggle('show');
            if (toggleHistoryBtn) {
                toggleHistoryBtn.textContent = historyPanel.classList.contains('show') ? 'Скрыть историю' : 'Показать историю';
            }
        }
    }

    // ========== ФУНКЦИИ КОНВЕРТАЦИИ ==========

    async function populateCurrencies() {
        // Пытаемся загрузить курсы из кэша или API
        const success = await fetchRates('USD');
        if (!success) return;

        const currencies = Object.keys(allRates);

        // Очищаем списки перед заполнением
        fromCurrencySelect.innerHTML = '';
        toCurrencySelect.innerHTML = '';

        currencies.forEach(currency => {
            const option1 = document.createElement('option');
            option1.value = currency;
            option1.textContent = currency;
            fromCurrencySelect.appendChild(option1);

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

        await convert(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        
        // Выводим информацию о состоянии кэша в консоль
        const cacheInfo = localStorage.getItem(CACHE_KEY);
        if (cacheInfo) {
            const cache = JSON.parse(cacheInfo);
            const age = Math.round((Date.now() - cache.savedAt) / (1000 * 60 * 60));
            console.log(`Кэш курсов актуален (возраст: ${age}ч)`);
        }
    }

    // Сохранение выбранных валют и суммы в localStorage
    function saveUserPreferences() {
        localStorage.setItem('lastFromCurrency', fromCurrencySelect.value);
        localStorage.setItem('lastToCurrency', toCurrencySelect.value);
        localStorage.setItem('lastAmount', amountInput1.value);
    }

    // Главная функция конвертации
    async function convert(sourceInput, targetInput, fromCurrency, toCurrency) {
        if (isUpdating) return;
        isUpdating = true;

        const sourceValue = parseFloat(sourceInput.value);

        if (isNaN(sourceValue) || sourceValue <= 0) {
            targetInput.value = '';
            isUpdating = false;
            return;
        }

        // Сохраняем предпочтения пользователя
        saveUserPreferences();

        if (currentBaseCurrency !== fromCurrency) {
            const success = await fetchRates(fromCurrency);
            if (!success) {
                isUpdating = false;
                return;
            }
        }

        if (allRates[toCurrency]) {
            const exchangeRate = allRates[toCurrency];
            const convertedAmount = sourceValue * exchangeRate;
            const formattedConvertedAmount = convertedAmount.toFixed(4);

            if (targetInput.value !== formattedConvertedAmount) {
                targetInput.value = formattedConvertedAmount;
                addToHistory(sourceValue, fromCurrency, parseFloat(formattedConvertedAmount), toCurrency);
            }
        }

        isUpdating = false;
    }

    // ========== ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ ==========

    // Обработчики событий
    amountInput1.addEventListener('input', () => {
        const fromCurrency = fromCurrencySelect.value;
        const toCurrency = toCurrencySelect.value;
        convert(amountInput1, amountInput2, fromCurrency, toCurrency);
    });

    amountInput2.addEventListener('input', () => {
        const fromCurrency = toCurrencySelect.value;
        const toCurrency = fromCurrencySelect.value;
        convert(amountInput2, amountInput1, fromCurrency, toCurrency);
    });

    fromCurrencySelect.addEventListener('change', async () => {
        const fromCurrency = fromCurrencySelect.value;
        saveUserPreferences();
        
        if (currentBaseCurrency !== fromCurrency) {
            await fetchRates(fromCurrency);
        }
        
        const amount1Val = parseFloat(amountInput1.value);
        const amount2Val = parseFloat(amountInput2.value);
        
        if (!isNaN(amount1Val) && amount1Val > 0) {
            convert(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        } else if (!isNaN(amount2Val) && amount2Val > 0) {
            convert(amountInput2, amountInput1, toCurrencySelect.value, fromCurrencySelect.value);
        } else {
            amountInput1.value = '1';
            convert(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        }
    });

    toCurrencySelect.addEventListener('change', () => {
        saveUserPreferences();
        const amount1Val = parseFloat(amountInput1.value);
        const amount2Val = parseFloat(amountInput2.value);
        
        if (!isNaN(amount1Val) && amount1Val > 0) {
            convert(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
        } else if (!isNaN(amount2Val) && amount2Val > 0) {
            convert(amountInput2, amountInput1, toCurrencySelect.value, fromCurrencySelect.value);
        }
    });

    // Добавляем обработчики для кнопок истории
    if (toggleHistoryBtn) toggleHistoryBtn.addEventListener('click', toggleHistory);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Загружаем историю и запускаем приложение
    loadHistory();
    populateCurrencies();
});


async function convert(sourceInput, targetInput, fromCurrency, toCurrency) {
    if (isUpdating) return;
    isUpdating = true;

    const sourceValue = parseFloat(sourceInput.value);

    if (isNaN(sourceValue) || sourceValue <= 0) {
        targetInput.value = '';
        isUpdating = false;
        return;
    }

    // При необходимости перезагружаем курсы для новой базовой валюты
    if (currentBaseCurrency !== fromCurrency) {
        await fetchRates(fromCurrency);
    }

    if (allRates[toCurrency]) {
        const exchangeRate = allRates[toCurrency];
        const convertedAmount = sourceValue * exchangeRate;
        targetInput.value = convertedAmount.toFixed(4);
        
        // Сохранение операции в историю
        addToHistory(sourceValue, fromCurrency, convertedAmount, toCurrency);
    }

    isUpdating = false;
}


