// Get all cities
const getAll = `SELECT * FROM cities ORDER BY id ASC`;

// Get city by ID
const getById = `SELECT * FROM cities WHERE id = ?`;

// Insert new city
const insert = `INSERT INTO cities (name, isMainCity) VALUES (?, ?)`;

// Set a city as main
const setMain = `
  UPDATE cities 
  SET isMainCity = 1 
  WHERE id = ?;
`;

// Check if city is main
const isMain = `SELECT id, name, isMainCity FROM cities WHERE id = ?`;

// Get all main cities
const getMainCities = `SELECT * FROM cities WHERE isMainCity = 1 ORDER BY id ASC`;

// Get all other cities
const getOtherCities = `SELECT * FROM cities WHERE isMainCity = 0 ORDER BY id ASC`;

module.exports = {
  getAll,
  getById,
  insert,
  setMain,
  isMain,
  getMainCities,
  getOtherCities
};
