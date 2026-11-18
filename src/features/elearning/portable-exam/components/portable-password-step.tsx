import { useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import { portableAccessPasswordMatches } from "@/features/elearning/portable-exam/api/portable-exam-password";

/** Asks for the password the teacher set on export before the player (and its timer) starts. */
export function PortablePasswordStep({ onUnlock, packageId, passwordHash, title }: {
  onUnlock: () => void;
  packageId: string;
  passwordHash: string;
  title: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setChecking(true);
    const ok = await portableAccessPasswordMatches(packageId, password, passwordHash);
    setChecking(false);
    if (ok) onUnlock();
    else setError("Mật khẩu chưa đúng.");
  }

  return (
    <Box component="main" sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", minHeight: "100dvh", justifyContent: "center", p: 3 }}>
      <Stack component="form" noValidate onSubmit={(event) => void handleSubmit(event)} spacing={2} sx={{ maxWidth: 420, width: "100%" }}>
        <Typography component="h1" variant="h5">{title}</Typography>
        <ErgTextField
          autoFocus
          error={Boolean(error)}
          helperText={error || "Nhập mật khẩu giáo viên cho để bắt đầu."}
          label="Mật khẩu"
          onChange={(event) => { setPassword(event.target.value); setError(""); }}
          type="password"
          value={password}
        />
        <ErgButton disabled={!password.trim()} loading={checking} type="submit">Bắt đầu làm bài</ErgButton>
      </Stack>
    </Box>
  );
}
