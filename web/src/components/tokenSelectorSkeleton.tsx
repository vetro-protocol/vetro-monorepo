import Skeleton from "react-loading-skeleton";

export const TokenSelectorSkeleton = () => (
  <div className="flex items-center gap-1.5 rounded-full bg-white/5 p-1.5 pr-2 leading-none shadow-sm">
    <Skeleton circle height={20} width={20} />
    <Skeleton height={14} width={40} />
  </div>
);
