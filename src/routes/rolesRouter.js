const express = require('express');
const rolesController = require('../controllers/roles.controller');
const { authenticateToken, requireModuleAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireModuleAccess('admin_acl'));

router.get('/', rolesController.list);
router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.delete('/:id', rolesController.remove);
router.get('/:id/modules', rolesController.getModules);
router.put('/:id/modules', rolesController.setModules);

module.exports = { rolesRouter: router };
