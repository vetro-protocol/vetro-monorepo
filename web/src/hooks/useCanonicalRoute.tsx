import { Navigate, useLocation, useParams } from "react-router";

export const useCanonicalRoute = function <T extends string>({
  basePath,
  value,
  values,
}: {
  basePath: string;
  value: string | undefined;
  values: T[];
}) {
  const { lang } = useParams<{ lang: string }>();
  const { hash, search } = useLocation();
  const canonicalValue =
    value &&
    values.find((candidate) => candidate.toLowerCase() === value.toLowerCase());

  if (!canonicalValue) {
    return {
      canonicalValue: undefined,
      redirect: <Navigate replace to={`/${lang}/not-found`} />,
    } as const;
  }

  if (value !== canonicalValue) {
    return {
      canonicalValue,
      redirect: (
        <Navigate
          replace
          to={`/${lang}/${basePath}/${canonicalValue}${search}${hash}`}
        />
      ),
    } as const;
  }

  return { canonicalValue, redirect: null } as const;
};
