import { Fragment, type ReactNode } from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Typography from "@mui/material/Typography";

export type ErgMetricItem = {
  label: string;
  /** null/undefined = chưa có dữ liệu, hiện "—" (không hiện 0). */
  value: number | string | null | undefined;
  hint?: ReactNode;
  href?: string;
  onClick?: () => void;
};

function MetricBody({ item }: { item: ErgMetricItem }) {
  const empty = item.value === null || item.value === undefined || item.value === "";
  return (
    <>
      <Typography sx={{ color: "text.secondary", fontSize: 13 }}>{item.label}</Typography>
      <Typography sx={{ fontSize: 24, fontVariantNumeric: "tabular-nums", fontWeight: 600, mt: 0.5 }}>
        {empty ? "—" : item.value}
      </Typography>
      {item.hint ? <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.5 }}>{item.hint}</Typography> : null}
    </>
  );
}

const cellSx = { alignItems: "flex-start", display: "block", flex: 1, minWidth: 140, p: 2, textAlign: "left" } as const;

function MetricCell({ item }: { item: ErgMetricItem }) {
  if (item.href || item.onClick) {
    return (
      <ButtonBase
        component={item.href ? "a" : "button"}
        href={item.href}
        onClick={item.onClick}
        sx={{ ...cellSx, "&:hover": { bgcolor: "action.hover" } }}
      >
        <MetricBody item={item} />
      </ButtonBase>
    );
  }
  return (
    <Box sx={cellSx}>
      <MetricBody item={item} />
    </Box>
  );
}

export function ErgMetricStrip({ items }: { items: ErgMetricItem[] }) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        display: "flex",
        flexWrap: "wrap",
        overflow: "hidden",
      }}
    >
      {items.map((item, index) => (
        <Fragment key={item.label}>
          {index > 0 ? <Box sx={{ alignSelf: "stretch", bgcolor: "divider", width: "1px" }} /> : null}
          <MetricCell item={item} />
        </Fragment>
      ))}
    </Box>
  );
}

export function ErgMetricCard({ item }: { item: ErgMetricItem }) {
  return <ErgMetricStrip items={[item]} />;
}
