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

Dependency policy: determine the latest stable release from the live package registry and use it by default; keep a package below latest only for a documented compatibility reason, and consult official migration or release documentation before retaining an older major.

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

## Traffic analytics

Provider: Vercel Web Analytics.

Integration: `@vercel/analytics`, using the official Astro component import `@vercel/analytics/astro`. The component is rendered in `src/components/SiteAnalytics.astro` on both `/` and the permanent `/q` QR entry route. Vercel automatically collects visitors and page views after deployment; use the Vercel dashboard for the built-in traffic dimensions available to the current project, including pages/routes, referrers, countries, devices, browsers, and operating systems.

Current limitations:

- Custom conversion events are unavailable on the current plan and are not emitted by the project.
- Detailed UTM reporting is available only where supported by the current Vercel plan (Web Analytics Plus or Enterprise according to Vercel's current documentation).
- Referrers are observational: external sites may omit or strip referrer information.

The standardized campaign URLs remain available for future plan support:

- `https://civic-se.vercel.app/?utm_source=olx`
- `https://civic-se.vercel.app/?utm_source=webmotors`
- `https://civic-se.vercel.app/?utm_source=instagram`

The physical QR URL remains permanently `https://civic-se.vercel.app/q`. Its dedicated `/q` document includes the Analytics component before the existing static redirect to `/?utm_source=car_qr`, so production Vercel route attribution can be verified after deployment; it does not require QR regeneration. The `utm_source=car_qr` query is retained as a future-ready convention, not as a claim of current dashboard reporting.

Future analytics-ready hooks are preserved on the conversion links:

- `data-action="whatsapp"`
- `data-action="olx"`
- `data-action="webmotors"`

No cookies, custom visitor IDs, `localStorage` tracking IDs, fingerprinting, buyer identity tracking, phone/message analytics, or alternate analytics provider are added. Analytics is best-effort and never blocks rendering or navigation.

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

Place future assets in `public/images/vehicle/` and `public/images/maintenance/`. The configured Hero image lives at `public/images/vehicle/civic_hero-retouched.png`; gallery photos remain managed separately by `gallery.yaml`. Maintenance evidence may include receipts, service orders, warranty cards, or labels only after manually sanitizing them; do not publish CPF, addresses, RENAVAM, complete chassis numbers, payment information, or unnecessary phone numbers.

## Social-sharing preview

The optional `site.social` section in `src/content/site.yaml` controls the root page's Open Graph and Twitter/X metadata. `title` and `description` fall back to `site.defaultMetadata`; `image` and `imageAlt` are optional. Absolute `http`/`https` image URLs and relative public paths such as `/images/social/vehicle-share.jpg` are supported. Relative paths are resolved against `site.publicBaseUrl` before rendering.

The project-owned social-sharing asset is the local `public/images/vehicle/civic_hero-retouched.png`. Relative paths are resolved against `site.publicBaseUrl` before rendering, so Open Graph and Twitter/X metadata expose the deployed site origin rather than an external image host.
