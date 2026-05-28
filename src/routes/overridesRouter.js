const express = require('express');
const usersController = require('../controllers/users.controller');
const { authenticateToken, requireModuleAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireModuleAccess('admin_acl'));
router.delete('/:id', usersController.deleteOverride);

module.exports = { overridesRouter: router };
