import { ImageOff as BrokenImageOutlinedIcon } from "@/components/mui-icon-shim";
import { Trash2 as DeleteOutlinedIcon } from "@/components/mui-icon-shim";
import { Image as ImageOutlinedIcon } from "@/components/mui-icon-shim";

import { useI18n } from "@/platform/i18n";
import type { QuizEditorSlideMedia } from "@/features/lcms/quiz/quiz-editor/types/quiz-editor-types";

type MediaAttachmentPanelProps = {
  media: QuizEditorSlideMedia | null | undefined;
  onPickMedia: () => void;
  onRemoveMedia: () => void;
  onChangeAlt: (value: string) => void;
};

export function MediaAttachmentPanel({
  media,
  onPickMedia,
  onRemoveMedia,
  onChangeAlt,
}: MediaAttachmentPanelProps) {
  const { t } = useI18n();

  return (
    <section className="classic-editor__media-panel">
      <div className="classic-editor__media-panel-header">
        <div>
          <div className="classic-editor__field-label">{t("common.picture")}</div>
          <p className="classic-editor__media-panel-copy">{t("quiz.mediaPanelCopy")}</p>
        </div>
        <div className="classic-editor__media-panel-actions">
          <button
            type="button"
            className="classic-editor__ghost-action"
            onClick={onPickMedia}
          >
            <ImageOutlinedIcon className="h-4 w-4" size="1em" />
            <span>{media ? t("quiz.replaceImage") : t("quiz.addImage")}</span>
          </button>
          {media ? (
            <button
              type="button"
              className="classic-editor__ghost-action is-danger"
              onClick={onRemoveMedia}
            >
              <DeleteOutlinedIcon className="h-4 w-4" size="1em" />
              <span>{t("common.remove")}</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="classic-editor__media-panel-body">
        <div className="classic-editor__media-preview">
          {media?.src ? (
            <img
              src={media.src}
              alt={media.alt || t("common.picture")}
              className="classic-editor__media-preview-image"
            />
          ) : (
            <div className="classic-editor__media-preview-empty">
              <BrokenImageOutlinedIcon className="h-8 w-8" size="1em" />
              <span>{t("quiz.noImageAttached")}</span>
            </div>
          )}
        </div>

        <label className="classic-editor__property-field">
          <span>{t("quiz.imageAltText")}</span>
          <input
            value={media?.alt ?? ""}
            onChange={(event) => onChangeAlt(event.target.value)}
            className="classic-editor__text-input"
            placeholder={t("quiz.imageAltPlaceholder")}
            disabled={!media}
          />
        </label>
      </div>
    </section>
  );
}
