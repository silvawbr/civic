import assert from 'node:assert/strict';
import { loadContent, normalizeContent, readRawContent } from '../src/lib/content/index';
import type { RawContent } from '../src/lib/content/schema';

function expectValidationFailure(name: string, callback: () => unknown, expectedText: string) {
  assert.throws(callback, (error: unknown) => {
    assert.ok(error instanceof Error, `${name} should throw an Error`);
    assert.match(error.message, new RegExp(expectedText));
    return true;
  }, `${name} should reject invalid content`);
}

const normalized = loadContent();
const raw = readRawContent();

assert.equal(normalized.vehicle.make, 'Honda');
assert.equal(normalized.vehicle.price, 68000);
assert.equal(normalized.site.publicBaseUrl, 'https://civic-se.vercel.app');
assert.deepEqual(normalized.sections.map((section) => section.id), [
  'hero',
  'vehicle-details',
  'gallery',
  'maintenance',
  'transparency',
]);
assert.deepEqual(normalized.gallery.map((image) => image.id), ['front', 'rear']);
assert.deepEqual(normalized.maintenance.map((item) => item.id), ['tires']);

const missingOptionalValues = structuredClone(raw) as RawContent;
delete (missingOptionalValues.vehicle as Partial<RawContent['vehicle']>).version;
delete (missingOptionalValues.vehicle as Partial<RawContent['vehicle']>).engine;
delete (missingOptionalValues.maintenance.items[0] as Partial<RawContent['maintenance']['items'][number]>).date;
delete (missingOptionalValues.maintenance.items[0] as Partial<RawContent['maintenance']['items'][number]>).images;
const normalizedOptionalValues = normalizeContent(missingOptionalValues);
assert.equal(normalizedOptionalValues.vehicle.version, null);
assert.equal(normalizedOptionalValues.vehicle.engine, null);
assert.equal(normalizedOptionalValues.maintenance[0].date, null);
assert.deepEqual(normalizedOptionalValues.maintenance[0].images, []);

const invalidPrimitive = structuredClone(raw) as unknown as { vehicle: Record<string, unknown> };
invalidPrimitive.vehicle.price = 'sessenta e oito mil';
expectValidationFailure('invalid primitive', () => normalizeContent(invalidPrimitive), 'vehicle\\.price');

const unsupportedSection = structuredClone(raw) as unknown as {
  sections: { sections: Array<Record<string, unknown>> };
};
unsupportedSection.sections.sections[0] = { id: 'random-section-that-does-not-exist' };
expectValidationFailure('unsupported section', () => normalizeContent(unsupportedSection), 'sections\\.sections\\.0\\.id');

const invalidUrl = structuredClone(raw) as unknown as { links: { olx: Record<string, unknown> } };
invalidUrl.links.olx.url = 'not-a-url';
expectValidationFailure('invalid configured URL', () => normalizeContent(invalidUrl), 'links\\.olx\\.url');

const invalidPublicBaseUrl = structuredClone(raw) as unknown as { site: { publicBaseUrl: string } };
invalidPublicBaseUrl.site.publicBaseUrl = 'civic-se';
expectValidationFailure(
  'invalid public base URL',
  () => normalizeContent(invalidPublicBaseUrl),
  'site\\.publicBaseUrl',
);

const publicBaseUrlWithTrailingSlash = structuredClone(raw) as RawContent;
publicBaseUrlWithTrailingSlash.site.publicBaseUrl = 'https://civic-se.vercel.app/';
assert.equal(
  normalizeContent(publicBaseUrlWithTrailingSlash).site.publicBaseUrl,
  'https://civic-se.vercel.app',
);

console.log('Content validation checks passed.');
