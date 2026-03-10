import { useSyncExternalStore } from "react";
import type { Address, Chain } from "viem";

import type { Activity } from "../components/base/activityList/types";

const storageKeyPrefix = "vetro:activities:";
const subscribers = new Set<() => void>();
const cache = new Map<string, Activity[]>();
const empty: Activity[] = [];

function notify() {
  subscribers.forEach((cb) => cb());
}

const normalize = (address: Address) => address.toLowerCase();

const storageKey = (address: Address, chainId: Chain["id"]) =>
  `${storageKeyPrefix}${chainId}:${normalize(address)}`;

function read(address: Address, chainId: Chain["id"]) {
  const key = storageKey(address, chainId);
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? (JSON.parse(raw) as Activity[]) : empty;
    cache.set(key, data);
    return data;
  } catch {
    return empty;
  }
}

function write(address: Address, chainId: Chain["id"], activities: Activity[]) {
  const key = storageKey(address, chainId);
  cache.set(key, activities);
  try {
    localStorage.setItem(key, JSON.stringify(activities));
  } catch {
    // Ignore persistence errors (e.g., quota exceeded)
  }
  notify();
}

export function addActivity(
  address: Address,
  chainId: Chain["id"],
  activity: Activity,
) {
  write(address, chainId, [activity, ...read(address, chainId)]);
}

export function updateActivity(
  address: Address,
  chainId: Chain["id"],
  txHash: string,
  updates: Partial<Omit<Activity, "txHash">>,
) {
  write(
    address,
    chainId,
    read(address, chainId).map((a) =>
      a.txHash === txHash ? { ...a, ...updates } : a,
    ),
  );
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const useActivities = (
  address: Address | undefined,
  chainId: Chain["id"],
): Activity[] =>
  useSyncExternalStore(
    subscribe,
    () => (address ? read(address, chainId) : empty),
    () => empty,
  );
