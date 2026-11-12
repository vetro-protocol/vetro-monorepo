import type { FetchStatus } from "@tanstack/react-query";
import type { ReactNode } from "react";

type Props<TData> = {
  data: (data: TData) => ReactNode;
  error: ReactNode;
  idle?: ReactNode;
  loading: ReactNode;
  query: {
    data: TData | undefined;
    // Required so callers decide on purpose. Callers that cannot tell whether
    // the query fetches pass undefined, and then the idle state is never
    // rendered.
    fetchStatus: FetchStatus | undefined;
    isError: boolean;
  };
};

export function QueryResult<TData>({
  data,
  error,
  idle = error,
  loading,
  query,
}: Props<TData>) {
  if (query.data !== undefined) {
    return data(query.data);
  }
  if (query.isError) {
    return error;
  }
  // "idle" means the query is disabled, and "paused" that it waits for the
  // network: in both cases, the loading content would never end.
  if (query.fetchStatus === "idle" || query.fetchStatus === "paused") {
    return idle;
  }
  return loading;
}
