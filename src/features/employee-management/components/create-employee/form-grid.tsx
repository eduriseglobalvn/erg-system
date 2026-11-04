import Box from "@mui/material/Box";

export function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { sm: "1fr 1fr", xs: "1fr" },
        pt: 0.5,
      }}
    >
      {children}
    </Box>
  );
}
