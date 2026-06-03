ALTER TABLE capture_leads ADD COLUMN IF NOT EXISTS lead_score TEXT;

UPDATE capture_leads
SET lead_score = UPPER(TRIM(status)),
    status = 'NEW'
WHERE LOWER(TRIM(status)) IN ('hot', 'warm', 'cold');

UPDATE capture_leads
SET status = UPPER(REPLACE(TRIM(status), '_', ' '))
WHERE LOWER(TRIM(status)) IN ('new', 'contacted', 'qualified', 'opportunity', 'site visit', 'site_visit', 'sitevisit');
