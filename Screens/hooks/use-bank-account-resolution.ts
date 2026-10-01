import { useEffect, useState } from "react";

import { ApiError } from "../services/api/client";
import { walletApi } from "../services/api/wallet.api";
import type { PostWalletBankAccountsResolveResponse } from "../types/api.generated";

type Resolution = PostWalletBankAccountsResolveResponse["data"]["resolution"];
type State = {
  key: string;
  resolution?: Resolution;
  error?: string;
  resolving: boolean;
};

export function useBankAccountResolution(bankCode: string, accountNumber: string) {
  const [state, setState] = useState<State>({ key: "", resolving: false });
  const [attempt, setAttempt] = useState(0);
  const ready = Boolean(bankCode) && /^\d{10}$/.test(accountNumber);
  const key = ready ? `${bankCode}:${accountNumber}:${attempt}` : "";

  useEffect(() => {
    if (!key) {
      setState({ key: "", resolving: false });
      return;
    }

    const controller = new AbortController();
    setState({ key, resolving: true });
    // Wait for typing to stop; cancel obsolete lookups when either detail changes.
    const timer = setTimeout(() => {
      void walletApi.resolveBankAccount({ bankCode, accountNumber }, controller.signal)
        .then((response) => {
          if (!controller.signal.aborted) {
            setState({ key, resolution: response.data.resolution, resolving: false });
          }
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted) {
            setState({
              key,
              resolving: false,
              error: error instanceof ApiError ? error.message : "Unable to verify this account. Try again.",
            });
          }
        });
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [accountNumber, bankCode, key]);

  // Match during render as well as in the effect, so a stale name can never
  // enable saving between an input change and effect cleanup.
  const current = state.key === key ? state : undefined;
  return {
    resolution: current?.resolution,
    error: current?.error,
    resolving: ready && (current?.resolving ?? true),
    retry: () => setAttempt((value) => value + 1),
  };
}
