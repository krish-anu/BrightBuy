const { getCities, getCity, addCity, addToMainCity, getMainCities, getOtherCities, isMainCity } = require('../controllers/city.controller');

const router = require('express').Router();

router.get('/isMain/:id',isMainCity)
router.get('/main', getMainCities)
router.get('/other',getOtherCities)
router.get('/', getCities)
router.get('/:id', getCity);

router.post('/', addCity);

router.patch('/',addToMainCity)

module.exports = router;