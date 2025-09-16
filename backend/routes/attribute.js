const { getAttributes, getAttribute, addAttribute, deleteAttribute } = require('../controllers/attribute.controller');
const verifyToken = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');
const ROLES = require('../roles');

const router = require('express').Router();

router.get('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getAttributes);
router.get('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN) ,getAttribute);


router.post('/', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), addAttribute);

router.delete('/:id', verifyToken, authorizeRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteAttribute)


module.exports = router;