// document.addEventListener('DOMContentLoaded', () => {
//     const amountInput1 = document.getElementById('amount1');
//     const amountInput2 = document.getElementById('amount2');
//     const fromCurrencySelect = document.getElementById('from-currency');
//     const toCurrencySelect = document.getElementById('to-currency');

//     const apiKey = '7cd15dc31a604ce3d5d1af8a';
//     const baseApiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/`;

//     let allRates = {}; // Будет хранить все курсы валют для текущей базовой валюты
//     let currentBaseCurrency = 'USD'; // Текущая базовая валюта, для которой загружены курсы
//     let isUpdating = false; // Флаг для предотвращения зацикливания событий

//     // Функция для загрузки курсов валют
//     async function fetchRates(baseCurrency) {
//         try {
//             const response = await fetch(baseApiUrl + baseCurrency);
//             const data = await response.json();

//             if (data.result === 'success') {
//                 allRates = data.conversion_rates;
//                 currentBaseCurrency = baseCurrency;
//                 return true;
//             } else {
//                 handleApiError(data['error-type']);
//                 return false;
//             }
//         } catch (error) {
//             console.error('Ошибка при загрузке курсов:', error);
//             setError('Не удалось загрузить курсы валют.', amountInput1);
//             return false;
//         }
//     }

//     // Функция для заполнения выпадающих списков валют
//     async function populateCurrencies() {
//         const success = await fetchRates('USD');
//         if (!success) return;

//         const currencies = Object.keys(allRates);

//         currencies.forEach(currency => {
//             const option1 = document.createElement('option');
//             option1.value = currency;
//             option1.textContent = currency;
//             fromCurrencySelect.appendChild(option1);

//             const option2 = document.createElement('option');
//             option2.value = currency;
//             option2.textContent = currency;
//             toCurrencySelect.appendChild(option2);
//         });

//         fromCurrencySelect.value = 'USD';
//         toCurrencySelect.value = 'RUB';

//         amountInput1.value = '1';
//         amountInput2.value = '';

//         updateConversion();
//     }

//     // Функция для выполнения конвертации
//     async function updateConversion() {
//         if (isUpdating) return; // Предотвращаем зацикливание
//         isUpdating = true;

//         const fromCurrency = fromCurrencySelect.value;
//         const toCurrency = toCurrencySelect.value;
//         const amount1Value = amountInput1.value;
//         const amount2Value = amountInput2.value;

//         if (currentBaseCurrency !== fromCurrency) {
//             const success = await fetchRates(fromCurrency);
//             if (!success) {
//                 isUpdating = false;
//                 return;
//             }
//         }

//         let sourceAmount = 0;
//         let sourceInput = null;
//         let targetInput = null;

//         // Определяем, какое поле было изменено и является источником
//         if (document.activeElement === amountInput1 && amount1Value !== '') {
//             sourceAmount = parseFloat(amount1Value);
//             sourceInput = amountInput1;
//             targetInput = amountInput2;
//         } else if (document.activeElement === amountInput2 && amount2Value !== '') {
//             sourceAmount = parseFloat(amount2Value);
//             sourceInput = amount2;
//             targetInput = amount1;
//         } else if (amount1Value !== '') {
//             sourceAmount = parseFloat(amount1Value);
//             sourceInput = amountInput1;
//             targetInput = amountInput2;
//         } else if (amount2Value !== '') {
//             sourceAmount = parseFloat(amount2Value);
//             sourceInput = amount2;
//             targetInput = amount1;
//         } else {
//             targetInput = (document.activeElement === amountInput1) ? amountInput2 : amountInput1;
//             targetInput.value = '';
//             isUpdating = false;
//             return;
//         }

//         if (isNaN(sourceAmount) || sourceAmount <= 0) {
//             if (targetInput) targetInput.value = '';
//             isUpdating = false;
//             return;
//         }

//         // Выполняем конвертацию
//         if (allRates[toCurrency]) {
//             const exchangeRate = allRates[toCurrency];
//             const convertedAmount = (sourceAmount * exchangeRate);
//             const formattedConvertedAmount = convertedAmount.toFixed(2);

//             // Обновляем только целевое поле, если значение изменилось
//             if (targetInput && targetInput.value !== formattedConvertedAmount) {
//                 targetInput.value = formattedConvertedAmount;
//             }
//         } else {
//             setError('Курс для выбранной валюты недоступен.', targetInput);
//         }

//         isUpdating = false;
//     }
//     amountInput1.addEventListener('input', () => {
//         if (isUpdating) return;
//         isUpdating = true;
//         updateTarget(amountInput1, amountInput2, fromCurrencySelect.value, toCurrencySelect.value);
//         isUpdating = false;
//     });

//     amountInput2.addEventListener('input', () => {
//         if (isUpdating) return;
//         isUpdating = true;
//         updateTarget(amountInput2, amountInput1, fromCurrencySelect.value, toCurrencySelect.value);
//         isUpdating = false;
//     });

//     // Функция для обновления целевого поля
//     async function updateTarget(sourceInput, targetInput, fromCurrency, toCurrency) {
//         const sourceValue = parseFloat(sourceInput.value);

//         if (isNaN(sourceValue) || sourceValue <= 0) {
//             targetInput.value = '';
//             return;
//         }

//         if (currentBaseCurrency !== fromCurrency) {
//             const success = await fetchRates(fromCurrency);
//             if (!success) return;
//         }

//         if (allRates[toCurrency]) {
//             const exchangeRate = allRates[toCurrency];
//             const convertedAmount = (sourceValue * exchangeRate);
//             const formattedConvertedAmount = convertedAmount.toFixed(2);

//             if (targetInput.value !== formattedConvertedAmount) {
//                 targetInput.value = formattedConvertedAmount;
//             }
//         } else {
//             setError('Курс для выбранной валюты недоступен.', targetInput);
//         }
//     }

//     fromCurrencySelect.addEventListener('change', async () => {
//         const fromCurrency = fromCurrencySelect.value;
//         if (currentBaseCurrency !== fromCurrency) {
//             const success = await fetchRates(fromCurrency);
//             if (!success) return;
//         }
//         updateConversion();
//     });

//     toCurrencySelect.addEventListener('change', updateConversion);

//     populateCurrencies();
// });

