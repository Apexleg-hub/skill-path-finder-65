export const SITE_URL = "https://corepointtech.com.ng";

export const toAbsoluteUrl = (path: string) => {
	const url = new URL(path, SITE_URL);
	if (url.protocol === "http:") url.protocol = "https:";
	return url.protocol === "https:" ? url.toString() : "";
};