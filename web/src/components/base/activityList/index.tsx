import { ActivityItem } from "./activityItem";
import { ActivityListEmptyState } from "./activityListEmptyState";
import type { Activity } from "./types";

type Props = {
  hasTransactions: boolean;
  items: (Activity & { href?: string })[];
  onResetFilters: VoidFunction;
};

export const ActivityList = ({
  hasTransactions,
  items,
  onResetFilters,
}: Props) =>
  items.length > 0 ? (
    <>
      <div className="absolute inset-0 overflow-y-auto px-4 pt-6 md:px-6">
        <div className="flex flex-col pb-6">
          {items.map((item) => (
            <ActivityItem key={item.txHash} {...item} />
          ))}
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-9 bg-linear-to-b from-transparent to-gray-50 to-80%" />
    </>
  ) : (
    <ActivityListEmptyState
      hasTransactions={hasTransactions}
      onResetFilters={onResetFilters}
    />
  );
