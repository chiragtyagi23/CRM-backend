const { asyncHandler } = require('../lib/asyncHandler');
const aclService = require('../services/acl.service');
const { userRoleBody, overrideBody, parse } = require('../validators/acl.schema');

const list = asyncHandler(async (_req, res) => {
  const items = await aclService.listUsers();
  res.json({ items });
});

const updateRole = asyncHandler(async (req, res) => {
  const { roleId } = parse(userRoleBody, req.body);
  const item = await aclService.updateUserRole(req.params.id, roleId);
  if (!item) return res.status(404).json({ error: 'User not found' });
  res.json({ item });
});

const listOverrides = asyncHandler(async (req, res) => {
  const items = await aclService.listOverrides(req.params.id);
  res.json({ items });
});

const createOverride = asyncHandler(async (req, res) => {
  const body = parse(overrideBody, req.body);
  const item = await aclService.createOverride({
    userId: req.params.id,
    moduleId: body.moduleId,
    effect: body.effect,
    reason: body.reason,
  });
  res.status(201).json({ item });
});

const deleteOverride = asyncHandler(async (req, res) => {
  await aclService.deleteOverride(req.params.id);
  res.status(204).send();
});

module.exports = { list, updateRole, listOverrides, createOverride, deleteOverride };
