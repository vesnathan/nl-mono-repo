import { useEffect, useState } from "react";

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Update the state based on the initial match
    setMatches(media.matches);

    // Define the listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add the media query change listener
    media.addEventListener("change", listener);

    // Clean up by removing the listener when the component unmounts or query changes
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};
