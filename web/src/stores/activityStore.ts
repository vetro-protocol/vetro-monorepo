import { useSyncExternalStore } from "react";
import type { Address } from "viem";

import type { Activity } from "../components/base/activityList/types";

const storageKeyPrefix = "vetro:activities:";
const subscribers = new Set<() => void>();
const cache = new Map<string, Activity[]>();
const empty: Activity[] = [];

function notify() {
  subscribers.forEach((cb) => cb());
}

const normalize = (address: Address) => address.toLowerCase();

const storageKey = (address: Address) =>
  `${storageKeyPrefix}${normalize(address)}`;

function read(address: Address) {
  const key = storageKey(address);
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

function write(address: Address, activities: Activity[]) {
  const key = storageKey(address);
  cache.set(key, activities);
  try {
    localStorage.setItem(key, JSON.stringify(activities));
  } catch {
    // Ignore persistence errors (e.g., quota exceeded)
  }
  notify();
}

export function addActivity(address: Address, activity: Activity) {
  write(address, [activity, ...read(address)]);
}

export function updateActivity(
  address: Address,
  txHash: string,
  updates: Partial<Omit<Activity, "txHash">>,
) {
  write(
    address,
    read(address).map((a) => (a.txHash === txHash ? { ...a, ...updates } : a)),
  );
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const useActivities = (address: Address | undefined): Activity[] =>
  useSyncExternalStore(
    subscribe,
    () => (address ? read(address) : empty),
    () => empty,
  );
