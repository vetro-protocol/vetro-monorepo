import Skeleton from "react-loading-skeleton";

export const TokenSelectorSkeleton = () => (
  <div className="flex items-center gap-1.5 rounded-full bg-white/5 py-1.5 pr-3 pl-1.5 leading-none shadow-sm">
    <Skeleton circle height={20} width={20} />
    <Skeleton height={14} width={40} />
  </div>
);
