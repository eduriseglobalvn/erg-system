import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";

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
      variant="outlined"
      sx={{
        borderColor: alpha("#0f172a", 0.08),
        borderRadius: 3,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
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
          sx={{ alignItems: "center", justifyContent: "space-between", minWidth: { lg: 152 }, width: { lg: 152 } }}
        >
          <Typography
            component="h1"
            sx={{
              color: "#111827",
              fontSize: 16,
              fontWeight: 900,
              lineHeight: 1.12,
              letterSpacing: 0,
            }}
          >
            <Box component="span" sx={{ display: "block" }}>{titleLines[0]}</Box>
            {titleLines[1] ? <Box component="span" sx={{ display: "block" }}>{titleLines[1]}</Box> : null}
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

