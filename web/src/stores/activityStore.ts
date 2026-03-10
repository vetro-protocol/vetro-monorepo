import { useSyncExternalStore } from "react";

import type { Activity } from "../components/base/activityList/types";

const storageKeyPrefix = "vetro:activities:";
const subscribers = new Set<() => void>();
const cache = new Map<string, Activity[]>();
const empty: Activity[] = [];

function notify() {
  subscribers.forEach((cb) => cb());
}

const storageKey = (address: string) => `${storageKeyPrefix}${address}`;

const normalize = (address: string) => address.toLowerCase();

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
  try {
    localStorage.setItem(storageKey(address), JSON.stringify(activities));
  } catch {
    // Ignore persistence errors (e.g., quota exceeded)
  }
  notify();
}

export function addActivity(
  address: string,
  activity: Omit<Activity, "id">,
): string {
  const key = normalize(address);
  const id = crypto.randomUUID();
  write(key, [{ ...activity, id }, ...read(key)]);
  return id;
}

export function updateActivity(
  address: string,
  id: string,
  updates: Partial<Omit<Activity, "id">>,
) {
  const key = normalize(address);
  write(
    key,
    read(key).map((a) => (a.id === id ? { ...a, ...updates } : a)),
  );
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

export const useActivities = (address: string | undefined): Activity[] =>
  useSyncExternalStore(
    subscribe,
    () => (address ? read(normalize(address)) : empty),
    () => empty,
  );
