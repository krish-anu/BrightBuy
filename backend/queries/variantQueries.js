const variantQueries = {
  getAll: `
    SELECT v.id, v.SKU, v.variantName, v.price, v.stockQnt, v.productId, v.imageURL,
           p.name as productName, p.brand, p.description, va.id as attributeId, va.name as attributeName, vo.value as attributeValue
    FROM product_variants v
    JOIN products p ON v.productId = p.id
    LEFT JOIN product_variant_options vo ON vo.variantId=v.id
    LEFT JOIN variant_attributes va ON vo.attributeId=va.id
  `,
 
  getById: `
    SELECT v.id, v.SKU, v.variantName, v.price, v.stockQnt, v.productId, v.imageURL,
           p.name as productName, p.brand, p.description, va.id as attributeId, va.name as attributeName, vo.value as attributeValue
    FROM product_variants v
    JOIN products p ON v.productId = p.id
    LEFT JOIN product_variant_options vo ON vo.variantId=v.id
    LEFT JOIN variant_attributes va ON vo.attributeId=va.id
    WHERE v.id = ?
  `,
 
  insert: `
    INSERT INTO product_variants
      (productId, variantName, SKU, price, stockQnt, imageURL, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,

  update: `
    UPDATE product_variants
    SET variantName = ?, price = ?, stockQnt = ?, imageURL = ?, updatedAt = NOW()
    WHERE id = ?
  `,

  updateStock: `
    UPDATE product_variants
    SET stockQnt = stockQnt + ?, updatedAt = NOW()
    WHERE id = ?
  `,

  delete: `
    DELETE FROM product_variants
    WHERE id = ?
  `,

  searchAndFilter: `
    SELECT v.id, v.SKU, v.variantName, v.price, v.stockQnt, v.productId, v.imageURL,
           p.name as productName, p.brand, p.description
    FROM product_variants v
    JOIN products p ON v.productId = p.id
    LEFT JOIN product_variant_options o ON v.id = o.variantId
    LEFT JOIN variant_attributes a ON o.attributeId = a.id
    WHERE (? IS NULL OR v.variantName LIKE CONCAT('%', ?, '%') OR p.description LIKE CONCAT('%', ?, '%') OR p.brand LIKE CONCAT('%', ?, '%'))
      AND (? IS NULL OR v.price >= ?)
      AND (? IS NULL OR v.price <= ?)
  `,

  getLowStock: `
    SELECT v.id, v.SKU, v.variantName, v.price, v.stockQnt, v.productId
    FROM product_variants v
    WHERE v.stockQnt <= ?
    ORDER BY v.stockQnt ASC
  `,

  getPopular: `
    SELECT v.id, v.variantName, v.SKU, v.price, SUM(oi.quantity) AS soldQuantity
    FROM product_variants v
    JOIN order_items oi ON v.id = oi.variantId
    JOIN orders o ON oi.orderId=o.id
    WHERE DATE(o.orderDate) >= DATE(?)
    GROUP BY v.id, v.variantName, v.SKU, v.price
    ORDER BY soldQuantity DESC
  `,

  getStock: `
    SELECT id, variantName, SKU, stockQnt
    FROM product_variants
    WHERE id = ?
  `,
  // Get preordered order items for a variant, ordered by createdAt
  getPreOrderedItems: `
   SELECT oi.id, oi.orderId, oi.quantity
   FROM order_items oi
   JOIN orders o ON oi.orderId = o.id
   WHERE oi.variantId = ? AND oi.isBackOrdered = TRUE
   ORDER BY o.orderDate ASC;
  `,

  // Update preOrdered flag for order items
  markItemsAsProcessed: (itemIds) => {
    const placeholders = itemIds.map(() => '?').join(',');
    const sql = `UPDATE order_items SET isBackOrdered = FALSE WHERE id IN (${ placeholders })`;
    return { sql, values: itemIds };
  },

  // Get product variant by ID
  getVariantById: `SELECT * FROM product_variants WHERE id = ?`,

  updateStockAtomic: `
    UPDATE product_variants
    SET stockQnt = stockQnt + ?
    WHERE id = ? AND (stockQnt + ?) >= 0;
  `,
  // Update stock quantity for a variant
  updateVariantStock: `UPDATE product_variants SET stockQnt = stockQnt + ? WHERE id = ?;`,

  // Get order by ID
  getOrderById: `SELECT * FROM orders WHERE id = ?;`,

  // Get all items for an order
  getOrderItemsByOrderId: `
  SELECT id, quantity, preOrdered, variantId
  FROM order_items
  WHERE orderId = ?;
`

};

module.exports = variantQueries;
