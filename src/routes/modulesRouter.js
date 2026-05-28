const express = require('express');
const modulesController = require('../controllers/modules.controller');
const { authenticateToken, requireModuleAccess } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken, requireModuleAccess('admin_acl'));

router.get('/', modulesController.list);
router.post('/', modulesController.create);
router.put('/:id', modulesController.update);
router.delete('/:id', modulesController.remove);

module.exports = { modulesRouter: router };
