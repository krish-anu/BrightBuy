const variantQueries = {
  getAll: `
    SELECT v.id, v.SKU, v.variantName, v.price, v.stockQnt, v.productId, v.imageURL,
           p.name as productName, p.brand, p.description
    FROM product_variants v
    JOIN products p ON v.productId = p.id
    ORDER BY v.createdAt DESC
  `,

  getById: `
    SELECT v.id, v.SKU, v.variantName, v.price, v.stockQnt, v.productId, v.imageURL,
           p.name as productName, p.brand, p.description
    FROM product_variants v
    JOIN products p ON v.productId = p.id
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
    WHERE oi.createdAt >= ?
    GROUP BY v.id
    ORDER BY soldQuantity DESC
    LIMIT ?
  `,

  getStock: `
    SELECT id, variantName, SKU, stockQnt
    FROM product_variants
    WHERE id = ?
  `
};

module.exports = variantQueries;
