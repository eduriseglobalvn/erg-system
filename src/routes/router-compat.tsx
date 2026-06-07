import * as React from "react";
import {
  Link as TanStackLink,
  Navigate as TanStackNavigate,
  Outlet,
  useNavigate as useTanStackNavigate,
  useParams as useTanStackParams,
  useRouterState,
  type LinkProps as TanStackLinkProps,
} from "@tanstack/react-router";

type NavigateOptions = {
  replace?: boolean;
};

type LocationLike = {
  hash: string;
  pathname: string;
  search: string;
};

type LinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

export { Outlet };

export function useLocation(): LocationLike {
  return useRouterState({
    select: (state) => ({
      hash: state.location.hash,
      pathname: state.location.pathname,
      search: state.location.searchStr,
    }),
  });
}

export function useNavigate() {
  const navigate = useTanStackNavigate();

  return React.useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        window.history.go(to);
        return;
      }

      void navigate({ replace: options?.replace, to });
    },
    [navigate],
  );
}

export function useParams<TParams extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return useTanStackParams({ strict: false }) as TParams;
}

export function useSearchParams(): [URLSearchParams] {
  const search = useRouterState({
    select: (state) => state.location.searchStr,
  });

  return React.useMemo(() => [new URLSearchParams(search)] as [URLSearchParams], [search]);
}

export function Navigate({ replace, to }: { replace?: boolean; to: string }) {
  return <TanStackNavigate replace={replace} to={to} />;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link({ to, ...props }, ref) {
  return <TanStackLink preload="intent" preloadDelay={75} ref={ref} to={to as TanStackLinkProps["to"]} {...props} />;
});
