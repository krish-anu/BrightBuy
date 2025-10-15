const getSalesByMonth = `SELECT 
    DATE_FORMAT(orderDate, '%Y-%m') AS month, 
    COUNT(*) AS totalOrders, 
    SUM(totalPrice) AS totalSales
FROM orders
WHERE status != 'Cancelled'  -- optional, only count successful orders
GROUP BY DATE_FORMAT(orderDate, '%Y-%m')
ORDER BY month;
`;
const getSalesByCategory = `
  SELECT c.id AS categoryId, c.name AS categoryName, SUM(oi.totalPrice) AS totalSales
  FROM order_items oi
  JOIN product_variants pv ON oi.variantId = pv.id
  JOIN products p ON pv.productId = p.id
  JOIN product_categories pc ON p.id = pc.productId
  JOIN categories c ON pc.categoryId = c.id
  JOIN orders o ON oi.orderId = o.id
  WHERE o.status != 'Cancelled'  -- optional, only count successful orders
  GROUP BY c.id, c.name
  ORDER BY totalSales DESC;
`;
// 1. Get sales data for the last 7 days
const salesLast7Days = `
    SELECT 
        DATE(createdAt) AS date, 
        COUNT(*) AS totalOrders,
        SUM(totalAmount) AS totalSales
    FROM orders
    WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      AND status != 'Cancelled'
    GROUP BY DATE(createdAt)
    ORDER BY DATE(createdAt);
  `;

// 2. Get top 5 products by sales in the last month
const topProductsLastMonth = `
    SELECT 
        p.id AS productId,
        p.name AS productName,
        SUM(ov.quantity) AS totalSold,
        SUM(ov.price * ov.quantity) AS totalRevenue
    FROM order_variants ov
    JOIN product_variants pv ON ov.variantId = pv.id
    JOIN products p ON pv.productId = p.id
    JOIN orders o ON ov.orderId = o.id
    WHERE o.createdAt >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      AND o.status != 'Cancelled'
    GROUP BY p.id, p.name
    ORDER BY totalSold DESC
    LIMIT 5;`;
  

// 3. Get sales by category for the last month
const salesByCategoryLastMonth = `
    SELECT 
        c.id AS categoryId,
        c.name AS categoryName,
        SUM(ov.price * ov.quantity) AS totalRevenue,
        SUM(ov.quantity) AS totalSold
    FROM orders o
    JOIN order_variants ov ON o.id = ov.orderId
    JOIN product_variants pv ON ov.variantId = pv.id
    JOIN products p ON pv.productId = p.id
    JOIN categories c ON p.categoryId = c.id
    WHERE o.createdAt >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      AND o.status != 'Cancelled'
    GROUP BY c.id, c.name
    ORDER BY totalRevenue DESC;
  `;

 const mainCategoryProducts = `
  SELECT c.id AS categoryId, c.name AS categoryName, COUNT(p.id) AS productCount
  FROM categories c
  LEFT JOIN product_categories pc ON c.id = pc.categoryId
  LEFT JOIN products p ON pc.productId = p.id
  WHERE c.parentId IS NULL  -- Only main categories
  GROUP BY c.id, c.name
  ORDER BY productCount DESC;
`;   

module.exports = {
  getSalesByMonth,
  getSalesByCategory,
  salesLast7Days,
  topProductsLastMonth,
  salesByCategoryLastMonth,
  mainCategoryProducts
};
