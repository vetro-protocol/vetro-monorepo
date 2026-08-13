import { useTranslation } from "react-i18next";
import { unixNowTimestamp } from "utils/date";

import { useTerm } from "../../hooks/targetYieldPool/useTerm";
import { PoolInfoItem } from "../poolInfoBar/poolInfoItem";

import { getTermState } from "./getTermState";

export function PoolTermState() {
  const { t } = useTranslation();
  const { data: term, isError, isPending } = useTerm();

  function getLabel() {
    if (!term) {
      return undefined;
    }
    const state = getTermState({ ...term, now: BigInt(unixNowTimestamp()) });
    if (state === "open-to-deposits") {
      return t("pages.earn.fixed-term.open-to-deposits");
    }
    if (state === "open-to-exit") {
      return t("pages.earn.fixed-term.open-to-exit");
    }
    return undefined;
  }

  return (
    <PoolInfoItem
      data={getLabel()}
      isError={isError}
      isPending={isPending}
      label={t("pages.earn.fixed-term.term-state")}
    />
  );
}
