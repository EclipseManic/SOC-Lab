import { useEffect, useState } from "react";

/**
 * A tiny boot store.
 *
 * The document ships with an opaque `#boot-overlay` (see index.html) so a
 * reload never flashes a half-built page. Nothing animates underneath it until
 * `markBooted()` lifts the overlay, at which point every entrance animation is
 * released in one coordinated moment.
 */
let booted = false;
const subscribers = new Set<() => void>();

/** Lift the boot overlay and release the entrance animations. Idempotent. */
export function markBooted() {
  if (booted) return;
  booted = true;
  if (typeof document !== "undefined") {
    document.documentElement.classList.add("booted");
  }
  subscribers.forEach((fn) => fn());
  subscribers.clear();
}

export function isBooted() {
  return booted;
}

/** `false` while the boot overlay is still up, `true` once it has lifted. */
export function useBooted() {
  const [value, setValue] = useState(booted);

  useEffect(() => {
    if (booted) {
      setValue(true);
      return;
    }
    const fn = () => setValue(true);
    subscribers.add(fn);
    return () => {
      subscribers.delete(fn);
    };
  }, []);

  return value;
}
