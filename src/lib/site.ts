export const SITE_URL = "https://corepointtech.com.ng";

export const toAbsoluteUrl = (path: string) => new URL(path, SITE_URL).toString();