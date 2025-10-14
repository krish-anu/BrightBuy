const userQueries = {
  getAll: `
    SELECT id, name, email, role, role_accepted, address, phone, cityId, createdAt, updatedAt
    FROM users
  `,
  getById: `
    SELECT id, name, email, role, role_accepted, address, phone, cityId, createdAt, updatedAt
    FROM users
    WHERE id = ?
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
    INSERT INTO users (name, email, password, role, role_accepted, address, phone, cityId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  update: `
    UPDATE users
    SET name = ?, email = ?, password = ?, role = ?, role_accepted = ?, address = ?, phone = ?, cityId = ?
    WHERE id = ?
  `,
  updateAdmin: `
    UPDATE users
    SET name = ?, email = ?, role = ?, role_accepted = ?, address = ?, phone = ?, cityId = ?
    WHERE id = ?
  `,
  delete: `
    DELETE FROM users
    WHERE id = ?
  `,
  findUserById: `
    SELECT name, email, phone, address
    FROM users
    WHERE id = ?
  `,
  updateProfile: `
    UPDATE users
    SET phone = ?, address = ?
    WHERE id = ?
  `
};

module.exports = userQueries;
