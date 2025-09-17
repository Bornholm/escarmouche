import { useEffect, useState } from "react";


export const useAsyncMemo = <T>(fn: () => Promise<T>, deps: any[] = []) => {
  const [value, setValue] = useState<undefined | T>(undefined);

  useEffect(() => {
    let active = true;
    load();
    return () => {
      active = false;
    };

    async function load() {
      setValue(undefined);
      const evaluation: T = await fn();
      if (!active) {
        return;
      }
      setValue(evaluation);
    }
  }, deps);

  return value
}