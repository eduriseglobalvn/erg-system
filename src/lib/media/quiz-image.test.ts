import { describe, expect, it, vi } from "vitest";
import { fitWithin, prepareQuizImage, QuizImageRejectedError } from "@/lib/media/quiz-image";

describe("quiz-image", () => {
  it("fitWithin keeps small images and scales the long edge to 1600", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(4000, 3000)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(1000, 5000)).toEqual({ width: 320, height: 1600 });
  });

  it("rejects heic and oversize files with Vietnamese messages", async () => {
    const heic = prepareQuizImage(new File(["x"], "a.heic", { type: "image/heic" }));
    await expect(heic).rejects.toMatchObject({ reason: "type", name: "QuizImageRejectedError", message: "Chỉ nhận ảnh PNG, JPG, GIF hoặc WebP." });
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.png", { type: "image/png" });
    const err = await prepareQuizImage(big).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(QuizImageRejectedError);
    expect(err).toMatchObject({ reason: "size", message: "Ảnh lớn hơn 5 MB." });
  });

  it("does not resize gif", async () => {
    const resize = vi.fn();
    const read = vi.fn().mockResolvedValue("data:image/gif;base64,AA==");
    const readSize = vi.fn().mockResolvedValue({ width: 4000, height: 3000 });
    const out = await prepareQuizImage(new File(["x"], "a.gif", { type: "image/gif" }), { read, readSize, resize });
    expect(resize).not.toHaveBeenCalled();
    expect(out.dataUrl).toBe("data:image/gif;base64,AA==");
  });

  it("resizes a large png through the resizer", async () => {
    const resize = vi.fn().mockResolvedValue("data:image/png;base64,small");
    const readSize = vi.fn().mockResolvedValue({ width: 4000, height: 3000 });
    const file = new File(["x"], "a.png", { type: "image/png" });
    const out = await prepareQuizImage(file, { readSize, resize, read: vi.fn() });
    expect(resize).toHaveBeenCalledWith(file, { width: 1600, height: 1200 });
    expect(out).toEqual({ dataUrl: "data:image/png;base64,small", width: 1600, height: 1200 });
  });

  it("reads a small png as-is", async () => {
    const resize = vi.fn();
    const read = vi.fn().mockResolvedValue("data:image/png;base64,orig");
    const readSize = vi.fn().mockResolvedValue({ width: 800, height: 600 });
    const out = await prepareQuizImage(new File(["x"], "a.png", { type: "image/png" }), { read, readSize, resize });
    expect(resize).not.toHaveBeenCalled();
    expect(out).toEqual({ dataUrl: "data:image/png;base64,orig", width: 800, height: 600 });
  });
});
