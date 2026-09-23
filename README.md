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

`/q` is the permanent semantic entry point for the physical vehicle QR Code. It statically redirects visitors to `/?utm_source=car_qr`, preserving the printed URL while making QR attribution explicit. It does not require a backend or a database.

Generate the committed print-source asset with:

```sh
npm run generate:qr
```

This writes `public/qr/vehicle-sale.svg` from the configured public URL and verifies the output by deterministic re-encoding. The QR uses error-correction level H, a four-module quiet zone, black modules, and a white background. It contains no logo or decorative styling. The generated SVG is deterministic and contains no timestamps or random metadata.

After the physical sticker is printed, the `/q` URL and QR payload must not change. Changes to price, mileage, photos, description, maintenance, WhatsApp, OLX, Webmotors, or the future analytics provider must not require QR regeneration. Physical scan testing through the perforated material remains a manual sticker-production check.

## Traffic and conversion analytics

The site uses Vercel Web Analytics through `@vercel/analytics` and the compatible `@astrojs/vercel` static adapter. Native page views are provided by Vercel's Astro integration; the site does not emit a second custom `page_view` event. Custom events are viewed in the Vercel project dashboard under Analytics. Vercel custom events require a Pro or Enterprise plan, and UTM dimensions in the dashboard require Web Analytics Plus or Enterprise.

The controlled traffic-source contract is:

- `car_qr`: `https://civic-se.vercel.app/q` → `/?utm_source=car_qr`
- `olx`: `https://civic-se.vercel.app/?utm_source=olx`
- `webmotors`: `https://civic-se.vercel.app/?utm_source=webmotors`
- `instagram`: `https://civic-se.vercel.app/?utm_source=instagram`
- `direct/share`: `/` or any absent/unknown `utm_source` value

Only these normalized values are used by project-emitted conversion events. The current URL query is used for attribution during the page lifecycle; no cookies, `localStorage`, or visitor IDs are added.

Conversion events are emitted from the stable `data-action` values:

- `data-action="whatsapp"` → `click_whatsapp`
- `data-action="olx"` → `click_olx`
- `data-action="webmotors"` → `click_webmotors`

Each conversion event contains only the normalized `source` property. Tracking is best-effort and never prevents the destination anchor from navigating. No phone numbers, message contents, names, arbitrary query-string values, fingerprinting, custom backend, or site dashboard are added.

The provider component uses its default automatic environment mode: local development uses the provider's development behavior, while deployed data is available in Vercel's environment-specific Analytics views for preview and production deployments. Enable Web Analytics in the Vercel project and deploy before expecting provider-side ingestion.

## Content model

Advertisement content lives in `src/content/` and is loaded by `src/lib/content/loader.ts`:

- `site.yaml`: title, language, metadata, social-sharing metadata, general public location, and description.
- `vehicle.yaml`: the single Civic's identity, year, price, mileage, location, and optional known details.
- `sections.yaml`: supported section visibility/order plus Hero options.
- `gallery.yaml`: main vehicle-gallery entries.
- `maintenance.yaml`: separate care/maintenance evidence entries.
- `transparency.yaml`: concise, ordered context about the private sale and current vehicle condition. Items can be enabled, disabled, edited, and reordered independently. The optional `{mileageKm}` token is replaced with the canonical mileage from `vehicle.yaml` when the page is rendered.
- `links.yaml`: WhatsApp, OLX, and Webmotors settings.

Schemas in `src/lib/content/schema.ts` validate each file before the normalized typed model reaches the page. The root page renders the customer-facing Vehicle Overview; later blocks will add the remaining sale-site sections.

Unknown section IDs, invalid primitive types, invalid supplied URLs, duplicate IDs, and malformed local image paths fail with contextual errors. Optional values normalize to `null` or empty arrays where appropriate.

Place future assets in `public/images/vehicle/` and `public/images/maintenance/`. The configured Hero image lives at `public/images/vehicle/civic_hero.png`; gallery photos remain managed separately by `gallery.yaml`. Maintenance evidence may include receipts, service orders, warranty cards, or labels only after manually sanitizing them; do not publish CPF, addresses, RENAVAM, complete chassis numbers, payment information, or unnecessary phone numbers.

## Social-sharing preview

The optional `site.social` section in `src/content/site.yaml` controls the root page's Open Graph and Twitter/X metadata. `title` and `description` fall back to `site.defaultMetadata`; `image` and `imageAlt` are optional. Absolute `http`/`https` image URLs and relative public paths such as `/images/social/vehicle-share.jpg` are supported. Relative paths are resolved against `site.publicBaseUrl` before rendering.

The preferred future project-owned asset is `public/images/social/vehicle-share.jpg`, with recommended dimensions of 1200x630, JPG or PNG format, and an approximate 1.91:1 aspect ratio. The current configuration uses a temporary remote vehicle image; it should be replaced in configuration later without changing the page metadata implementation.
