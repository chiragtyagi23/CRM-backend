const express = require('express');
const usersController = require('../controllers/users.controller');
const { authenticateToken, requireModuleAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireModuleAccess('admin_acl'));

router.get('/', usersController.list);
router.put('/:id/role', usersController.updateRole);
router.get('/:id/overrides', usersController.listOverrides);
router.post('/:id/overrides', usersController.createOverride);

module.exports = { usersRouter: router };
