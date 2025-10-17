const addressQueries = {
  getByUser: `
    SELECT id, userId, line1, line2, cityId, postalCode, isDefault
    FROM addresses
    WHERE userId = ?
    ORDER BY isDefault DESC, id ASC
  `,
  insert: `
    INSERT INTO addresses (userId, line1, line2, city, cityId, postalCode, isDefault)
    VALUES (?, ?, ?, (SELECT name FROM cities WHERE id = ?), ?, ?, ?)
  `,
  update: `
    UPDATE addresses
    SET line1 = ?, line2 = ?, city = (SELECT name FROM cities WHERE id = ?), cityId = ?, postalCode = ?
    WHERE id = ? AND userId = ?
  `,
  delete: `
    DELETE FROM addresses
    WHERE id = ? AND userId = ?
  `,
  clearDefault: `
    UPDATE addresses SET isDefault = 0 WHERE userId = ?
  `,
  setDefault: `
    UPDATE addresses SET isDefault = 1 WHERE id = ? AND userId = ?
  `,
};

module.exports = addressQueries;
