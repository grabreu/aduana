import type { Params } from "./types";

export const joinUrl = (baseURL: string, path: string): string => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  if (!baseURL) {
    return path.startsWith("/") ? path : `/${path}`;
  }
  const trimmedBase = baseURL.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
};

export const buildQuery = (params?: Params): string => {
  if (!params) {
    return "";
  }
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === undefined || item === null) {
          continue;
        }
        usp.append(key, String(item));
      }
    } else {
      usp.append(key, String(value));
    }
  }

  return usp.toString();
};

export const buildUrl = (
  url: string,
  baseURL?: string,
  params?: Params,
): string => {
  const full = joinUrl(baseURL ?? "", url);
  const query = buildQuery(params);
  if (!query) {
    return full;
  }
  return full + (full.includes("?") ? "&" : "?") + query;
};
