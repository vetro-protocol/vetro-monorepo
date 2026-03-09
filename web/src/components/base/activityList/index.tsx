import { ActivityItem } from "./activityItem";
import type { Activity } from "./types";

type Props = {
  items: Activity[];
};

export const ActivityList = ({ items }: Props) => (
  <div className="flex flex-col">
    {items.map((item) => (
      <ActivityItem key={item.date} {...item} />
    ))}
  </div>
);
