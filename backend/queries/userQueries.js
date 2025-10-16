const userQueries = {
  getAll: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted,
           u.phone, u.createdAt, u.updatedAt
    FROM users u
  `,
  getById: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted,
           u.phone, u.createdAt, u.updatedAt
    FROM users u
    WHERE u.id = ?
  `,
  getByEmail: `
    SELECT id, name, email, password, role, role_accepted
    FROM users
    WHERE email = ?
  `,
  getAllApproved: `
    SELECT u.id, u.name, u.email, u.role, u.role_accepted,
           u.phone, u.createdAt, u.updatedAt
    FROM users u
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
    INSERT INTO users (name, email, password, role, role_accepted, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  update: `
    UPDATE users
    SET name = ?, email = ?, password = ?, role = ?, role_accepted = ?, phone = ?
    WHERE id = ?
  `,
  updateAdmin: `
    UPDATE users
    SET name = ?, email = ?, role = ?, role_accepted = ?, phone = ?
    WHERE id = ?
  `,
  delete: `
    DELETE FROM users
    WHERE id = ?
  `,
  findUserById: `
    SELECT u.name,
           u.email,
           u.phone
    FROM users u
    WHERE u.id = ?
  `,
  updateProfile: `
    UPDATE users
    SET phone = ?
    WHERE id = ?
  `
  ,
  getPasswordById: `
    SELECT id, password
    FROM users
    WHERE id = ?
  `,
  updatePassword: `
    UPDATE users
    SET password = ?
    WHERE id = ?
  `
};

module.exports = userQueries;
