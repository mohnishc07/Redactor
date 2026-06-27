"use client";

import { useCallback, useState } from "react";

const ONE_MINUTE = 60_000;

export interface UsePaywallReturn {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  maxUploadsPerMinute: number;
  setMaxUploadsPerMinute: (value: number) => void;
  canUpload: (count?: number) => boolean;
  recordUpload: (count?: number) => void;
  remainingUploads: number;
}

export function usePaywall(
  initialEnabled = false,
  initialMaxUploadsPerMinute = 0
): UsePaywallReturn {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [maxUploadsPerMinute, setMaxUploadsPerMinute] = useState(
    Math.max(0, initialMaxUploadsPerMinute)
  );
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [remainingUploads, setRemainingUploads] = useState(
    Math.max(0, initialMaxUploadsPerMinute)
  );

  const prune = (now: number, list: number[]) =>
    list.filter((t) => now - t < ONE_MINUTE);

  const canUpload = useCallback(
    (count = 1) => {
      if (!enabled) return true;
      const now = Date.now();
      const recent = prune(now, timestamps);
      setTimestamps(recent);
      const remaining = Math.max(0, maxUploadsPerMinute - recent.length);
      setRemainingUploads(remaining);
      return recent.length + count <= maxUploadsPerMinute;
    },
    [enabled, maxUploadsPerMinute, timestamps]
  );

  const recordUpload = useCallback(
    (count = 1) => {
      const now = Date.now();
      setTimestamps((prev) => {
        const recent = prune(now, prev);
        return [...recent, ...Array(count).fill(now)];
      });
      setRemainingUploads((prev) => Math.max(0, prev - count));
    },
    []
  );

  return {
    enabled,
    setEnabled,
    maxUploadsPerMinute,
    setMaxUploadsPerMinute: (v) => setMaxUploadsPerMinute(Math.max(0, v)),
    canUpload,
    recordUpload,
    remainingUploads,
  };
}
