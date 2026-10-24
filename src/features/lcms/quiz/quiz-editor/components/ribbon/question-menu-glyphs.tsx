import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export type QuestionMenuDemoKind =
  | "true-false"
  | "yes-no"
  | "multiple-choice"
  | "multiple-response"
  | "fill-blank"
  | "matching"
  | "sequence"
  | "click-map";

export function QuestionMenuGlyph({ kind }: { kind: QuestionMenuDemoKind }) {
  if (kind === "true-false") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", width: "88%", gap: "5px" }}>
        <Box sx={{ height: 4, width: "52%", borderRadius: 99, bgcolor: "#CBD5E1" }} />
        <Box sx={{ display: "flex", gap: "5px" }}>
          <Box
            sx={{
              flex: 1,
              height: 22,
              borderRadius: "5px",
              bgcolor: "#DCFCE7",
              border: "1px solid #86EFAC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
            }}
          >
            <Box
              component="svg"
              viewBox="0 0 16 16"
              sx={{ width: 10, height: 10, fill: "none", stroke: "#16A34A", strokeWidth: 2.2, strokeLinecap: "round" }}
            >
              <path d="M3 8.5L6.5 12L13 4" />
            </Box>
            <Typography sx={{ fontSize: "9px", fontWeight: 800, color: "#15803D" }}>Đúng</Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              height: 22,
              borderRadius: "5px",
              bgcolor: "#FEE2E2",
              border: "1px solid #FCA5A5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "3px",
            }}
          >
            <Box
              component="svg"
              viewBox="0 0 16 16"
              sx={{ width: 10, height: 10, fill: "none", stroke: "#DC2626", strokeWidth: 2.2, strokeLinecap: "round" }}
            >
              <path d="M4 4L12 12M12 4L4 12" />
            </Box>
            <Typography sx={{ fontSize: "9px", fontWeight: 800, color: "#B91C1C" }}>Sai</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (kind === "yes-no") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", width: "88%", gap: "5px" }}>
        <Box sx={{ height: 4, width: "58%", borderRadius: 99, bgcolor: "#CBD5E1" }} />
        <Box sx={{ display: "flex", gap: "5px" }}>
          <Box
            sx={{
              flex: 1,
              height: 22,
              borderRadius: "999px",
              bgcolor: "#EFF6FF",
              border: "1.5px solid #3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: "9.5px", fontWeight: 800, color: "#1D4ED8" }}>Có</Typography>
          </Box>
          <Box
            sx={{
              flex: 1,
              height: 22,
              borderRadius: "999px",
              bgcolor: "#F8FAFC",
              border: "1px solid #CBD5E1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: "9.5px", fontWeight: 700, color: "#64748B" }}>Không</Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  if (kind === "multiple-choice") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", width: "84%" }}>
        {[0, 1, 2].map((item) => {
          const isSelected = item === 0;
          return (
            <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  border: isSelected ? "2px solid #2563EB" : "1.5px solid #CBD5E1",
                  bgcolor: isSelected ? "#2563EB" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected ? (
                  <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#FFFFFF" }} />
                ) : null}
              </Box>
              <Box
                sx={{
                  width: item === 0 ? "72%" : item === 1 ? "54%" : "64%",
                  height: 5,
                  borderRadius: 99,
                  bgcolor: isSelected ? "#93C5FD" : "#E2E8F0",
                }}
              />
            </Box>
          );
        })}
      </Box>
    );
  }

  if (kind === "multiple-response") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "5px", width: "84%" }}>
        {[0, 1, 2].map((item) => {
          const isSelected = item !== 1;
          return (
            <Box key={item} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "3px",
                  border: isSelected ? "1.5px solid #2563EB" : "1.5px solid #CBD5E1",
                  bgcolor: isSelected ? "#2563EB" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isSelected ? (
                  <Box
                    component="svg"
                    viewBox="0 0 16 16"
                    sx={{ width: 8, height: 8, fill: "none", stroke: "#FFFFFF", strokeWidth: 2.4, strokeLinecap: "round" }}
                  >
                    <path d="M3 8.5L6.5 12L13 4" />
                  </Box>
                ) : null}
              </Box>
              <Box
                sx={{
                  width: item === 0 ? "70%" : item === 1 ? "60%" : "50%",
                  height: 5,
                  borderRadius: 99,
                  bgcolor: isSelected ? "#93C5FD" : "#E2E8F0",
                }}
              />
            </Box>
          );
        })}
      </Box>
    );
  }

  if (kind === "fill-blank") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", width: "86%", gap: "5px" }}>
        <Box sx={{ height: 4, width: "68%", borderRadius: 99, bgcolor: "#CBD5E1" }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Box sx={{ width: 14, height: 4, borderRadius: 99, bgcolor: "#CBD5E1" }} />
          <Box
            sx={{
              width: 32,
              height: 16,
              borderRadius: "4px",
              bgcolor: "#FFFFFF",
              border: "1.5px solid #2563EB",
              boxShadow: "0 1px 2px rgba(37,99,235,0.12)",
              display: "flex",
              alignItems: "center",
              px: "3px",
            }}
          >
            <Box sx={{ width: 1.5, height: 9, bgcolor: "#2563EB", borderRadius: 1 }} />
            <Box sx={{ ml: "2px", height: 2, width: 12, bgcolor: "#93C5FD", borderRadius: 1 }} />
          </Box>
          <Box sx={{ width: 12, height: 4, borderRadius: 99, bgcolor: "#CBD5E1" }} />
        </Box>
        <Box sx={{ height: 4, width: "45%", borderRadius: 99, bgcolor: "#E2E8F0" }} />
      </Box>
    );
  }

  if (kind === "matching") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "22px 24px 22px",
          gap: "2px",
          alignItems: "center",
          justifyContent: "center",
          width: "88%",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.65, gridColumn: 1 }}>
          <Box sx={{ height: 14, borderRadius: "4px", bgcolor: "#FFFFFF", border: "1.5px solid #94A3B8" }} />
          <Box sx={{ height: 14, borderRadius: "4px", bgcolor: "#FFFFFF", border: "1.5px solid #94A3B8" }} />
        </Box>

        <Box component="svg" viewBox="0 0 24 34" sx={{ gridColumn: 2, width: 24, height: 34 }}>
          <path d="M2 8 C12 8 12 26 22 26" fill="none" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M2 26 C12 26 12 8 22 8" fill="none" stroke="#93C5FD" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="2" cy="8" r="2" fill="#2563EB" />
          <circle cx="22" cy="26" r="2" fill="#2563EB" />
          <circle cx="2" cy="26" r="2" fill="#93C5FD" />
          <circle cx="22" cy="8" r="2" fill="#93C5FD" />
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.65, gridColumn: 3 }}>
          <Box sx={{ height: 14, borderRadius: "4px", bgcolor: "#EFF6FF", border: "1.5px solid #2563EB" }} />
          <Box sx={{ height: 14, borderRadius: "4px", bgcolor: "#EFF6FF", border: "1.5px solid #2563EB" }} />
        </Box>
      </Box>
    );
  }

  if (kind === "sequence") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", width: "84%" }}>
        {[1, 2, 3].map((num) => (
          <Box key={num} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Box
              sx={{
                width: 13,
                height: 13,
                borderRadius: "50%",
                bgcolor: num === 1 ? "#2563EB" : "#E2E8F0",
                color: num === 1 ? "#FFFFFF" : "#64748B",
                fontSize: "8.5px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {num}
            </Box>
            <Box
              sx={{
                width: num === 1 ? "58%" : num === 2 ? "48%" : "38%",
                height: 5,
                borderRadius: 99,
                bgcolor: num === 1 ? "#93C5FD" : "#CBD5E1",
              }}
            />
          </Box>
        ))}
      </Box>
    );
  }

  if (kind === "click-map") {
    return (
      <Box
        sx={{
          position: "relative",
          width: 68,
          height: 44,
          borderRadius: "6px",
          bgcolor: "#F1F5F9",
          border: "1px solid #CBD5E1",
          overflow: "hidden",
        }}
      >
        <Box
          component="svg"
          viewBox="0 0 68 44"
          sx={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <path d="M0 32 Q 20 20, 36 26 T 68 20 L 68 44 L 0 44 Z" fill="#E2E8F0" />
        </Box>

        <Box
          sx={{
            position: "absolute",
            left: 10,
            bottom: 8,
            width: 18,
            height: 14,
            borderRadius: "3px",
            border: "1.2px dashed #16A34A",
            bgcolor: "rgba(34, 197, 94, 0.18)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            right: 14,
            top: 8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: "1.5px solid #2563EB",
            bgcolor: "rgba(37, 99, 235, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "#2563EB" }} />
        </Box>
      </Box>
    );
  }

  return null;
}
