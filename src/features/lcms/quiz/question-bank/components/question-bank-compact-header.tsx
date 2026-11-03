import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function QuestionBankCompactHeader({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const titleLines = splitCompactTitle(title);

  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.88)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        borderRadius: "16px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
        overflow: "hidden",
        position: "sticky",
        top: 0,
        zIndex: 12,
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ alignItems: { xs: "stretch", lg: "center" }, p: { xs: 2, lg: 1.75 } }}
      >
        <Stack
          direction="row"
          spacing={2}
          sx={{ alignItems: "center", justifyContent: "space-between", minWidth: { lg: 160 }, width: { lg: 160 } }}
        >
          <Typography
            component="h1"
            sx={{
              color: "#1D1D1F",
              fontSize: 16,
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            <Box component="span" sx={{ display: "block" }}>{titleLines[0]}</Box>
            {titleLines[1] ? <Box component="span" sx={{ display: "block", color: "#0071E3" }}>{titleLines[1]}</Box> : null}
          </Typography>
        </Stack>
        <Box sx={{ minWidth: 0, flex: 1 }}>{children}</Box>
      </Stack>
    </Paper>
  );
}

function splitCompactTitle(title: string) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 2) return [title, ""];
  const splitIndex = Math.ceil(words.length / 2);
  return [words.slice(0, splitIndex).join(" "), words.slice(splitIndex).join(" ")];
}
