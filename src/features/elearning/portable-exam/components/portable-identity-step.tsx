import { useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ErgButton } from "@/components/erg-mui/erg-actions";
import { ErgTextField } from "@/components/erg-mui/erg-form";
import {
  validatePortableIdentity,
  type PortableIdentityErrors,
  type PortableStudentIdentity,
} from "@/features/elearning/portable-exam/api/portable-exam-identity";
import type { PortableRoster } from "@/lib/types";

export type PortableIdentityStepProps = {
  title: string;
  roster?: PortableRoster;
  onConfirm: (identity: PortableStudentIdentity) => void;
};

/** 8.4.3: asks who is taking the exam before the player (and its timer) starts. */
export function PortableIdentityStep({ title, roster, onConfirm }: PortableIdentityStepProps) {
  const [classCode, setClassCode] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [errors, setErrors] = useState<PortableIdentityErrors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validatePortableIdentity({ classCode, studentCode }, roster);
    if (result.ok) onConfirm(result.identity);
    else setErrors(result.errors);
  }

  return (
    <Box component="main" sx={{ alignItems: "center", bgcolor: "background.default", display: "flex", minHeight: "100dvh", justifyContent: "center", p: 3 }}>
      <Stack component="form" noValidate onSubmit={handleSubmit} spacing={2} sx={{ maxWidth: 420, width: "100%" }}>
        <Typography component="h1" variant="h5">{title}</Typography>
        <Typography color="text.secondary" variant="body2">
          Nhập mã lớp và mã học sinh để bắt đầu. Bài làm sẽ được lưu theo mã này.
        </Typography>
        <ErgTextField
          autoFocus
          error={Boolean(errors.classCode)}
          helperText={errors.classCode}
          label="Mã lớp"
          onChange={(event) => setClassCode(event.target.value)}
          value={classCode}
        />
        <ErgTextField
          error={Boolean(errors.studentCode)}
          helperText={errors.studentCode}
          label="Mã học sinh"
          onChange={(event) => setStudentCode(event.target.value)}
          value={studentCode}
        />
        <ErgButton type="submit">Bắt đầu làm bài</ErgButton>
      </Stack>
    </Box>
  );
}
