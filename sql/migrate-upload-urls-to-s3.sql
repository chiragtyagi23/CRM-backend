UPDATE campaign_master_table
SET logo = REPLACE(logo, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE logo LIKE '%localhost:4000/uploads%';

UPDATE campaign_master_table
SET cover_image = REPLACE(cover_image, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE cover_image LIKE '%localhost:4000/uploads%';

UPDATE campaign_document_table
SET url = REPLACE(url, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE url LIKE '%localhost:4000/uploads%';

UPDATE campaign_banner_data
SET image_id = REPLACE(image_id, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE image_id LIKE '%localhost:4000/uploads%';

UPDATE campaign_media
SET url = REPLACE(url, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE url LIKE '%localhost:4000/uploads%';

UPDATE campaign_size_floor
SET blueprint_image = REPLACE(blueprint_image, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE blueprint_image LIKE '%localhost:4000/uploads%';

UPDATE campaign_project_highlights
SET icon = REPLACE(icon, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE icon LIKE '%localhost:4000/uploads%';

UPDATE campaign_amenities
SET icon = REPLACE(icon, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')
WHERE icon LIKE '%localhost:4000/uploads%';

UPDATE campaign_hero_data
SET data = REPLACE(data::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE data::text LIKE '%localhost:4000/uploads%';

UPDATE campaign_project_images
SET images = REPLACE(images::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE images::text LIKE '%localhost:4000/uploads%';

UPDATE campaign_project_benefits
SET background_images = REPLACE(background_images::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE background_images::text LIKE '%localhost:4000/uploads%';

UPDATE campaign_project_benefits
SET items = REPLACE(items::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE items::text LIKE '%localhost:4000/uploads%';

UPDATE campaign_project_benefits
SET stats = REPLACE(stats::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE stats::text LIKE '%localhost:4000/uploads%';

UPDATE campaign_size_floor
SET panels = REPLACE(panels::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE panels::text LIKE '%localhost:4000/uploads%';

UPDATE campaign_size_floor
SET tabs = REPLACE(tabs::text, 'http://localhost:4000/uploads', 'https://my-app-ecommerce-prod-2.s3.ap-south-1.amazonaws.com/magnum/uploads')::jsonb
WHERE tabs::text LIKE '%localhost:4000/uploads%';
