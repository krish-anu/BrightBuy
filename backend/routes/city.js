const { getCities, getCity, addCity, addToMainCity, getMainCities, getOtherCities, isMainCity } = require('../controllers/city.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();



router.get('/isMain/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,isMainCity)
router.get('/main', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getMainCities)
router.get('/other', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getOtherCities)
router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getCities)
router.get('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getCity);

router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addCity);

router.patch('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addToMainCity)

module.exports = router;