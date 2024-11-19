import { useEffect, EffectCallback, useRef } from "react";

export function useEffectOnce(effectCallback: EffectCallback) {
  const calledRef = useRef(false);
  useEffect(() => {
    const called = calledRef.current;
    if (called) {
      return;
    }
    calledRef.current = true;
    // eslint-disable-next-line consistent-return
    return effectCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
