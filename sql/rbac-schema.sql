-- RBAC schema — uses existing crm_signup as the user table (not a separate users table)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- crm_signup already exists; RBAC adds role_id + is_active via migration:
-- ALTER TABLE crm_signup ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
-- ALTER TABLE crm_signup ADD COLUMN is_active boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_key text NOT NULL UNIQUE,
  name text NOT NULL,
  route text NOT NULL,
  icon text,
  parent_id uuid REFERENCES modules(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_modules (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, module_id)
);

CREATE TABLE IF NOT EXISTS user_module_overrides (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES crm_signup(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  effect text NOT NULL CHECK (effect IN ('ALLOW', 'DENY')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

CREATE INDEX IF NOT EXISTS user_module_overrides_user_idx ON user_module_overrides(user_id);
