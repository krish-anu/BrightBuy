const cartQueries = {
  listByUser: `
    SELECT c.id, c.userId, c.variantId, c.quantity, c.selected, c.unitPrice,
           v.SKU, v.price as variantPrice, v.productId as productId, p.name as productName,
           v.variantName as variantName, v.imageURL as imageUrl,
           GROUP_CONCAT(CONCAT(va.name, '::', pvo.value) SEPARATOR '||') AS attributes
    FROM carts c
    LEFT JOIN product_variants v ON v.id = c.variantId
    LEFT JOIN products p ON p.id = v.productId
    LEFT JOIN product_variant_options pvo ON pvo.variantId = v.id
    LEFT JOIN variant_attributes va ON va.id = pvo.attributeId
    WHERE c.userId = ?
    GROUP BY c.id, c.userId, c.variantId, c.quantity, c.selected, c.unitPrice, v.SKU, v.price, v.productId, p.name, v.variantName, v.imageURL
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
