export { ContentValidationError, loadContent, normalizeContent, readRawContent } from './loader';
export type {
  GalleryConfig,
  HeroConfig,
  LinksConfig,
  MaintenanceConfig,
  RawContent,
  SectionsConfig,
  SiteConfig,
  SiteContent,
  VehicleConfig,
} from './schema';

import { loadContent } from './loader';

export const content = loadContent();
