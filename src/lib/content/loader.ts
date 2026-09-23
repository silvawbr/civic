import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { $ZodIssue } from 'zod/v4/core';
import { publicUrl } from '../site-url';
import {
  GalleryConfigSchema,
  LinksConfigSchema,
  MaintenanceConfigSchema,
  RawContentSchema,
  SectionsConfigSchema,
  SiteConfigSchema,
  TransparencyConfigSchema,
  VehicleConfigSchema,
  type RawContent,
  type SocialMetadata,
  type SiteContent,
} from './schema';

const contentDirectory = join(process.cwd(), 'src/content');

const contentFiles = [
  { key: 'site', filename: 'site.yaml', schema: SiteConfigSchema },
  { key: 'vehicle', filename: 'vehicle.yaml', schema: VehicleConfigSchema },
  { key: 'sections', filename: 'sections.yaml', schema: SectionsConfigSchema },
  { key: 'gallery', filename: 'gallery.yaml', schema: GalleryConfigSchema },
  { key: 'maintenance', filename: 'maintenance.yaml', schema: MaintenanceConfigSchema },
  { key: 'transparency', filename: 'transparency.yaml', schema: TransparencyConfigSchema },
  { key: 'links', filename: 'links.yaml', schema: LinksConfigSchema },
] as const;

export class ContentValidationError extends Error {
  constructor(source: string, issues: $ZodIssue[]) {
    const details = issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'configuration';
      return `- ${path}: ${issue.message}`;
    });

    super(`Invalid content configuration in ${source}:\n${details.join('\n')}`);
    this.name = 'ContentValidationError';
  }
}

function readYamlFile(filename: string): unknown {
  const path = join(contentDirectory, filename);

  if (!existsSync(path)) {
    throw new Error(`Missing content configuration file: ${path}`);
  }

  try {
    return parse(readFileSync(path, 'utf8'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid YAML in ${path}: ${message}`);
  }
}

export function readRawContent(): RawContent {
  const raw = {} as Record<keyof RawContent, unknown>;

  for (const file of contentFiles) {
    const result = file.schema.safeParse(readYamlFile(file.filename));
    if (!result.success) {
      throw new ContentValidationError(`src/content/${file.filename}`, result.error.issues);
    }
    raw[file.key] = result.data;
  }

  return RawContentSchema.parse(raw);
}

export function normalizeContent(raw: unknown, source = 'content configuration'): SiteContent {
  const result = RawContentSchema.safeParse(raw);
  if (!result.success) {
    throw new ContentValidationError(source, result.error.issues);
  }

  const sortByOrder = <T extends { order: number; id: string }>(items: T[]): T[] =>
    [...items].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));

  const social: SocialMetadata = {
    title: result.data.site.social.title ?? result.data.site.defaultMetadata.title,
    description: result.data.site.social.description ?? result.data.site.defaultMetadata.description,
    image: result.data.site.social.image
      ? publicUrl(result.data.site.publicBaseUrl, result.data.site.social.image)
      : null,
    imageAlt: result.data.site.social.imageAlt,
  };

  return {
    site: result.data.site,
    social,
    vehicle: result.data.vehicle,
    sections: sortByOrder(result.data.sections.sections),
    hero: result.data.sections.hero,
    gallery: sortByOrder(result.data.gallery.images),
    maintenance: sortByOrder(result.data.maintenance.items),
    transparency: {
      ...result.data.transparency,
      items: sortByOrder(result.data.transparency.items),
    },
    links: result.data.links,
  };
}

export function loadContent(): SiteContent {
  return normalizeContent(readRawContent());
}
