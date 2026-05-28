const { asyncHandler } = require('../lib/asyncHandler');
const aclService = require('../services/acl.service');
const { roleBody, roleModulesBody, parse } = require('../validators/acl.schema');

const list = asyncHandler(async (_req, res) => {
  const items = await aclService.listRoles();
  res.json({ items });
});

const create = asyncHandler(async (req, res) => {
  const body = parse(roleBody, req.body);
  const item = await aclService.createRole(body);
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const body = parse(
    roleBody.extend({ name: roleBody.shape.name.optional(), description: roleBody.shape.description.optional() }),
    req.body,
  );
  const item = await aclService.updateRole(req.params.id, body);
  if (!item) return res.status(404).json({ error: 'Role not found' });
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await aclService.deleteRole(req.params.id);
  res.status(204).send();
});

const getModules = asyncHandler(async (req, res) => {
  const moduleIds = await aclService.getRoleModuleIds(req.params.id);
  res.json({ moduleIds });
});

const setModules = asyncHandler(async (req, res) => {
  const { moduleIds } = parse(roleModulesBody, req.body);
  const ids = await aclService.setRoleModules(req.params.id, moduleIds);
  res.json({ moduleIds: ids });
});

module.exports = { list, create, update, remove, getModules, setModules };
