import { ActivityItem } from "./activityItem";
import { ActivityListEmptyState } from "./activityListEmptyState";
import type { Activity } from "./types";

type Props = {
  items: (Activity & { href?: string })[];
  onResetFilters: VoidFunction;
};

export const ActivityList = ({ items, onResetFilters }: Props) =>
  items.length > 0 ? (
    <div className="flex flex-col">
      {items.map((item) => (
        <ActivityItem key={item.txHash} {...item} />
      ))}
    </div>
  ) : (
    <ActivityListEmptyState onResetFilters={onResetFilters} />
  );
