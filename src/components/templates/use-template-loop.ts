"use client";

import { useEffect } from "react";

export function useTemplateLoop(finished: boolean, restart: () => void, delay = 1200) {
  useEffect(() => {
    if (!finished) return;
    const timer = window.setTimeout(restart, delay);
    return () => window.clearTimeout(timer);
  }, [delay, finished, restart]);
}
