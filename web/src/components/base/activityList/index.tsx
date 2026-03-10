import { ActivityItem } from "./activityItem";
import type { Activity } from "./types";

type Props = {
  items: (Activity & { href?: string })[];
};

export const ActivityList = ({ items }: Props) => (
  <div className="flex flex-col">
    {items.map((item) => (
      <ActivityItem key={item.id} {...item} />
    ))}
  </div>
);
