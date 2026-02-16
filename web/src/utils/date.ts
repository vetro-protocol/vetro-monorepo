export const formatDate = (timestamp: number | string, language: string) =>
  new Intl.DateTimeFormat(language, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(
    new Date(
      typeof timestamp === "string"
        ? Number(timestamp) * 1000
        : timestamp * 1000,
    ),
  );
