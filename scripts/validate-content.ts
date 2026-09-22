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
assert.equal(normalized.social.title, 'Honda Civic 2014/2014 à venda');
assert.equal(normalized.social.description, 'Veja fotos, informações e detalhes deste Honda Civic à venda em Grande Aracaju/SE.');
assert.equal(
  normalized.social.image,
  'https://s3.amazonaws.com/altimus2.arquivos.prod/d35aca4c-3a76-48b0-8dcb-4334c5f4f73e/fotos/veiculo/ab1b5335ea1540c7a381bf4b512af5f9_1780921220209.jpg',
);
assert.equal(normalized.social.imageAlt, 'Honda Civic 2014/2014 à venda');
assert.deepEqual(normalized.sections.map((section) => section.id), [
  'hero',
  'vehicle-details',
  'gallery',
  'maintenance',
  'transparency',
]);
assert.deepEqual(normalized.gallery.map((image) => image.id), [
  'front-opposite-angle',
  'rear-three-quarter',
  'rear-opposite-side',
  'rear-straight',
  'driver-dashboard',
  'passenger-cabin',
  'rear-seats',
  'trunk',
]);
assert.deepEqual(normalized.gallery.map((image) => image.src), [
  '/images/vehicle/civic_153424.jpg',
  '/images/vehicle/civic_153258.jpg',
  '/images/vehicle/civic_153240.jpg',
  '/images/vehicle/civic_153225.jpg',
  '/images/vehicle/civic_155222.jpg',
  '/images/vehicle/civic_155334.jpg',
  '/images/vehicle/civic_155233.jpg',
  '/images/vehicle/civic_155252.jpg',
]);
assert.ok(normalized.gallery.every((image) => image.src.startsWith('/images/vehicle/')));
assert.ok(normalized.gallery.every((image) => image.width > 0 && image.height > 0));
assert.deepEqual(normalized.maintenance.map((item) => item.id), ['tires']);
assert.equal(normalized.maintenance[0].category, 'tires');
assert.equal(normalized.maintenance[0].imageAlt, null);

const maintenanceScenarios = structuredClone(raw) as RawContent;
maintenanceScenarios.maintenance.items = [
  {
    id: 'battery',
    enabled: true,
    order: 20,
    title: 'Bateria',
    category: 'battery',
    date: '2026-09-01',
    mileageKm: 147000,
    description: 'Bateria substituída.',
    details: ['Registro sanitizado.'],
    imageAlt: 'Etiqueta da bateria instalada',
    images: ['/images/maintenance/battery.jpg'],
  },
  {
    id: 'bodywork',
    enabled: true,
    order: 10,
    title: 'Tratamento de corrosão',
    category: null,
    date: null,
    mileageKm: null,
    description: 'Tratamento de pontos de corrosão.',
    details: [],
    imageAlt: null,
    images: [],
  },
  {
    id: 'oil-change',
    enabled: false,
    order: 30,
    title: 'Troca de óleo',
    category: 'oil',
    date: null,
    mileageKm: null,
    description: null,
    details: [],
    imageAlt: null,
    images: [],
  },
];

const normalizedMaintenanceScenarios = normalizeContent(maintenanceScenarios);
assert.deepEqual(normalizedMaintenanceScenarios.maintenance.map((item) => item.id), [
  'bodywork',
  'battery',
  'oil-change',
]);
assert.equal(normalizedMaintenanceScenarios.maintenance[1].images[0], '/images/maintenance/battery.jpg');
assert.equal(normalizedMaintenanceScenarios.maintenance[2].enabled, false);
assert.equal(normalizedMaintenanceScenarios.maintenance.filter((item) => item.enabled).length, 2);

const noEnabledMaintenance = structuredClone(maintenanceScenarios) as RawContent;
noEnabledMaintenance.maintenance.items.forEach((item) => {
  item.enabled = false;
});
assert.equal(normalizeContent(noEnabledMaintenance).maintenance.filter((item) => item.enabled).length, 0);

const maintenanceImageInGallery = structuredClone(raw) as RawContent;
maintenanceImageInGallery.gallery.images[0].src = '/images/maintenance/oil-change.jpg';
expectValidationFailure(
  'maintenance image in main gallery',
  () => normalizeContent(maintenanceImageInGallery),
  'gallery\.images\.0\.src',
);

const maintenanceImageInVehicleDirectory = structuredClone(raw) as RawContent;
maintenanceImageInVehicleDirectory.maintenance.items[0].images = ['/images/vehicle/civic_153424.jpg'];
expectValidationFailure(
  'vehicle image in maintenance evidence',
  () => normalizeContent(maintenanceImageInVehicleDirectory),
  'maintenance\.items\.0\.images\.0',
);

const validMaintenanceImage = structuredClone(raw) as RawContent;
validMaintenanceImage.maintenance.items[0].images = ['/images/maintenance/oil-change.jpg'];
assert.deepEqual(normalizeContent(validMaintenanceImage).maintenance[0].images, [
  '/images/maintenance/oil-change.jpg',
]);

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

const missingSocial = structuredClone(raw) as RawContent;
delete (missingSocial.site as Partial<RawContent['site']>).social;
const normalizedMissingSocial = normalizeContent(missingSocial);
assert.equal(normalizedMissingSocial.social.title, raw.site.defaultMetadata.title);
assert.equal(normalizedMissingSocial.social.description, raw.site.defaultMetadata.description);
assert.equal(normalizedMissingSocial.social.image, null);
assert.equal(normalizedMissingSocial.social.imageAlt, null);

const missingSocialImage = structuredClone(raw) as RawContent;
delete (missingSocialImage.site.social as Partial<RawContent['site']['social']>).image;
assert.equal(normalizeContent(missingSocialImage).social.image, null);

const relativeSocialImage = structuredClone(raw) as RawContent;
relativeSocialImage.site.social.image = '/images/social/vehicle-share.jpg';
assert.equal(
  normalizeContent(relativeSocialImage).social.image,
  'https://civic-se.vercel.app/images/social/vehicle-share.jpg',
);

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

const invalidSocialImage = structuredClone(raw) as unknown as { site: { social: { image: string } } };
invalidSocialImage.site.social.image = 'not-a-social-image-url';
expectValidationFailure(
  'invalid social image URL',
  () => normalizeContent(invalidSocialImage),
  'site\\.social\\.image',
);

const invalidProtocolSocialImage = structuredClone(raw) as unknown as { site: { social: { image: string } } };
invalidProtocolSocialImage.site.social.image = 'ftp://example.com/image.jpg';
expectValidationFailure(
  'invalid social image protocol',
  () => normalizeContent(invalidProtocolSocialImage),
  'site\\.social\\.image',
);

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
