import { type ReactNode } from "react";
import { type Address } from "viem";

import { ExplorerLink } from "../components/dex/explorerLink";
import { StateMessage } from "../components/dex/stateMessage";
import { CooldownStatusBadge } from "../components/earnAgent/cooldownStatusBadge";
import { CooldownTable } from "../components/earnAgent/cooldownTable";
import { earnAgentAddress } from "../config/earnAgent";
import { useEarnAgentStatus } from "../hooks/useEarnAgentStatus";
import { summarizeCooldown } from "../lib/cooldownSummary";

const AddressRow = ({
  address,
  label,
  method,
}: {
  address: Address | undefined;
  label: string;
  method?: string;
}) => (
  <div className="flex items-center justify-between gap-x-4 py-2 text-sm">
    <span className="flex items-center gap-x-2 text-neutral-600">
      {label}
      {method ? <code className="text-neutral-400">{method}</code> : null}
    </span>
    {address ? (
      <ExplorerLink address={address} />
    ) : (
      <span className="text-neutral-400">—</span>
    )}
  </div>
);

const Section = ({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  title: ReactNode;
}) => (
  <div>
    <h3 className="flex items-center gap-x-2 text-lg font-semibold text-neutral-950">
      {title}
    </h3>
    {description ? (
      <p className="mt-1 text-sm text-neutral-600">{description}</p>
    ) : null}
    <div className="mt-4">{children}</div>
  </div>
);

export const EarnAgentPage = function () {
  const { data, status } = useEarnAgentStatus();
  const nowSeconds = Math.floor(Date.now() / 1000);

  return (
    <section className="flex flex-col gap-y-10">
      <header>
        <h2 className="text-2xl font-semibold text-neutral-950">Hemi Earn</h2>
        <p className="mt-1 text-sm font-medium text-neutral-600">
          Health of the Hemi Earn agent — the Ethereum executor that processes
          cross-chain deposits &amp; redeems bridged from Hemi into the Vetro
          Earn vaults.
        </p>
        <div className="mt-3 divide-y divide-neutral-100">
          <AddressRow address={earnAgentAddress} label="Agent address" />
        </div>
      </header>

      {status === "pending" ? (
        <StateMessage>Loading agent state…</StateMessage>
      ) : null}
      {status === "error" ? (
        <StateMessage>
          Couldn&apos;t load agent state. Try again later.
        </StateMessage>
      ) : null}

      {status === "success" ? (
        <>
          <Section title="Authorized keepers">
            {data.keepers.length === 0 ? (
              <p className="text-sm text-neutral-600">No keepers authorized.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {data.keepers.map((keeper, index) => (
                  <AddressRow
                    address={keeper}
                    key={keeper}
                    label={`Keeper ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title="Ownership & implementation">
            <div className="divide-y divide-neutral-100">
              <AddressRow address={data.owner} label="Owner" method="owner()" />
              <AddressRow
                address={data.pendingOwner}
                label="Pending owner"
                method="pendingOwner()"
              />
              <AddressRow
                address={data.implementation}
                label="Implementation"
              />
              <AddressRow address={data.proxyAdmin} label="Proxy admin" />
            </div>
          </Section>

          <Section
            description={
              <>
                The agent&apos;s unstake requests in each vault —{" "}
                <code>getPendingRequests(agent)</code>.
              </>
            }
            title={
              <>
                Vault cooldown position
                {data.vaults.some(
                  (vault) =>
                    summarizeCooldown({ nowSeconds, requests: vault.requests })
                      .isKeeperBehind,
                ) ? (
                  <CooldownStatusBadge isBehind />
                ) : null}
              </>
            }
          >
            <CooldownTable nowSeconds={nowSeconds} vaults={data.vaults} />
          </Section>
        </>
      ) : null}
    </section>
  );
};
