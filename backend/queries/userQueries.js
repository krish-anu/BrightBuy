const userQueries = {
  getAll: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted, u.addressId,
           TRIM(BOTH ', ' FROM CONCAT_WS(', ', a.line1, a.line2, a.city, a.postalCode)) AS address,
           u.phone, u.cityId, u.createdAt, u.updatedAt
    FROM users u
    LEFT JOIN addresses a ON u.addressId = a.id
  `,
  getById: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted, u.addressId,
           TRIM(BOTH ', ' FROM CONCAT_WS(', ', a.line1, a.line2, a.city, a.postalCode)) AS address,
           u.phone, u.cityId, u.createdAt, u.updatedAt
    FROM users u
    LEFT JOIN addresses a ON u.addressId = a.id
    WHERE u.id = ?
  `,
  getByEmail: `
    SELECT id, name, email, password, role, role_accepted
    FROM users
    WHERE email = ?
  `,
  getAllApproved: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted, u.addressId,
           TRIM(BOTH ', ' FROM CONCAT_WS(', ', a.line1, a.line2, a.city, a.postalCode)) AS address,
           u.phone, u.cityId, u.createdAt, u.updatedAt
    FROM users u
    LEFT JOIN addresses a ON u.addressId = a.id
    WHERE u.role_accepted = 1
  `,
  getDeliveryStaff: `
    SELECT id, name, email, phone
    FROM users
    WHERE role = 'DeliveryStaff'
  `,
  getPendingStaff: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted, u.createdAt
    FROM users u
    WHERE u.role_accepted = 0 AND u.role <> 'SuperAdmin'
    ORDER BY u.createdAt DESC
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
