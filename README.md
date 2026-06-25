# Raznova

B2B export website for **Raznova** (a brand of Shrinath Ji Enterprises, Pune, India). Buyers in Latin America and Africa browse spare-parts catalogues for Hero, Bajaj, TVS and carried brands, then request a quote — there is no pricing, cart, or checkout on this site.

Built with Next.js (App Router) + Tailwind CSS, deployed on Vercel. Backend is Supabase (storage + leads only).

## Locales

`en` (default), `es` (Latin American Spanish), `en-ZA` (English, Africa-market copy). Routes are locale-prefixed: `/en`, `/es`, `/en-ZA`.

## Content model

Source of truth is Supabase (`raznova_catalogs`, `raznova_showcase` tables — public read, no pricing). The site renders from committed JSON snapshots in `src/data/`, regenerated via `scripts/sync_content.mjs`. The only live Supabase call from the browser is the quote form insert (`raznova_quote_requests`, anon insert-only).

## Local development

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_ANON_KEY (and service_role for scripts)
npm run dev
```

## Publishing content changes

1. Add/replace PDFs in `D:\catalog`, update `scripts/pdf_manifest.json` if needed, then:
   ```bash
   npm run upload-pdfs
   ```
2. To update showcase parts, prepare a CSV (`brand, model, part_no, category, image_filename, description_en, description_es`) and run:
   ```bash
   npm run import-showcase path/to/parts.csv
   ```
3. Regenerate the committed snapshots and publish:
   ```bash
   npm run sync-content
   git add src/data && git commit -m "Update content" && git push
   ```
   Pushing to `main` auto-deploys via Vercel.

## Config

Edit `src/lib/config.ts` for WhatsApp number, contact email, and company details.

## Hard rules

- No pricing anywhere.
- OEM brand/part names are referenced for fitment identification only — Raznova is not affiliated with the OEMs.
- Never commit `.env*` or catalogue PDFs to the repo.
