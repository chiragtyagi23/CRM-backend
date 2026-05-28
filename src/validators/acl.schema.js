const { z } = require('zod');

const roleBody = z.object({
  name: z.string().min(1).max(64),
  description: z.string().max(500).optional().nullable(),
});

const moduleBody = z.object({
  module_key: z.string().min(1).max(96).regex(/^[a-z0-9_.]+$/i),
  name: z.string().min(1).max(128),
  route: z.string().min(1).max(256),
  icon: z.string().max(64).optional().nullable(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

const roleModulesBody = z.object({
  moduleIds: z.array(z.string().uuid()),
});

const userRoleBody = z.object({
  roleId: z.string().uuid().nullable(),
});

const overrideBody = z.object({
  moduleId: z.string().uuid(),
  effect: z.enum(['ALLOW', 'DENY']),
  reason: z.string().max(500).optional().nullable(),
});

function parse(schema, data) {
  const r = schema.safeParse(data);
  if (!r.success) {
    const err = new Error(r.error.issues.map((i) => i.message).join('; '));
    err.status = 400;
    throw err;
  }
  return r.data;
}

module.exports = { roleBody, moduleBody, roleModulesBody, userRoleBody, overrideBody, parse };
