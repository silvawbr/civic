# Honda Civic Sale Site

Static, mobile-first foundation for a single-vehicle private-sale site.

## Commands

```sh
npm install
npm run dev
npm run validate:content
npm run typecheck
npm run build
npm run generate:qr
```

Astro is configured for static output, so the generated `dist/` directory is compatible with Vercel's Astro deployment detection.

## Permanent public URL and vehicle QR contract

The public production URL is configured once in `src/content/site.yaml` as `site.publicBaseUrl` and is exposed through the normalized typed content model. It is currently:

```yaml
Visible URL: civic-se.vercel.app
Public URL: https://civic-se.vercel.app/
QR payload: https://civic-se.vercel.app/q
```

`/q` is the permanent semantic entry point for the physical vehicle QR Code. It statically redirects visitors to `/` and intentionally remains available as a future route-level boundary for `source = car_qr`. It does not require analytics, a backend, or a database.

Generate the committed print-source asset with:

```sh
npm run generate:qr
```

This writes `public/qr/vehicle-sale.svg` from the configured public URL and verifies the output by deterministic re-encoding. The QR uses error-correction level H, a four-module quiet zone, black modules, and a white background. It contains no logo or decorative styling. The generated SVG is deterministic and contains no timestamps or random metadata.

After the physical sticker is printed, the `/q` URL and QR payload must not change. Changes to price, mileage, photos, description, maintenance, WhatsApp, OLX, Webmotors, or the future analytics provider must not require QR regeneration. Physical scan testing through the perforated material remains a manual sticker-production check.

## Content model

Advertisement content lives in `src/content/` and is loaded by `src/lib/content/loader.ts`:

- `site.yaml`: title, language, metadata, social-sharing metadata, general public location, and description.
- `vehicle.yaml`: the single Civic's identity, year, price, mileage, location, and optional known details.
- `sections.yaml`: supported section visibility/order plus Hero options.
- `gallery.yaml`: main vehicle-gallery entries.
- `maintenance.yaml`: separate care/maintenance evidence entries.
- `links.yaml`: WhatsApp, OLX, and Webmotors settings.

Schemas in `src/lib/content/schema.ts` validate each file before the normalized typed model reaches the page. The root page is only a development representation proving the boundary works; final UI sections belong to later blocks.

Unknown section IDs, invalid primitive types, invalid supplied URLs, duplicate IDs, and malformed local image paths fail with contextual errors. Optional values normalize to `null` or empty arrays where appropriate.

Place future assets in `public/images/vehicle/` and `public/images/maintenance/`. Final photos are intentionally not included yet.

## Social-sharing preview

The optional `site.social` section in `src/content/site.yaml` controls the root page's Open Graph and Twitter/X metadata. `title` and `description` fall back to `site.defaultMetadata`; `image` and `imageAlt` are optional. Absolute `http`/`https` image URLs and relative public paths such as `/images/social/vehicle-share.jpg` are supported. Relative paths are resolved against `site.publicBaseUrl` before rendering.

The preferred future project-owned asset is `public/images/social/vehicle-share.jpg`, with recommended dimensions of 1200x630, JPG or PNG format, and an approximate 1.91:1 aspect ratio. The current configuration uses a temporary remote vehicle image; it should be replaced in configuration later without changing the page metadata implementation.
