import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuizImageRejectedError } from "@/lib/media/quiz-image";
import { readQuizImage } from "./read-quiz-image";

const prepare = vi.hoisted(() => vi.fn());
vi.mock("@/lib/media/quiz-image", async (orig) => ({ ...(await orig<object>()), prepareQuizImage: prepare }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

const png = () => new File(["x"], "a.png", { type: "image/png" });

beforeEach(() => vi.clearAllMocks());

describe("readQuizImage", () => {
  it("returns the prepared image and its size", async () => {
    prepare.mockResolvedValue({ dataUrl: "data:image/png;base64,AA", width: 4, height: 3 });
    await expect(readQuizImage(png())).resolves.toEqual({ dataUrl: "data:image/png;base64,AA", width: 4, height: 3 });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows why a refused file was refused and returns null", async () => {
    const refusal = new QuizImageRejectedError("type");
    prepare.mockRejectedValue(refusal);
    await expect(readQuizImage(png())).resolves.toBeNull();
    expect(toast.error).toHaveBeenCalledWith(refusal.message);
  });

  it("shows a generic message for an unreadable file and returns null", async () => {
    prepare.mockRejectedValue(new Error("decode failed"));
    await expect(readQuizImage(png())).resolves.toBeNull();
    expect(toast.error).toHaveBeenCalledWith("Không đọc được ảnh.");
  });
});
