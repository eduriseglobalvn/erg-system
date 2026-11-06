import { expect, it } from "vitest";

import { createNewQuizProjectSettings } from "./quiz-editor-project-defaults";

it("a new quiz carries no invented people or course values and Vietnamese labels", () => {
  const { info, result } = createNewQuizProjectSettings();
  expect(info.author).toBe("");
  expect(info.page).toMatchObject({
    organization: "",
    courseTitle: "",
    lessonTitle: "",
    version: "",
    lecturer: "",
    contributors: "",
    startButtonLabel: "Bắt đầu",
  });
  expect(result.reviewButtonLabel).toBe("Xem lại bài");
  expect(result.thankYouMessage).toBe("Cảm ơn em!");
});
