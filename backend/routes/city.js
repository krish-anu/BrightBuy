const { getCities, getCity, addCity, addToMainCity, getMainCities, getOtherCities, isMainCity } = require('../controllers/city.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();



// Read endpoints: allow any authenticated role
router.get('/isMain/:id', verifyToken, isMainCity)
router.get('/main', verifyToken, getMainCities)
router.get('/other', verifyToken, getOtherCities)
router.get('/', verifyToken, getCities)
router.get('/:id', verifyToken, getCity);

// Write endpoints: restricted to Admin/SuperAdmin
router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addCity);
router.patch('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addToMainCity)

module.exports = router;