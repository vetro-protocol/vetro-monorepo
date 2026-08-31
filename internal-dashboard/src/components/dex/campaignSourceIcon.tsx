import { type CampaignSource } from "../../config/campaignSources";
import { MerklIcon } from "../icons/merklIcon";
import { StakeDaoIcon } from "../icons/stakeDaoIcon";

const icons = {
  merkl: MerklIcon,
  stakeDao: StakeDaoIcon,
} satisfies Record<CampaignSource, unknown>;

export const CampaignSourceIcon = function ({
  size,
  source,
}: {
  size?: number;
  source: CampaignSource;
}) {
  const Icon = icons[source];
  return <Icon size={size} />;
};
