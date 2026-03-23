import { ActivityItem } from "./activityItem";
import { ActivityListEmptyState } from "./activityListEmptyState";
import type { Activity } from "./types";

type Props = {
  className?: string;
  hasTransactions: boolean;
  items: (Activity & { href?: string })[];
  onResetFilters: VoidFunction;
};

export const ActivityList = ({
  className,
  hasTransactions,
  items,
  onResetFilters,
}: Props) =>
  items.length > 0 ? (
    <div className={`flex flex-col ${className}`}>
      {items.map((item) => (
        <ActivityItem key={item.txHash} {...item} />
      ))}
    </div>
  ) : (
    <ActivityListEmptyState
      hasTransactions={hasTransactions}
      onResetFilters={onResetFilters}
    />
  );
