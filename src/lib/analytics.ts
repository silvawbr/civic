import { track } from '@vercel/analytics';

export const TRAFFIC_SOURCES = ['car_qr', 'olx', 'webmotors', 'instagram', 'direct/share'] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

type AnalyticsEvent = {
  type: 'pageview' | 'event';
  url: string;
};

const FALLBACK_SOURCE: TrafficSource = 'direct/share';
const SOURCE_PARAMETER = 'utm_source';
const CONVERSION_EVENTS: Record<string, string> = {
  whatsapp: 'click_whatsapp',
  olx: 'click_olx',
  webmotors: 'click_webmotors',
};

export function normalizeTrafficSource(value: string | null): TrafficSource {
  switch (value?.trim().toLowerCase()) {
    case 'car_qr':
      return 'car_qr';
    case 'olx':
      return 'olx';
    case 'webmotors':
      return 'webmotors';
    case 'instagram':
      return 'instagram';
    default:
      return FALLBACK_SOURCE;
  }
}

function currentTrafficSource(): TrafficSource {
  if (typeof window === 'undefined') {
    return FALLBACK_SOURCE;
  }

  return normalizeTrafficSource(new URL(window.location.href).searchParams.get(SOURCE_PARAMETER));
}

/**
 * Keeps provider page-view and event URLs limited to the controlled attribution contract.
 */
export function sanitizeAnalyticsEvent(event: AnalyticsEvent): AnalyticsEvent {
  if (typeof window === 'undefined') {
    return event;
  }

  try {
    const url = new URL(event.url, window.location.origin);
    const source = normalizeTrafficSource(url.searchParams.get(SOURCE_PARAMETER));

    url.search = source === FALLBACK_SOURCE ? '' : `${SOURCE_PARAMETER}=${encodeURIComponent(source)}`;

    return { ...event, url: url.toString() };
  } catch {
    return event;
  }
}

export function trackConversion(action: string): void {
  const eventName = CONVERSION_EVENTS[action];

  if (!eventName || typeof window === 'undefined') {
    return;
  }

  try {
    track(eventName, { source: currentTrafficSource() });
  } catch {
    // Analytics is best-effort; conversion navigation must never depend on it.
  }
}
