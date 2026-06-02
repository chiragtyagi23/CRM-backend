const express = require('express');
const rolesController = require('../controllers/roles.controller');
const { authenticateToken, requireModuleAccess, requireAnyModuleAccess } = require('../middleware/auth');

const router = express.Router();

// List roles for Profile "New user" (profile.newusers) and ACL admin
router.get(
  '/',
  authenticateToken,
  requireAnyModuleAccess('admin_acl', 'profile.newusers', 'profile'),
  rolesController.list,
);

router.use(authenticateToken, requireModuleAccess('admin_acl'));

router.post('/', rolesController.create);
router.put('/:id', rolesController.update);
router.delete('/:id', rolesController.remove);
router.get('/:id/modules', rolesController.getModules);
router.put('/:id/modules', rolesController.setModules);

module.exports = { rolesRouter: router };
