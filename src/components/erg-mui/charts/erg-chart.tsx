import Box from "@mui/material/Box";
import type { CSSProperties, ComponentProps, ReactElement } from "react";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

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
        "& .recharts-cartesian-axis-tick text": { fill: "text.secondary", fontFamily: "inherit", fontSize: 11 },
        "& .recharts-cartesian-grid-horizontal line": { stroke: "divider", strokeOpacity: 0.72 },
        "& .recharts-layer": { outline: "none" },
        "& .recharts-surface": { overflow: "visible" },
        ...props.sx,
      }}
    >
      <ChartContainer className="h-full w-full aspect-auto" config={config} initialDimension={{ height: 300, width: 720 }}>
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
