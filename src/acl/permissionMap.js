const { resolveAccessibleModuleKeys } = require('./resolveAccess');

const MODULE_KEYS = {
  leads: {
    view: 'leads',
    assignTo: 'leads.assignto',
    delete: 'leads.delete',
  },
  campaign: {
    view: 'campaign',
    details: 'campaign.details',
    assignTo: 'campaign.assignto',
    edit: 'campaign.edit',
  },
  profile: {
    view: 'profile',
    newUser: 'profile.newusers',
    allUserTable: 'profile.allUserTable',
  },
};

function buildPermissionsFromAccess(roleModules = [], overrides = []) {
  const allowed = resolveAccessibleModuleKeys(roleModules, overrides);
  const leads = {
    view: allowed.has(MODULE_KEYS.leads.view),
    assignTo: allowed.has(MODULE_KEYS.leads.assignTo),
    delete: allowed.has(MODULE_KEYS.leads.delete),
  };
  return {
    leads: {
      ...leads,
      // Worker-style visibility: can view leads, but cannot reassign.
      assignedOnly: leads.view && !leads.assignTo,
    },
    campaign: {
      view: allowed.has(MODULE_KEYS.campaign.view),
      details: allowed.has(MODULE_KEYS.campaign.details) || allowed.has(MODULE_KEYS.campaign.view),
      assignTo: allowed.has(MODULE_KEYS.campaign.assignTo),
      edit: allowed.has(MODULE_KEYS.campaign.edit),
    },
    profile: {
      view: allowed.has(MODULE_KEYS.profile.view),
      newUser: allowed.has(MODULE_KEYS.profile.newUser),
      allUserTable: allowed.has(MODULE_KEYS.profile.allUserTable),
    },
  };
}

module.exports = { MODULE_KEYS, buildPermissionsFromAccess };
