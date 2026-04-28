/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;
    return sale_price * quantity * (1 - discount / 100);
}


/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    let bonusRate = 0
    if (index === 0) {
        bonusRate = 0.15;
    } else if (index === 1 || index === 2) {
        bonusRate = 0.1;
    } else if( index === total - 1) {
        bonusRate = 0;
    } else {
        bonusRate = 0.5;
    }

    return profit * bonusRate;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!Array.isArray(data.sellers || data.products || data.purchase_records || data.customers) || data.sellers.length === 0) {
        throw new Error('Некорректные входные данные');
    }
    // @TODO: Проверка наличия опций
    // return 'Данные корректные'
    const { calculateRevenue, calculateBonus } = options;
    if (!typeof options === "object" || !typeof calculateRevenue === "function") {
        throw new Error(`${options} не объект или ${calculateRevenue} не функция`);
    }
    //
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        sales_count: 0,
        revenue: 0,
        profit: 0,
        bonus: 0,
        products_sold: 0,
    }));

    console.log(sellerStats);

    //
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    // const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.seller_id, item]));
    const sellerIndex = sellerStats.reduce((result, item) => {
        const id = item.seller_id;
        if (!result[id]) result[id] = item;
        return result;
    }, {});

    console.log('sellerIndex', sellerIndex);

    // const productIndex = data.products.reduce((result, item) => {
    //     const sku = item.sku;
    //     if (!result[sku]) result[sku] = [];
    //     result[sku].push(item);
    //     return result;
    // }, {});
    const productIndex = data.products.reduce((result, item) => {
        const sku = item.sku;
        if (!result[sku]) result[sku] = item;
        return result;
    }, {});
    //
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек
        // const seller = sellerIndex[record.seller_id]; // Продавец
        const seller = sellerIndex[record.seller_id]; // Продавец
        seller.sales_count ++
        // Обработка каждого товара в чеке
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            console.log(product);

            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue_item = calculateSimpleRevenue(item)
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue_item - cost;
            seller.revenue += revenue_item;
            seller.profit += profit;

            // Увеличить общую накопленную прибыль у продавца
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
            console.log(seller.products_sold)
        })
    });
    //
    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = Object.values(sellerIndex).sort((min, max) => max.profit - min.profit);
    //
    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sortedSellers.length, seller);
    })
    console.log(sortedSellers);


    //
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sortedSellers.map((seller, index) => {
        const top_products = Object.entries(seller)
            .sort((min, max) => max[1] - min[1])
            .slice(0, 10)
            .map(([SKU, quantity]) => SKU)

        delete seller.products_sold

        const result = {
            ...seller,
            revenue: Number(seller.revenue.toFixed(2)),
            profit: Number(seller.profit.toFixed(2)),
            top_products,
            bonus: Number(seller.bonus.toFixed(2)),
        }
        return result
    })

}