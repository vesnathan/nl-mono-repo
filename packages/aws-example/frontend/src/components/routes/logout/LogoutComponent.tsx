"use client";

import { useLogoutFn } from "@/hooks/useLogoutFn";
import { useEffect, useState } from "react";

const LogoutComponent = () => {
  const [dots, setDots] = useState("");
  const [error, setError] = useState<string | null>(null);
  const logout = useLogoutFn();

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((prevDots) => (prevDots.length < 3 ? `${prevDots}.` : ""));
    }, 500); // Add a dot every 500ms, reset after 3 dots

    const performLogout = async () => {
      try {
        await logout();
      } catch (err: unknown) {
        setError((err as Error).message || "An error occurred during logout.");
      }
    };

    const logoutTimeout = setTimeout(() => {
      clearInterval(dotInterval);
      performLogout();
    }, 3000);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(logoutTimeout);
    };
  }, [logout]);

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="p-5 justify-center items-center w-full">{`Logging out${dots}`}</div>
  );
};

export default LogoutComponent;
