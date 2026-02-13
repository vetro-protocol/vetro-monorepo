import { originGlobToRegExp } from "./origin-glob-to-regexp.ts";

export const parseOrigins = (origins: string): (string | RegExp)[] =>
  origins.split(",").map((o) => (/\*/.test(o) ? originGlobToRegExp(o) : o));

export const createOriginFn = (allowedOrigins: (string | RegExp)[]) =>
  function (requestOrigin: string): string | null {
    for (const origin of allowedOrigins) {
      if (typeof origin === "string" && origin === requestOrigin) {
        return requestOrigin;
      }
      if (origin instanceof RegExp && origin.test(requestOrigin)) {
        return requestOrigin;
      }
    }
    return null;
  };
