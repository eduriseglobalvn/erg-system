import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function getIsMobileViewport() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.innerWidth < MOBILE_BREAKPOINT;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobileViewport);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(getIsMobileViewport());
    };

    onChange();

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      window.addEventListener("resize", onChange);

      return () => {
        mql.removeEventListener("change", onChange);
        window.removeEventListener("resize", onChange);
      };
    }

    mql.addListener(onChange);
    window.addEventListener("resize", onChange);

    return () => {
      mql.removeListener(onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return isMobile;
}
