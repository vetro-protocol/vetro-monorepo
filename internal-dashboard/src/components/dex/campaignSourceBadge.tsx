import { type ReactNode } from "react";

import { type CampaignSource } from "../../config/campaignSources";

import { CampaignSourceIcon } from "./campaignSourceIcon";

const styles: Record<CampaignSource, string> = {
  merkl: "bg-[#7653ff]/10 text-[#614acc] ring-[#7653ff]/20",
  stakeDao: "bg-neutral-100 text-neutral-700 ring-neutral-600/20",
};

export const CampaignSourceBadge = ({
  children,
  source,
}: {
  children?: ReactNode;
  source: CampaignSource;
}) => (
  <span
    className={`inline-flex shrink-0 items-center gap-x-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[source]}`}
  >
    <CampaignSourceIcon source={source} />
    {children}
  </span>
);
