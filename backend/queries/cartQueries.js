const cartQueries = {
  listByUser: `
    SELECT c.id, c.userId, c.variantId, c.quantity, c.selected, c.unitPrice, v.SKU, v.price as variantPrice, v.productId as productId, p.name as productName
    FROM carts c
    LEFT JOIN product_variants v ON v.id = c.variantId
    LEFT JOIN products p ON p.id = v.productId
    WHERE c.userId = ?
    ORDER BY c.createdAt DESC
  `,
  insert: `
    INSERT INTO carts (userId, variantId, quantity, selected, unitPrice)
    VALUES (?, ?, ?, ?, ?)
  `,
  updateQuantity: `
    UPDATE carts SET quantity = ? WHERE id = ? AND userId = ?
  `,
  updateSelected: `
    UPDATE carts SET selected = ? WHERE id = ? AND userId = ?
  `,
  delete: `
    DELETE FROM carts WHERE id = ? AND userId = ?
  `,
  findByUserVariant: `
    SELECT * FROM carts WHERE userId = ? AND variantId = ? LIMIT 1
  `,
  clearByUser: `
    DELETE FROM carts WHERE userId = ?
  `,
};

module.exports = cartQueries;
