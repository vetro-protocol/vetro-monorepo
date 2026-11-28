import type { DexPool } from "@vetro-protocol/core";
import { FilterMenu } from "components/base/filterMenu";
import { FunnelIcon } from "components/icons/funnelIcon";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { getFilterOptions, type PoolFilters } from "../utils";

const onlyWithCampaignsValue = "only-with-campaigns";

type Props = {
  filters: PoolFilters;
  onChange: (filters: PoolFilters) => void;
  pools: DexPool[];
};

export function PoolsFilterMenu({ filters, onChange, pools }: Props) {
  const { t } = useTranslation();
  const { chains, tokens, venues } = useMemo(
    () => getFilterOptions(pools),
    [pools],
  );

  const optionValues = [...chains, ...tokens, ...venues].map(
    (option) => option.value,
  );
  const selectedValues = optionValues.filter(
    (value) => !filters.unselectedValues.includes(value),
  );
  if (filters.onlyWithCampaigns) {
    selectedValues.push(onlyWithCampaignsValue);
  }

  function handleChange(values: string[]) {
    onChange({
      onlyWithCampaigns: values.includes(onlyWithCampaignsValue),
      unselectedValues: optionValues.filter((value) => !values.includes(value)),
    });
  }

  return (
    <FilterMenu
      icon={<FunnelIcon className="text-gray-500" />}
      label={t("pages.liquidity.filters")}
      onChange={handleChange}
      sections={[
        { label: t("pages.liquidity.chain"), options: chains },
        { label: t("pages.liquidity.token"), options: tokens },
        { label: t("pages.liquidity.venue"), options: venues },
        {
          label: t("pages.liquidity.rewards"),
          options: [
            {
              label: t("pages.liquidity.only-with-campaigns"),
              value: onlyWithCampaignsValue,
            },
          ],
        },
      ]}
      selectedValues={selectedValues}
    />
  );
}
