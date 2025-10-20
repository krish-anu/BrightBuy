const { getAttributes, getAttribute, addAttribute, deleteAttribute } = require('../controllers/attribute.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');

const router = require('express').Router();

// Allow public GET for attributes (storefront needs to read attributes without admin auth)
router.get('/', getAttributes);
router.get('/:id', getAttribute);


router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addAttribute);

router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteAttribute)


module.exports = router;