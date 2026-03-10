import { useSyncExternalStore } from "react";

import type { Activity } from "../components/base/activityList/types";

const storageKeyPrefix = "vetro:activities:";
const subscribers = new Set<() => void>();
const cache = new Map<string, Activity[]>();
const empty: Activity[] = [];

function notify() {
  subscribers.forEach((cb) => cb());
}

const storageKey = (address: string) =>
  `${storageKeyPrefix}${address.toLowerCase()}`;

function read(address: string) {
  if (cache.has(address)) {
    return cache.get(address)!;
  }
  try {
    const raw = localStorage.getItem(storageKey(address));
    const data = raw ? (JSON.parse(raw) as Activity[]) : empty;
    cache.set(address, data);
    return data;
  } catch {
    return empty;
  }
}

function write(address: string, activities: Activity[]) {
  cache.set(address, activities);
  localStorage.setItem(storageKey(address), JSON.stringify(activities));
  notify();
}

export function addActivity(
  address: string,
  activity: Omit<Activity, "id">,
): string {
  const id = crypto.randomUUID();
  write(address, [{ ...activity, id }, ...read(address)]);
  return id;
}

export function updateActivity(
  address: string,
  id: string,
  updates: Partial<Omit<Activity, "id">>,
) {
  write(
    address,
    read(address).map((a) => (a.id === id ? { ...a, ...updates } : a)),
  );
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const useActivities = (address: string | undefined): Activity[] =>
  useSyncExternalStore(
    subscribe,
    () => (address ? read(address) : empty),
    () => empty,
  );
