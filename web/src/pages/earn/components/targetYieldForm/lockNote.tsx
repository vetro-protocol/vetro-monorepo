import { useEpochEndDate } from "pages/earn/hooks/targetYieldPool/useEpochEndDate";
import type { ReactNode } from "react";
import Skeleton from "react-loading-skeleton";
import type { Address } from "viem";

type Props = {
  getNote: (date: string) => string;
  lines: number;
  stakingVaultAddress: Address;
};

const LockNoteText = ({ children }: { children: ReactNode }) => (
  <p className="text-caption border-b border-gray-200 p-3 text-center whitespace-pre-line text-gray-500">
    {children}
  </p>
);

export function LockNote({ getNote, lines, stakingVaultAddress }: Props) {
  const { data: epochEndDate, isPending } =
    useEpochEndDate(stakingVaultAddress);

  if (epochEndDate) {
    return <LockNoteText>{getNote(epochEndDate)}</LockNoteText>;
  }
  return isPending ? (
    <LockNoteText>
      <Skeleton count={lines} width={200} />
    </LockNoteText>
  ) : null;
}
