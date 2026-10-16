# Feather & Flour Bakery

A private, mobile-friendly bakery management system for Feather & Flour Bakery.

## Live app

[Open Feather & Flour Bakery](https://feather-flour-bakery.wxrjjy787n.chatgpt.site/)

The production app is hosted with OpenAI Sites because it uses server-side sign-in and a Cloudflare D1 database. The GitHub repository stores the source code and version history; GitHub Pages cannot run the server and database portions of this application.

## Features

- Dashboard with sales, inventory, and profit snapshots
- Point-of-sale workflow and sales history
- Product and inventory management
- Recipe costing with cost-per-item, profit, and suggested pricing
- Expense, vendor event, and sales-tax tracking
- Financial reports
- Responsive phone, tablet, and desktop layouts

## Local development

Requirements: Node.js 22.13 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5173/` in a browser. The local preview uses a development-only test sign-in and database.

## Quality checks

```bash
pnpm test
pnpm exec tsc --noEmit
pnpm build
```

## Data and hosting

- Next.js-compatible app built with Vinext
- Cloudflare Worker runtime
- Cloudflare D1 database with Drizzle ORM
- OpenAI Sites hosting and sign-in

Production data is not stored in this repository. Environment files, local databases, build output, and credentials are ignored by Git.
