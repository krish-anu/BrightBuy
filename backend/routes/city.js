const { getCities, getCity, addCity, addToMainCity, getMainCities, getOtherCities, isMainCity } = require('../controllers/city.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');
const router = require('express').Router();



router.get('/isMain/:id',isMainCity)
router.get('/main', getMainCities)
router.get('/other',getOtherCities)
router.get('/', getCities)
router.get('/:id', getCity);

router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addCity);

router.patch('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addToMainCity)

module.exports = router;