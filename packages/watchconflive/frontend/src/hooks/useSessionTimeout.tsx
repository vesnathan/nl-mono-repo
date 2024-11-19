import { useSetGlobalMessage } from "@/components/common/GlobalMessage";
import { useEffectOnce } from "./useEffectOnce";
import { useRouter } from "next/navigation";

export const useSessionTimeout = (timeoutDurationMs: number) => {
  const setGlobalMessage = useSetGlobalMessage();
  const router = useRouter();

  const updateLastAccessTime = () => {
    localStorage.setItem("lastAccessTime", Date.now().toString());
  };

  const checkIdleTime = () => {
    const lastAccessTime = parseInt(
      localStorage.getItem("lastAccessTime") || "0",
      10,
    );
    if (Date.now() - lastAccessTime > timeoutDurationMs) {
      setGlobalMessage({
        content: "You have been logged out due to inactivity.",
        color: "error",
      });
      router.push("/login");
    }
  };

  useEffectOnce(() => {
    updateLastAccessTime();
    const interval = setInterval(checkIdleTime, timeoutDurationMs);

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (
          entry instanceof PerformanceResourceTiming &&
          entry.initiatorType === "fetch" &&
          entry.name.includes("/graphql")
        ) {
          updateLastAccessTime();
        }
      });
    });

    observer.observe({ type: "resource", buffered: true });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  });
};
