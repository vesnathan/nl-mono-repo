import { useSetGlobalMessage } from "@/components/common/GlobalMessage";
// eslint-disable-next-line import/extensions, import/no-unresolved
import { useEffectOnce } from "./useEffectOnce";

export const useSessionTimeout = (input: {
  timeoutDurationMS: number;
  handleLogout: () => void;
}) => {
  const setGlobalMessage = useSetGlobalMessage();
  const { timeoutDurationMS, handleLogout } = input;
  const updateLastAccessTime = () => {
    localStorage.setItem("lastAccessTime", Date.now().toString());
  };

  const checkIdleTime = () => {
    const lastAccessTime = parseInt(
      localStorage.getItem("lastAccessTime") || "0",
      10,
    );
    if (Date.now() - lastAccessTime > timeoutDurationMS) {
      setGlobalMessage({
        content: "You have been logged out due to inactivity.",
        color: "error",
      });
      handleLogout();
    }
  };

  useEffectOnce(() => {
    updateLastAccessTime();
    const interval = setInterval(checkIdleTime, 5 * 1000 * 60);

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
