# Honda Civic Sale Site

Static, mobile-first foundation for a single-vehicle private-sale site.

## Commands

```sh
npm install
npm run dev
npm run validate:content
npm run typecheck
npm run build
```

Astro is configured for static output, so the generated `dist/` directory is compatible with Vercel's Astro deployment detection. No production hostname or QR Code is configured in this block.

## Content model

Advertisement content lives in `src/content/` and is loaded by `src/lib/content/loader.ts`:

- `site.yaml`: title, language, metadata, general public location, and description.
- `vehicle.yaml`: the single Civic's identity, year, price, mileage, location, and optional known details.
- `sections.yaml`: supported section visibility/order plus Hero options.
- `gallery.yaml`: main vehicle-gallery entries.
- `maintenance.yaml`: separate care/maintenance evidence entries.
- `links.yaml`: WhatsApp, OLX, and Webmotors settings.

Schemas in `src/lib/content/schema.ts` validate each file before the normalized typed model reaches the page. The root page is only a development representation proving the boundary works; final UI sections belong to later blocks.

Unknown section IDs, invalid primitive types, invalid supplied URLs, duplicate IDs, and malformed local image paths fail with contextual errors. Optional values normalize to `null` or empty arrays where appropriate.

Place future assets in `public/images/vehicle/` and `public/images/maintenance/`. Final photos are intentionally not included yet.
