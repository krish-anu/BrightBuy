const router = require('express').Router({ mergeParams: true });
const verifyToken = require('../middlewares/auth.middleware');
const { listAddresses, addAddress, updateAddress, deleteAddress, makeDefault } = require('../controllers/address.controller');

router.use(verifyToken);

router.get('/', listAddresses);
router.post('/', addAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.post('/:id/default', makeDefault);

module.exports = router;
