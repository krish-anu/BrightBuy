// attributeQueries.js

// Get all attributes
const getAllAttributes = `
  SELECT id, name
  FROM variant_attributes
  ORDER BY id ASC;
`;

// Get attribute by ID
const getAttributeById = `
  SELECT id, name
  FROM variant_attributes
  WHERE id = ?;
`;

// Insert new attribute
const insertAttribute = `
  INSERT INTO variant_attributes (name)
  VALUES (?);
`;

// Check if attribute exists by name
const checkAttributeExists = `
  SELECT id
  FROM variant_attributes
  WHERE name = ?;
`;

// Delete attribute by ID
const deleteAttributeById = `
  DELETE FROM variant_attributes
  WHERE id = ?;
`;

module.exports = {
  getAllAttributes,
  getAttributeById,
  insertAttribute,
  checkAttributeExists,
  deleteAttributeById,
};
