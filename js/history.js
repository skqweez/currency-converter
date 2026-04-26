let conversionHistory = []; // Массив для хранения истории

export function getConversionHistory() {
    return conversionHistory;
}

export function setConversionHistory(history) {
    conversionHistory = history;
}

// Загрузка истории из localStorage
export function loadHistory(renderCallback) {
    const saved = localStorage.getItem('conversionHistory');
    if (saved) {
        conversionHistory = JSON.parse(saved);
        if (renderCallback) renderCallback();
    }
}

// Сохранение истории в localStorage
export function saveHistory() {
    localStorage.setItem('conversionHistory', JSON.stringify(conversionHistory));
}

// Добавление новой конвертации в историю
export function addToHistory(fromAmount, fromCurrency, toAmount, toCurrency, renderCallback) {
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
    if (renderCallback) renderCallback();
}

// Очистка истории
export function clearHistory(renderCallback) {
    if (confirm('Очистить всю историю конвертаций?')) {
        conversionHistory = [];
        saveHistory();
        if (renderCallback) renderCallback();
    }
}