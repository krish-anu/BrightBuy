const userQueries = {
  getAll: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted, u.addressId,
           JSON_OBJECT(
             'line1', a.line1,
             'line2', a.line2,
             'city', a.city,
             'postalCode', a.postalCode
           ) AS address,
           u.phone, u.cityId, u.createdAt, u.updatedAt
    FROM users u
    LEFT JOIN addresses a ON u.addressId = a.id
  `,
  getById: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted, u.addressId,
           JSON_OBJECT(
             'line1', a.line1,
             'line2', a.line2,
             'city', a.city,
             'postalCode', a.postalCode
           ) AS address,
           u.phone, u.cityId, u.createdAt, u.updatedAt
    FROM users u
    LEFT JOIN addresses a ON u.addressId = a.id
    WHERE u.id = ?
  `,
  getByEmail: `
    SELECT id, name, email, password, role
    FROM users
    WHERE email = ?
  `,
  getDeliveryStaff: `
    SELECT id, name, email, phone
    FROM users
    WHERE role = 'DeliveryStaff'
  `,
  insert: `
    INSERT INTO users (name, email, password, role, role_accepted, phone, cityId, addressId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  update: `
    UPDATE users
    SET name = ?, email = ?, password = ?, role = ?, role_accepted = ?, phone = ?, cityId = ?, addressId = ?
    WHERE id = ?
  `,
  updateAdmin: `
    UPDATE users
    SET name = ?, email = ?, role = ?, role_accepted = ?, phone = ?, cityId = ?, addressId = ?
    WHERE id = ?
  `,
  delete: `
    DELETE FROM users
    WHERE id = ?
  `
};

module.exports = userQueries;
