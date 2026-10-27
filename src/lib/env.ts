/** Public base URL of the app, without a trailing slash */
export function appUrl(fallbackOrigin?: string): string {
  const url = process.env.APP_URL?.trim().replace(/\/+$/, "");
  if (url) return url;
  if (fallbackOrigin) return fallbackOrigin;
  throw new Error("APP_URL is not set");
}

export function appHost(fallbackOrigin?: string): string {
  return new URL(appUrl(fallbackOrigin)).host.toLowerCase();
}

export function shortUrl(code: string, fallbackOrigin?: string): string {
  return `${appUrl(fallbackOrigin)}/${code}`;
}
