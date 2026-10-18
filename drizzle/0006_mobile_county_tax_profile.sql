INSERT INTO `tax_profiles` (
  `id`, `user_id`, `name`, `location`, `tax_inclusive`, `active`, `created_at`, `updated_at`
)
SELECT
  'tax-mobile-county-' || lower(hex(randomblob(8))),
  `user_id`,
  'Mobile County cookie sales (3.5%)',
  'Mobile County, AL — outside Mobile/Prichard city limits',
  0,
  1,
  '2026-10-18T00:00:00.000Z',
  '2026-10-18T00:00:00.000Z'
FROM `settings`
WHERE NOT EXISTS (
  SELECT 1 FROM `tax_profiles`
  WHERE `tax_profiles`.`user_id` = `settings`.`user_id`
    AND `tax_profiles`.`name` = 'Mobile County cookie sales (3.5%)'
);
--> statement-breakpoint
INSERT INTO `tax_components` (
  `id`, `profile_id`, `name`, `kind`, `rate_bps`, `effective_from`, `effective_to`, `active`, `created_at`, `updated_at`
)
SELECT
  'tax-state-' || lower(hex(randomblob(8))),
  `tax_profiles`.`id`,
  'Alabama food/grocery',
  'state',
  200,
  '2026-10-18',
  NULL,
  1,
  '2026-10-18T00:00:00.000Z',
  '2026-10-18T00:00:00.000Z'
FROM `tax_profiles`
WHERE `tax_profiles`.`name` = 'Mobile County cookie sales (3.5%)'
  AND NOT EXISTS (
    SELECT 1 FROM `tax_components`
    WHERE `tax_components`.`profile_id` = `tax_profiles`.`id`
      AND `tax_components`.`kind` = 'state'
      AND `tax_components`.`effective_from` = '2026-10-18'
  );
--> statement-breakpoint
INSERT INTO `tax_components` (
  `id`, `profile_id`, `name`, `kind`, `rate_bps`, `effective_from`, `effective_to`, `active`, `created_at`, `updated_at`
)
SELECT
  'tax-county-' || lower(hex(randomblob(8))),
  `tax_profiles`.`id`,
  'Mobile County',
  'county',
  150,
  '2026-10-18',
  NULL,
  1,
  '2026-10-18T00:00:00.000Z',
  '2026-10-18T00:00:00.000Z'
FROM `tax_profiles`
WHERE `tax_profiles`.`name` = 'Mobile County cookie sales (3.5%)'
  AND NOT EXISTS (
    SELECT 1 FROM `tax_components`
    WHERE `tax_components`.`profile_id` = `tax_profiles`.`id`
      AND `tax_components`.`kind` = 'county'
      AND `tax_components`.`effective_from` = '2026-10-18'
  );
--> statement-breakpoint
UPDATE `settings`
SET
  `default_tax_profile_id` = (
    SELECT `tax_profiles`.`id`
    FROM `tax_profiles`
    WHERE `tax_profiles`.`user_id` = `settings`.`user_id`
      AND `tax_profiles`.`name` = 'Mobile County cookie sales (3.5%)'
    LIMIT 1
  ),
  `updated_at` = '2026-10-18T00:00:00.000Z';
