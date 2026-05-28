/**
 * ACL resolution — priority:
 * 1. User Override DENY
 * 2. User Override ALLOW
 * 3. Role Module Access
 * 4. Default DENY
 */

/**
 * @param {Array<{ module_key: string, effect?: string | null }>} roleModules
 * @param {Array<{ module_key: string, effect: string }>} overrides
 * @returns {Set<string>} allowed module keys
 */
function resolveAccessibleModuleKeys(roleModules, overrides) {
  const roleSet = new Set(
    (roleModules || []).map((m) => String(m.module_key || m.moduleKey || '').trim()).filter(Boolean),
  );

  const deny = new Set();
  const allow = new Set();

  for (const o of overrides || []) {
    const key = String(o.module_key || o.moduleKey || '').trim();
    if (!key) continue;
    const effect = String(o.effect || '').toUpperCase();
    if (effect === 'DENY') deny.add(key);
    if (effect === 'ALLOW') allow.add(key);
  }

  const allowed = new Set();
  for (const key of roleSet) {
    if (!deny.has(key)) allowed.add(key);
  }
  for (const key of allow) {
    if (!deny.has(key)) allowed.add(key);
  }

  return allowed;
}

/**
 * @param {string} moduleKey
 * @param {Set<string>} allowedKeys
 */
function hasModuleAccess(moduleKey, allowedKeys) {
  return allowedKeys.has(String(moduleKey || '').trim());
}

module.exports = { resolveAccessibleModuleKeys, hasModuleAccess };
