import Box from "@mui/material/Box";
import { createContext, useContext, type ComponentProps, type ReactNode } from "react";
import {
  Legend,
  ResponsiveContainer,
  Tooltip,
  type DefaultLegendContentProps,
  type DefaultTooltipContentProps,
  type TooltipValueType,
} from "recharts";

// Series colours reach recharts as `var(--color-<key>)`; ErgChartContainer sets those variables from `color`.
export type ChartConfig = Record<string, { label?: ReactNode; color?: string }>;

type TooltipNameType = number | string;

const ChartContext = createContext<ChartConfig | null>(null);

function useChartConfig() {
  const config = useContext(ChartContext);
  if (!config) throw new Error("useChartConfig must be used within <ErgChartContainer />");
  return config;
}

export function ChartContainer({ children, config, initialDimension }: {
  children: ComponentProps<typeof ResponsiveContainer>["children"];
  config: ChartConfig;
  initialDimension?: { height: number; width: number };
}) {
  return (
    <ChartContext.Provider value={config}>
      <ResponsiveContainer initialDimension={initialDimension}>{children}</ResponsiveContainer>
    </ChartContext.Provider>
  );
}

const dotSx = { borderRadius: "50%", flexShrink: 0, height: 8, width: 8 } as const;

export const ChartTooltip = Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
  color,
  nameKey,
  labelKey,
}: Omit<DefaultTooltipContentProps<TooltipValueType, TooltipNameType>, "accessibilityLayer"> & {
  active?: boolean;
  color?: string;
  hideIndicator?: boolean;
  hideLabel?: boolean;
  indicator?: "dot";
  labelKey?: string;
  nameKey?: string;
}) {
  const config = useChartConfig();

  if (!active || !payload?.length) return null;

  const [first] = payload;
  const labelValue = !labelKey && typeof label === "string"
    ? (config[label]?.label ?? label)
    : getPayloadConfig(config, first, `${labelKey ?? first?.dataKey ?? first?.name ?? "value"}`)?.label;
  const tooltipLabel = hideLabel ? null : labelFormatter ? labelFormatter(labelValue, payload) : labelValue;

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        color: "text.primary",
        display: "grid",
        gap: 0.5,
        minWidth: 128,
        px: 1.25,
        py: 0.75,
        typography: "caption",
      }}
    >
      {tooltipLabel ? <Box sx={{ fontWeight: "fontWeightMedium" }}>{tooltipLabel}</Box> : null}
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => {
          const itemConfig = getPayloadConfig(config, item, `${nameKey ?? item.name ?? item.dataKey ?? "value"}`);
          const indicatorColor = color ?? item.payload?.fill ?? item.color;

          return (
            <Box key={index} sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {hideIndicator ? null : <Box sx={{ ...dotSx, bgcolor: indicatorColor }} />}
                  <Box component="span" sx={{ color: "text.secondary", flex: 1 }}>{itemConfig?.label ?? item.name}</Box>
                  {item.value != null && (
                    <Box component="span" sx={{ fontVariantNumeric: "tabular-nums", fontWeight: "fontWeightMedium" }}>
                      {typeof item.value === "number" ? item.value.toLocaleString("vi-VN") : String(item.value)}
                    </Box>
                  )}
                </>
              )}
            </Box>
          );
        })}
    </Box>
  );
}

export const ChartLegend = Legend;

export function ChartLegendContent({ payload, verticalAlign = "bottom", nameKey }: DefaultLegendContentProps & { nameKey?: string }) {
  const config = useChartConfig();

  if (!payload?.length) return null;

  return (
    <Box
      sx={{
        alignItems: "center",
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        justifyContent: "center",
        pb: verticalAlign === "top" ? 1.5 : 0,
        pt: verticalAlign === "top" ? 0 : 1.5,
      }}
    >
      {payload
        .filter((item) => item.type !== "none")
        .map((item, index) => (
          <Box key={index} sx={{ alignItems: "center", color: "text.secondary", display: "flex", gap: 0.75, typography: "caption" }}>
            <Box sx={{ ...dotSx, bgcolor: item.color }} />
            {getPayloadConfig(config, item, `${nameKey ?? item.dataKey ?? "value"}`)?.label}
          </Box>
        ))}
    </Box>
  );
}

function getPayloadConfig(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;

  const inner = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null
    ? (payload.payload as Record<string, unknown>)
    : undefined;
  const outer = payload as Record<string, unknown>;

  let configKey = key;
  if (typeof outer[key] === "string") configKey = outer[key];
  else if (inner && typeof inner[key] === "string") configKey = inner[key];

  return configKey in config ? config[configKey] : config[key];
}
