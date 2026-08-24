import {
  emptyPoolFilters,
  hasActiveFilters,
  type PoolFilterState,
} from "../../lib/poolFilters";
import { MultiSelect, type MultiSelectOption } from "../multiSelect";
import { Tooltip } from "../tooltip";

type Props = {
  campaignsDisabled: boolean;
  error?: Error | null;
  filters: PoolFilterState;
  onChange: (filters: PoolFilterState) => void;
  trackedTokenOptions: MultiSelectOption[];
  whitelistedTokenOptions: MultiSelectOption[];
};

export const PoolFilters = ({
  campaignsDisabled,
  error,
  filters,
  onChange,
  trackedTokenOptions,
  whitelistedTokenOptions,
}: Props) => (
  <div className="mb-3 flex flex-wrap items-center gap-2">
    <MultiSelect
      label="Vetro tokens"
      onChange={(trackedTokens) => onChange({ ...filters, trackedTokens })}
      options={trackedTokenOptions}
      values={filters.trackedTokens}
    />
    <MultiSelect
      label="Whitelisted Tokens"
      onChange={(whitelistedTokens) =>
        onChange({ ...filters, whitelistedTokens })
      }
      options={whitelistedTokenOptions}
      values={filters.whitelistedTokens}
    />
    <label className="flex cursor-pointer items-center gap-x-2 rounded-md border border-solid border-neutral-300/55 bg-white px-2 py-1 text-sm font-medium text-neutral-600 shadow-xs hover:text-neutral-950 has-disabled:cursor-not-allowed has-disabled:opacity-50">
      <input
        checked={filters.campaignsOnly}
        className="size-4 accent-neutral-900"
        disabled={campaignsDisabled}
        onChange={(event) =>
          onChange({ ...filters, campaignsOnly: event.target.checked })
        }
        type="checkbox"
      />
      Campaigns only
    </label>
    {hasActiveFilters(filters) ? (
      <button
        className="cursor-pointer px-2 py-1 text-sm font-medium text-neutral-600 hover:text-neutral-950"
        onClick={() => onChange(emptyPoolFilters)}
        type="button"
      >
        Clear all
      </button>
    ) : null}
    {error ? (
      <Tooltip label={error.message}>
        <span className="text-sm font-medium text-neutral-400">
          Some filters unavailable
        </span>
      </Tooltip>
    ) : null}
  </div>
);
