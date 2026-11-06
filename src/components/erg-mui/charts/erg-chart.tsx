import Box from "@mui/material/Box";
import type { CSSProperties, ComponentProps, ReactElement } from "react";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./chart-primitives";

export type ErgChartConfig = ChartConfig;

export function ErgChartContainer({ children, config, ...props }: Omit<ComponentProps<typeof Box>, "children"> & {
  children: ReactElement;
  config: ErgChartConfig;
}) {
  const colorVariables = Object.fromEntries(
    Object.entries(config).flatMap(([key, item]) => item.color ? [[`--color-${key}`, item.color]] : []),
  ) as CSSProperties;

  return (
    <Box
      role="img"
      {...props}
      style={{ ...colorVariables, ...props.style }}
      sx={{
        height: "100%",
        minHeight: 240,
        minWidth: 0,
        width: "100%",
        "& .recharts-cartesian-axis-tick text": { fill: "text.secondary", fontFamily: "inherit", fontSize: (theme) => theme.typography.caption.fontSize, fontVariantNumeric: "tabular-nums" },
        "& .recharts-cartesian-grid-horizontal line": { stroke: "divider", strokeOpacity: 0.72, strokeWidth: 1 },
        "& .recharts-curve.recharts-tooltip-cursor": { stroke: "divider" },
        "& .recharts-rectangle.recharts-tooltip-cursor": { fill: "action.hover" },
        "& .recharts-sector": { outline: "none" },
        "& .recharts-layer": { outline: "none" },
        "& .recharts-surface": { overflow: "visible" },
        ...props.sx,
      }}
    >
      <ChartContainer config={config} initialDimension={{ height: 300, width: 720 }}>
        {children}
      </ChartContainer>
    </Box>
  );
}

export {
  ChartLegend as ErgChartLegend,
  ChartLegendContent as ErgChartLegendContent,
  ChartTooltip as ErgChartTooltip,
  ChartTooltipContent as ErgChartTooltipContent,
};
