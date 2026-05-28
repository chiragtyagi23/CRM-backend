const { asyncHandler } = require('../lib/asyncHandler');
const aclService = require('../services/acl.service');
const { moduleBody, parse } = require('../validators/acl.schema');

const list = asyncHandler(async (_req, res) => {
  const items = await aclService.listModules();
  res.json({ items });
});

const create = asyncHandler(async (req, res) => {
  const body = parse(moduleBody, req.body);
  const item = await aclService.createModule({
    module_key: body.module_key,
    name: body.name,
    route: body.route,
    icon: body.icon ?? null,
    parent_id: body.parent_id ?? null,
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  });
  res.status(201).json({ item });
});

const update = asyncHandler(async (req, res) => {
  const partialModule = moduleBody.extend({
    module_key: moduleBody.shape.module_key.optional(),
    name: moduleBody.shape.name.optional(),
    route: moduleBody.shape.route.optional(),
  });
  const body = parse(partialModule, req.body);
  const item = await aclService.updateModule(req.params.id, {
    module_key: body.module_key,
    name: body.name,
    route: body.route,
    icon: body.icon,
    parent_id: body.parent_id,
    sort_order: body.sort_order,
    is_active: body.is_active,
  });
  if (!item) return res.status(404).json({ error: 'Module not found' });
  res.json({ item });
});

const remove = asyncHandler(async (req, res) => {
  await aclService.deleteModule(req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
