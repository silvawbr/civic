import { z } from 'zod';

const nullableText = z.string().trim().min(1).nullable().optional().default(null);
const nullableInteger = z.number().int().nonnegative().nullable().optional().default(null);
const localImagePath = z
  .string()
  .trim()
  .min(1)
  .regex(/^\/images\/(vehicle|maintenance)\/[^/?#]+$/, 'must be a local image path under /images/vehicle or /images/maintenance');

const publicBaseUrl = z
  .string()
  .trim()
  .url()
  .superRefine((value, context) => {
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must use the http or https protocol',
      });
    }

    if (parsed.username || parsed.password || parsed.search || parsed.hash) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be a public origin without credentials, query parameters, or a fragment',
      });
    }

    if (parsed.pathname !== '/') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must not include a path beyond the origin',
      });
    }
  })
  .transform((value) => value.replace(/\/$/, ''));

export const SiteConfigSchema = z
  .object({
    title: z.string().trim().min(1),
    language: z.string().trim().regex(/^[a-z]{2}-[A-Z]{2}$/, 'must be a BCP 47 language tag such as pt-BR'),
    publicBaseUrl,
    defaultMetadata: z
      .object({
        title: z.string().trim().min(1),
        description: z.string().trim().min(1),
      })
      .strict(),
    location: z.string().trim().min(1),
    description: nullableText,
  })
  .strict();

export const VehicleConfigSchema = z
  .object({
    make: z.string().trim().min(1),
    model: z.string().trim().min(1),
    version: nullableText,
    year: z
      .object({
        manufacture: z.number().int().min(1886).max(2100),
        model: z.number().int().min(1886).max(2100),
      })
      .strict(),
    price: z.number().finite().nonnegative(),
    mileageKm: z.number().int().nonnegative(),
    location: z.string().trim().min(1),
    engine: nullableText,
    transmission: nullableText,
    fuel: nullableText,
    color: nullableText,
  })
  .strict();

const sectionId = z.enum(['hero', 'vehicle-details', 'gallery', 'maintenance', 'transparency']);

const sectionEntry = z
  .object({
    id: sectionId,
    enabled: z.boolean().default(true),
    order: z.number().int().nonnegative(),
  })
  .strict();

export const HeroConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    showPrice: z.boolean().default(true),
    showMileage: z.boolean().default(true),
    showYear: z.boolean().default(true),
    showLocation: z.boolean().default(true),
    showWhatsappButton: z.boolean().default(false),
    primaryImage: localImagePath.nullable().optional().default(null),
  })
  .strict();

export const SectionsConfigSchema = z
  .object({
    sections: z.array(sectionEntry).min(1),
    hero: HeroConfigSchema,
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.sections.forEach((section, index) => {
      if (seen.has(section.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['sections', index, 'id'],
          message: `duplicate section id "${section.id}"`,
        });
      }
      seen.add(section.id);
    });
  });

const galleryEntry = z
  .object({
    id: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a stable kebab-case identifier'),
    src: localImagePath,
    alt: z.string().trim().min(1),
    enabled: z.boolean().default(true),
    order: z.number().int().nonnegative(),
  })
  .strict();

export const GalleryConfigSchema = z
  .object({
    images: z.array(galleryEntry),
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.images.forEach((image, index) => {
      if (seen.has(image.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['images', index, 'id'],
          message: `duplicate gallery image id "${image.id}"`,
        });
      }
      seen.add(image.id);
    });
  });

const maintenanceEntry = z
  .object({
    id: z.string().trim().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be a stable kebab-case identifier'),
    enabled: z.boolean().default(true),
    order: z.number().int().nonnegative(),
    title: z.string().trim().min(1),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'must use YYYY-MM-DD format')
      .nullable()
      .optional()
      .default(null),
    mileageKm: nullableInteger,
    description: nullableText,
    details: z.array(z.string().trim().min(1)).optional().default([]),
    images: z.array(localImagePath).optional().default([]),
  })
  .strict();

export const MaintenanceConfigSchema = z
  .object({
    items: z.array(maintenanceEntry),
  })
  .strict()
  .superRefine((value, context) => {
    const seen = new Set<string>();
    value.items.forEach((item, index) => {
      if (seen.has(item.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['items', index, 'id'],
          message: `duplicate maintenance item id "${item.id}"`,
        });
      }
      seen.add(item.id);
    });
  });

const externalLink = z
  .object({
    enabled: z.boolean().default(false),
    url: z.string().url().nullable().optional().default(null),
  })
  .strict();

export const LinksConfigSchema = z
  .object({
    whatsapp: externalLink.extend({
      message: z.string().trim().min(1),
    }),
    olx: externalLink,
    webmotors: externalLink,
  })
  .strict()
  .superRefine((value, context) => {
    for (const [name, link] of Object.entries(value)) {
      if (link.enabled && link.url === null) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [name, 'url'],
          message: 'is required when this link is enabled',
        });
      }
    }
  });

export const RawContentSchema = z
  .object({
    site: SiteConfigSchema,
    vehicle: VehicleConfigSchema,
    sections: SectionsConfigSchema,
    gallery: GalleryConfigSchema,
    maintenance: MaintenanceConfigSchema,
    links: LinksConfigSchema,
  })
  .strict();

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type VehicleConfig = z.infer<typeof VehicleConfigSchema>;
export type SectionsConfig = z.infer<typeof SectionsConfigSchema>;
export type GalleryConfig = z.infer<typeof GalleryConfigSchema>;
export type MaintenanceConfig = z.infer<typeof MaintenanceConfigSchema>;
export type LinksConfig = z.infer<typeof LinksConfigSchema>;
export type RawContent = z.infer<typeof RawContentSchema>;
export type HeroConfig = z.infer<typeof HeroConfigSchema>;

export type SiteContent = {
  site: SiteConfig;
  vehicle: VehicleConfig;
  sections: SectionsConfig['sections'];
  hero: SectionsConfig['hero'];
  gallery: GalleryConfig['images'];
  maintenance: MaintenanceConfig['items'];
  links: LinksConfig;
};
