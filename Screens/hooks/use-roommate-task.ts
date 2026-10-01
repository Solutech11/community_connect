import { useCallback, useRef, useState } from "react";
import { useNotifier } from "../components/ui/app-notifier";
import { ApiError } from "../services/api/client";

export function useRoommateTask() {
  const { notify } = useNotifier();
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (operation: () => Promise<unknown>): Promise<boolean> => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    try { await operation(); return true; }
    catch (error) {
      notify({ title: "Unable to complete action", message: error instanceof ApiError ? error.message : "Check your connection and try again.", tone: "error" });
      return false;
    } finally { locked.current = false; setBusy(false); }
  }, [notify]);
  return { busy, run };
}
