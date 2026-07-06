"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `callback` every `delayMs` using a self-correcting requestAnimationFrame
 * loop (so the game does not drift or fire while the tab is backgrounded).
 * Pass `null` as the delay to pause the loop.
 */
export function useGameLoop(callback: () => void, delayMs: number | null) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (delayMs == null) return;

    let frame = 0;
    let last = performance.now();
    let acc = 0;

    const step = (now: number) => {
      frame = requestAnimationFrame(step);
      acc += now - last;
      last = now;
      // Guard against huge jumps (e.g. tab regains focus) to avoid a burst.
      if (acc > delayMs * 5) acc = delayMs;
      while (acc >= delayMs) {
        acc -= delayMs;
        callbackRef.current();
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [delayMs]);
}
