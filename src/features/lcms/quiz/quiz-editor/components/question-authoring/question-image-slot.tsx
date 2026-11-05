import { useRef, type DragEvent } from "react";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import TextField from "@mui/material/TextField";

import type { QuizEditorSlideMedia } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";
import { QUIZ_IMAGE_TYPES } from "@/lib/media/quiz-image";
import { ergEnterpriseTokens as tokens } from "@/themes/erg-enterprise-tokens";
import { readQuizImage } from "./read-quiz-image";

export type ImageSize = { width: number; height: number };

type Props = {
  media: QuizEditorSlideMedia | null | undefined;
  label: string;
  onChange: (media: QuizEditorSlideMedia | null, size?: ImageSize) => void;
};

export function QuestionImageSlot({ media, label, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const take = async (file: File | undefined) => {
    const image = file && (await readQuizImage(file));
    if (image) onChange({ type: "image", src: image.dataUrl, alt: media?.alt ?? "", name: file.name }, { width: image.width, height: image.height });
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    void take(event.dataTransfer.files[0]);
  };

  const input = (
    <input
      accept={QUIZ_IMAGE_TYPES.join(",")}
      hidden
      onChange={(event) => {
        void take(event.target.files?.[0]);
        event.target.value = "";
      }}
      ref={inputRef}
      type="file"
    />
  );

  if (!media?.src) {
    return (
      <>
        {input}
        <ButtonBase
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          sx={{
            border: "1.5px dashed", borderColor: tokens.color.borderStrong, borderRadius: `${tokens.radius.control}px`, color: "text.secondary",
            gap: 1, minHeight: 44, typography: "body2", width: "100%", "&:hover": { borderColor: "primary.main", color: "primary.main" },
          }}
        >
          <AddPhotoAlternateOutlinedIcon fontSize="small" />
          {`${label} · kéo thả hoặc bấm`}
        </ButtonBase>
      </>
    );
  }

  return (
    <Box onDragOver={(event) => event.preventDefault()} onDrop={onDrop} sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box alt={media.alt} component="img" src={media.src} sx={{ alignSelf: "flex-start", borderRadius: `${tokens.radius.control}px`, maxHeight: 320, maxWidth: "100%", objectFit: "contain" }} />
      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
        <TextField label="Mô tả ảnh" onChange={(event) => onChange({ ...media, alt: event.target.value })} size="small" sx={{ flex: "1 1 240px" }} value={media.alt} />
        <Button onClick={() => inputRef.current?.click()} variant="text">Đổi ảnh</Button>
        <Button color="error" onClick={() => onChange(null)} variant="text">Xoá ảnh</Button>
      </Box>
      {input}
    </Box>
  );
}
