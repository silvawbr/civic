export const VEHICLE_QR_PATH = '/q';

export function publicUrl(baseUrl: string, path = '/'): string {
  return new URL(path, `${baseUrl}/`).toString();
}
