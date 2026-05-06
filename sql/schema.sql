CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Generic updated_at trigger helper
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================
-- CRM
-- =========================

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  company text,
  status text NOT NULL DEFAULT 'lead',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customers_status_idx ON customers(status);
CREATE INDEX IF NOT EXISTS customers_created_at_idx ON customers(created_at DESC);

DROP TRIGGER IF EXISTS customers_set_updated_at ON customers;
CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- =========================
-- Campaign / Microsite data
-- =========================

CREATE TABLE IF NOT EXISTS campaign_master_table (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  "desc" text,
  email text,
  mobile text,
  address text,
  logo text,
  cover_image text,
  reg_no text,
  template_key text NOT NULL DEFAULT 'luxury-template',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_master_title_idx ON campaign_master_table(title);

DROP TRIGGER IF EXISTS campaign_master_set_updated_at ON campaign_master_table;
CREATE TRIGGER campaign_master_set_updated_at
BEFORE UPDATE ON campaign_master_table
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS campaign_document_table (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  url text NOT NULL,
  type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_document_campaign_idx ON campaign_document_table(campaign_id);

-- Template-1 reference: hero.json -> backgroundImages [{src, alt}]
CREATE TABLE IF NOT EXISTS campaign_banner_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  image_id text NOT NULL,
  alt text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_banner_campaign_sort_idx ON campaign_banner_data(campaign_id, sort_order);

-- Template-1 reference: hero.json (store entire hero payload)
CREATE TABLE IF NOT EXISTS campaign_hero_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS campaign_hero_set_updated_at ON campaign_hero_data;
CREATE TRIGGER campaign_hero_set_updated_at
BEFORE UPDATE ON campaign_hero_data
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Template-1 reference: overview.json (facts + certifications arrays)
CREATE TABLE IF NOT EXISTS campaign_project_overview (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  section_label text,
  title_before text,
  title_italic text,
  title_after text,
  body text,
  facts jsonb NOT NULL DEFAULT '[]'::jsonb,
  certifications_title text,
  certifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS campaign_overview_set_updated_at ON campaign_project_overview;
CREATE TRIGGER campaign_overview_set_updated_at
BEFORE UPDATE ON campaign_project_overview
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Template-1 reference: gallery.json -> cells[{tag, feature, wideBottom, images:[{src, alt}]}]
CREATE TABLE IF NOT EXISTS campaign_project_images (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  tag text,
  feature boolean NOT NULL DEFAULT false,
  wide_bottom boolean NOT NULL DEFAULT false,
  images jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_project_images_campaign_sort_idx ON campaign_project_images(campaign_id, sort_order);

-- Template-1 reference: floorplans.json -> blueprintImage, defaultTabId, tabs[], panels{}
CREATE TABLE IF NOT EXISTS campaign_size_floor (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  section_label text,
  title_before text,
  title_italic text,
  title_after text,
  blueprint_image text,
  default_tab_id text,
  tabs jsonb NOT NULL DEFAULT '[]'::jsonb,
  panels jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS campaign_size_floor_set_updated_at ON campaign_size_floor;
CREATE TRIGGER campaign_size_floor_set_updated_at
BEFORE UPDATE ON campaign_size_floor
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Template-1 reference: amenities.json -> items[{icon, name, desc}]
CREATE TABLE IF NOT EXISTS campaign_amenities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  icon text,
  name text NOT NULL,
  "desc" text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_amenities_campaign_sort_idx ON campaign_amenities(campaign_id, sort_order);

-- Template-1 reference: benefits.json -> backgroundImages[], items[], stats[]
CREATE TABLE IF NOT EXISTS campaign_project_benefits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL UNIQUE REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  section_label text,
  title_before text,
  title_italic text,
  title_after text,
  background_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS campaign_benefits_set_updated_at ON campaign_project_benefits;
CREATE TRIGGER campaign_benefits_set_updated_at
BEFORE UPDATE ON campaign_project_benefits
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Template-1 reference: highlights.json -> items[{num, icon, title, text}]
CREATE TABLE IF NOT EXISTS campaign_project_highlights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  num text,
  icon text,
  title text NOT NULL,
  text text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_project_highlights_campaign_sort_idx
ON campaign_project_highlights(campaign_id, sort_order);

-- Social infrastructure (cards + items)
CREATE TABLE IF NOT EXISTS campaign_social_infra_group (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_social_infra_group_campaign_sort_idx
ON campaign_social_infra_group(campaign_id, sort_order);

CREATE TABLE IF NOT EXISTS campaign_social_infra_item (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES campaign_social_infra_group(id) ON DELETE CASCADE,
  name text NOT NULL,
  value text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_social_infra_item_group_sort_idx
ON campaign_social_infra_item(group_id, sort_order);

-- Media rows (kind + url), used by CRM campaign editor
CREATE TABLE IF NOT EXISTS campaign_media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaign_master_table(id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_media_campaign_sort_idx ON campaign_media(campaign_id, sort_order);

