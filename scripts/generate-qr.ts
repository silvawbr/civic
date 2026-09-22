import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { loadContent } from '../src/lib/content/index';
import { publicUrl, VEHICLE_QR_PATH } from '../src/lib/site-url';

const rootDirectory = process.cwd();
const outputPath = join(rootDirectory, 'public/qr/vehicle-sale.svg');
const errorCorrectionLevel = 'H' as const;
const qrOptions = {
  type: 'svg' as const,
  errorCorrectionLevel,
  margin: 4,
  color: {
    dark: '#000000',
    light: '#ffffff',
  },
};

const content = loadContent();
const payload = publicUrl(content.site.publicBaseUrl, VEHICLE_QR_PATH);
const svg = await QRCode.toString(payload, qrOptions);

mkdirSync(join(rootDirectory, 'public/qr'), { recursive: true });
writeFileSync(outputPath, svg, 'utf8');

// Re-encode the exact configured payload and compare bytes so a generated asset
// cannot silently drift from the permanent QR destination.
const expectedSvg = await QRCode.toString(payload, qrOptions);
const generatedSvg = readFileSync(outputPath, 'utf8');
assert.equal(generatedSvg, expectedSvg, 'generated QR SVG does not match the configured payload');
assert.match(generatedSvg, /<path fill="#ffffff" d="M0 0h\d+v\d+H0z"\/>/);
assert.match(generatedSvg, /<path stroke="#000000"/);

console.log(`Generated ${outputPath}`);
console.log(`Payload: ${payload}`);
console.log(`Error correction: ${errorCorrectionLevel}; quiet zone: ${qrOptions.margin} modules`);
console.log('QR payload verification passed (deterministic SVG re-encoding).');
