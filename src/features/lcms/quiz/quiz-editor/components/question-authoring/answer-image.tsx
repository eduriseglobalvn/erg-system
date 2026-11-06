import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import { useRef } from "react";

import type { QuestionImage } from "@/domain/quiz/types";
import { QUIZ_IMAGE_TYPES } from "@/lib/media/quiz-image";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { readQuizImage } from "./read-quiz-image";

export type ImageChange = (latest: QuestionImage | undefined) => QuestionImage | undefined;

/**
 * The image of one answer piece: add, describe, change or remove it. `name` reads like "vế trái hàng 1".
 * Changes apply to the latest image, so alt text typed while a picked file loads survives.
 */
export function AnswerImage({ image, name, onChange }: { image?: QuestionImage; name: string; onChange: (change: ImageChange) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = async (file: File) => {
    const image = await readQuizImage(file);
    if (image) onChange((latest) => ({ url: image.dataUrl, alt: latest?.alt ?? "" }));
  };
  const input = (
    <input
      accept={QUIZ_IMAGE_TYPES.join(",")}
      aria-label={`Ảnh ${name}`}
      hidden
      onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void pick(file); }}
      ref={fileRef}
      type="file"
    />
  );
  if (!image) {
    return (
      <>
        <IconButton aria-label={`Thêm ảnh ${name}`} onClick={() => fileRef.current?.click()} size="small">
          <AddPhotoAlternateOutlinedIcon fontSize="small" />
        </IconButton>
        {input}
      </>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, minWidth: 0 }}>
      <Box alt={image.alt ?? ""} component="img" src={image.url} sx={{ maxWidth: 150, maxHeight: 84, borderRadius: `${tokens.radius.xs}px`, objectFit: "cover" }} />
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <InputBase
          inputProps={{ "aria-label": `Mô tả ảnh ${name}` }}
          onChange={(e) => { const alt = e.target.value; onChange((latest) => latest && { ...latest, alt }); }}
          placeholder="Mô tả ảnh"
          sx={{ typography: "caption", flex: 1, minWidth: 0, borderBottom: "1px solid", borderColor: tokens.color.border }}
          value={image.alt ?? ""}
        />
        <IconButton aria-label={`Đổi ảnh ${name}`} onClick={() => fileRef.current?.click()} size="small">
          <ImageOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton aria-label={`Xoá ảnh ${name}`} onClick={() => onChange(() => undefined)} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      {input}
    </Box>
  );
}
