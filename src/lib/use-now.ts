import { useSyncExternalStore } from "react";

const MINUTE = 60_000;

const subscribe = (onChange: () => void) => {
  const id = setInterval(onChange, MINUTE / 2);
  return () => clearInterval(id);
};

/** Current time, rounded down to the minute so the snapshot is stable between ticks. */
const snapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;

/** Clock for "is this due yet?" checks. Render code must not call Date.now() itself. */
export const useNow = (): number => useSyncExternalStore(subscribe, snapshot, () => 0);
