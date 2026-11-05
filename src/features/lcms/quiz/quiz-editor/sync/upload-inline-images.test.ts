import { afterEach, describe, expect, it, vi } from "vitest";
import type { QuizEditorDraftDocument } from "@/features/lcms/quiz/quiz-editor/api/quiz-editor-api";
import { createQuizImageUploader, dataUrlToBlob, uploadInlineImages } from "@/features/lcms/quiz/quiz-editor/sync/upload-inline-images";
import { ApiClientError } from "@/lib/api-client";

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
  it("uploads a data URL that lives only in choices[].media.src", async () => {
    const uploader = makeUploader();
    const doc = { ...base, tree: [{ id: "g", slides: [{ id: "s", choices: [{ id: "c", media: { type: "image", src: img, alt: "" } }] }] }] } as unknown as QuizEditorDraftDocument;
    const out = await uploadInlineImages(doc, uploader, async () => "sha", size);
    expect(JSON.stringify(out)).not.toContain("data:image");
    expect(JSON.stringify(out)).toContain("https://cdn/x.png");
  });

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

  it("decodes a plain percent-encoded data URL without base64", async () => {
    const blob = dataUrlToBlob("data:image/svg+xml,%3Csvg%2F%3E");
    expect(blob.type).toBe("image/svg+xml");
    expect(await blob.text()).toBe("<svg/>");
  });

  it("throws a clear error for malformed data URLs", () => {
    expect(() => dataUrlToBlob("data:image/png;base64")).toThrow("Ảnh không hợp lệ");
    expect(() => dataUrlToBlob("data:image/png;base64,@@@")).toThrow("Ảnh không hợp lệ");
    expect(() => dataUrlToBlob("data:image/svg+xml,%E0%A4%A")).toThrow("Ảnh không hợp lệ");
  });

  it.each(["presign", "put", "commit"] as const)("rejects when %s fails and does not mutate the input", async (step) => {
    const uploader = makeUploader();
    uploader[step].mockRejectedValue(new Error("boom"));
    const doc = docWith(img);
    const before = structuredClone(doc);
    await expect(uploadInlineImages(doc, uploader, async () => "sha", size)).rejects.toThrow("boom");
    expect(doc).toEqual(before);
  });

  it("does not mutate the input on success", async () => {
    const doc = docWith(img);
    const before = structuredClone(doc);
    await uploadInlineImages(doc, makeUploader(), async () => "sha", size);
    expect(doc).toEqual(before);
  });

  it("uploads once when two different strings hash the same", async () => {
    const other = "data:image/png;base64,AAAA";
    const doc = { ...base, tree: [{ a: img, b: other }] } as unknown as QuizEditorDraftDocument;
    const uploader = makeUploader();
    const out = await uploadInlineImages(doc, uploader, async () => "same", size);
    expect(uploader.presign).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(out)).not.toContain("data:image");
  });
});

describe("uploadInlineImages with a shared cache", () => {
  it("uploads an image once across calls that share one cache", async () => {
    const uploader = makeUploader();
    const digest = vi.fn(async () => "sha");
    const cache = new Map<string, string>();
    const first = await uploadInlineImages(docWith(img), uploader, digest, size, cache);
    const second = await uploadInlineImages(docWith(img), uploader, digest, size, cache);
    expect(uploader.presign).toHaveBeenCalledTimes(1);
    expect(uploader.commit).toHaveBeenCalledTimes(1);
    expect(digest).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
    expect(cache.get(img)).toBe("https://cdn/x.png");
  });
});

describe("createQuizImageUploader.put", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rethrows a dropped connection as a network ApiClientError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const error = await createQuizImageUploader().put("https://up/x", new Blob(["x"]), "image/png").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ code: "NETWORK_ERROR", status: 0 });
  });

  it("rejects on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));
    await expect(createQuizImageUploader().put("https://up/x", new Blob(["x"]), "image/png")).rejects.toThrow("403");
  });

  it("sends a PUT with Content-Type on success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    await createQuizImageUploader().put("https://up/x", new Blob(["x"]), "image/png");
    expect(fetchMock).toHaveBeenCalledWith("https://up/x", expect.objectContaining({ method: "PUT", headers: { "Content-Type": "image/png" } }));
  });
});
