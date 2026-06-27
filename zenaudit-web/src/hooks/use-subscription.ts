"use client";

import { useState, useCallback } from "react";
import {
  getSubscriptionStatus,
  SubscriptionStatus,
} from "@/lib/payments";

interface UseSubscriptionResult {
  status: SubscriptionStatus;
  isPro: boolean;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  // All features are unlocked by default for the demo.
  const [status, setStatus] = useState<SubscriptionStatus>("active");

  const refetch = useCallback(async () => {
    setStatus("loading");
    try {
      const next = await getSubscriptionStatus();
      setStatus(next);
    } catch {
      setStatus("inactive");
    }
  }, []);

  return {
    status,
    isPro: status === "active",
    isLoading: status === "loading",
    refetch,
  };
}

export { hasActiveSubscription, createCheckoutSession } from "@/lib/payments";
