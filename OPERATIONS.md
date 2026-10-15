# Feather & Flour Bakery — operations guide

## Access and security

The production Site is private and uses ChatGPT sign-in. The hosting platform injects the authenticated user identity, and every application read and write is scoped to that stable user ID. Do not change the Site audience unless access is intentionally being expanded. The application never collects or stores card numbers, CVVs, or card authentication data.

## Data storage

Structured records are stored in the Site's managed D1 relational database. Product and receipt images are stored in the attached R2 object bucket. Money is stored as integer cents and tax rates as integer basis points. Sales snapshot product name, SKU, unit price, unit cost, taxable status, and every tax component so later price or rate changes do not alter old transactions.

## Local development

Requirements: Node.js 22.13 or newer, pnpm 11 or newer, and Git.

1. Run `pnpm install`.
2. Run `pnpm run db:generate` after changing `db/schema.ts`.
3. Run `pnpm run build` once so the local Worker configuration exists.
4. Apply each new migration to the local database with:
   `node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/<migration>.sql`
5. Run `pnpm run dev` and use the printed loopback URL. Local sign-in uses the starter's development identity.
6. Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm run build` before publishing.

## Production deployment

Use the OpenAI Sites source workflow. A production deployment applies any pending checked-in Drizzle migrations, attaches the `DB` and `BUCKET` bindings declared in `.openai/hosting.json`, and publishes a private saved version. Never edit an already-applied migration; add a new migration instead.

## Backups and restore

- Export products from **Products → Export**.
- Export sales and tax records from **Reports → Export CSV** for each desired reporting period.
- Print or save the report as PDF from **Reports → Print / Save PDF**.
- Keep periodic copies of both CSV exports outside the Site. These are the portable essential-business-data backup.
- Hosted database and bucket infrastructure are managed by Sites. For a full infrastructure-level restore, retain the source commit and deployment version ID, then contact the workspace/Sites administrator to restore or clone the managed resources. Do not attempt to recreate financial history from edited migrations.
- After any restore, reconcile record counts and totals for sales, tax, expenses, and inventory before entering new transactions.

## Financial controls

- Configure verified tax rates before checkout; the software intentionally does not assume Alabama, county, or city rates.
- Treat the tax report as collected-tax reporting, not as a completed tax return or final tax liability.
- Recipe COGS and general expenses are shown separately. If ingredient purchases are entered as expenses, do not add them to estimated profit a second time outside the application.
- Refund and void actions are permanent audit events and restore inventory once. Sales are never deleted.
