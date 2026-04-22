export const SECONDS_PER_DAY = 86400;

export const unixNowTimestamp = () => Math.floor(Date.now() / 1000);

const toDate = (timestamp: number | string) =>
  new Date(
    typeof timestamp === "string" ? Number(timestamp) * 1000 : timestamp * 1000,
  );

export const formatDate = (timestamp: number | string, language: string) =>
  new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(toDate(timestamp));

export const formatShortDate = (timestamp: number | string, language: string) =>
  new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
  }).format(toDate(timestamp));
