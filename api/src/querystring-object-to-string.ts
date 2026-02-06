export const queryStringObjectToString = function (
  queryString: Record<string, string> = {},
) {
  const stringified = new URLSearchParams(queryString).toString();
  return stringified ? `?${stringified}` : "";
};
