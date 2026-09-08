export const SECONDS_PER_DAY = 86400;

export const unixNowTimestamp = () => Math.floor(Date.now() / 1000);

const toDate = (timestamp: number | string) =>
  new Date(
    typeof timestamp === "string" ? Number(timestamp) * 1000 : timestamp * 1000,
  );

const dateFormatter =
  (options: Intl.DateTimeFormatOptions) =>
  (timestamp: number | string, language: string, timeZone?: string) =>
    new Intl.DateTimeFormat(language, { ...options, timeZone }).format(
      toDate(timestamp),
    );

export const formatDate = dateFormatter({
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const formatMediumDate = dateFormatter({
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatShortDate = dateFormatter({
  day: "numeric",
  month: "short",
});
