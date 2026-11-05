import { describe, expect, it, vi } from "vitest";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { dataUrlToBlob, uploadInlineImages } from "@/features/lcms/quiz/quiz-editor/sync/upload-inline-images";

const img = "data:image/png;base64,iVBORw0KGgo=";
const base = { quizId: "q", draftId: "d" };
const size = async () => ({ width: 10, height: 20 });

function makeUploader(deduped = false) {
  return {
    presign: vi.fn().mockResolvedValue({ deduped, mediaId: "m1", url: "https://cdn/x.png", uploadUrl: deduped ? null : "https://up/x" }),
    put: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue({ mediaId: "m1", url: "https://cdn/x.png" }),
  };
}
const docWith = (src: string) =>
  ({ ...base, tree: [{ id: "g", slides: [{ id: "s", media: { type: "image", src, alt: "" }, choices: [{ id: "c", media: { src } }] }] }] }) as unknown as QuizEditorDraftDocument;

describe("uploadInlineImages", () => {
  it("replaces every data:image string anywhere in the tree and uploads each image once", async () => {
    const uploader = makeUploader();
    const out = await uploadInlineImages(docWith(img), uploader, async () => "sha", size);
    expect(JSON.stringify(out)).not.toContain("data:image");
    expect(JSON.stringify(out)).toContain("https://cdn/x.png");
    expect(uploader.presign).toHaveBeenCalledTimes(1);
    expect(uploader.presign).toHaveBeenCalledWith(expect.objectContaining({ sha256: "sha", mimeType: "image/png" }));
    expect(uploader.put).toHaveBeenCalledTimes(1);
    expect(uploader.put.mock.calls[0]?.[0]).toBe("https://up/x");
    expect(uploader.commit).toHaveBeenCalledWith({ mediaId: "m1", width: 10, height: 20 });
  });

  it("skips the PUT when the server already has the file (deduped)", async () => {
    const uploader = makeUploader(true);
    await uploadInlineImages(docWith(img), uploader, async () => "sha", size);
    expect(uploader.put).not.toHaveBeenCalled();
    expect(uploader.commit).toHaveBeenCalledTimes(1);
  });

  it("leaves the document untouched when there is no inline image", async () => {
    const uploader = makeUploader();
    const doc = docWith("https://cdn/already.png");
    expect(await uploadInlineImages(doc, uploader, async () => "sha", size)).toBe(doc);
    expect(uploader.presign).not.toHaveBeenCalled();
  });

  it("dataUrlToBlob decodes type and bytes", async () => {
    const blob = dataUrlToBlob(img);
    expect(blob.type).toBe("image/png");
    expect(blob.size).toBe(8);
  });
});
