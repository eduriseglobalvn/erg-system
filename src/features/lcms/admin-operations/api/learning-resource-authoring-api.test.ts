import { beforeEach, expect, test, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());
const graphQlRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api-client", () => ({
  apiRequest: apiRequestMock,
  hasApiBase: () => true,
}));

vi.mock("@/lib/graphql-client", () => ({
  getDefaultTenantId: () => "erg",
  graphQlRequest: graphQlRequestMock,
}));

import {
  archiveLearningResourceTaxonomy,
  createLearningResourceResource,
  createLearningResourceTaxonomy,
  deleteLearningResourceTaxonomy,
  listLearningResourceResources,
  loadLearningResourceTaxonomies,
  loadLearningResourceTaxonomyImpact,
  updateLearningResourceTaxonomy,
  uploadLearningResourceResource,
} from "./learning-resource-authoring-api";

beforeEach(() => {
  apiRequestMock.mockReset();
  graphQlRequestMock.mockReset();
});

test("creates a topic Google Slides lecture through the atomic backend command", async () => {
  apiRequestMock.mockResolvedValueOnce({
    contentItem: { id: "content-1", title: "Bai giang", contentType: "LECTURE" },
    contentAsset: { id: "asset-1", assetType: "GOOGLE_SLIDE" },
    placement: { id: "placement-1", topicId: "topic-1", contentRole: "LECTURE" },
  });

  await createLearningResourceResource({
    title: "Bai giang",
    subjectId: "subject-1",
    programSlug: "subject-1",
    categoryId: "level-1",
    topicId: "topic-1",
    selectedFileType: "PPTX",
    upstreamUrl: "https://docs.google.com/presentation/d/deck-123/embed?start=false",
    status: "published",
    visibility: "public",
  });

  expect(apiRequestMock).toHaveBeenCalledTimes(1);
  expect(apiRequestMock).toHaveBeenCalledWith(
    "/api/content/lectures/google-slides",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"topicId":"topic-1"'),
    }),
  );
});

test("creates canonical content assets with manual total slide metadata", async () => {
  apiRequestMock
    .mockResolvedValueOnce({ id: "content-1", title: "Bai giang", contentType: "LECTURE" })
    .mockResolvedValueOnce({ id: "asset-1", title: "Bai giang", assetType: "GOOGLE_SLIDE", metadata: { selectedFileType: "PPTX" } })
    .mockResolvedValueOnce({ id: "link-1", contentItemId: "content-1", contentAssetId: "asset-1" });

  await createLearningResourceResource({
    title: "Bai giang",
    subjectId: "subject-1",
    programSlug: "subject-1",
    categoryId: "level-1",
    selectedFileType: "PPTX",
    upstreamUrl: "https://docs.google.com/presentation/d/deck-123/embed",
    totalSlides: 20,
  });

  expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/content/items", expect.objectContaining({ method: "POST" }));
  expect(apiRequestMock).toHaveBeenNthCalledWith(
    2,
    "/api/content/assets",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"totalSlides":20'),
    }),
  );
  expect(apiRequestMock).toHaveBeenNthCalledWith(
    3,
    "/api/content/items/content-1/assets",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"contentAssetId":"asset-1"'),
    }),
  );
});

test("creates topic resources as canonical content placements", async () => {
  apiRequestMock
    .mockResolvedValueOnce({ id: "content-1", title: "Bai giang", contentType: "LECTURE" })
    .mockResolvedValueOnce({ id: "placement-1", topicId: "topic-1", contentItemId: "content-1" });

  await createLearningResourceResource({
    title: "Bai giang",
    subjectId: "subject-1",
    programSlug: "subject-1",
    categoryId: "level-1",
    sectionId: "topic-1",
    topicId: "topic-1",
    selectedFileType: "PPTX",
  });

  expect(apiRequestMock).toHaveBeenNthCalledWith(
    1,
    "/api/content/items",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"contentType":"LECTURE"'),
    }),
  );
  expect(apiRequestMock).toHaveBeenNthCalledWith(
    2,
    "/api/curriculum/topics/topic-1/content-items",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"contentItemId":"content-1"'),
    }),
  );
});

test("uploads google slide links through canonical content assets", async () => {
  apiRequestMock
    .mockResolvedValueOnce({ id: "content-1", title: "Bai giang", contentType: "LECTURE" })
    .mockResolvedValueOnce({ id: "asset-1", title: "Bai giang", assetType: "GOOGLE_SLIDE", metadata: { selectedFileType: "PPTX" } })
    .mockResolvedValueOnce({ id: "link-1", contentItemId: "content-1", contentAssetId: "asset-1" });

  await uploadLearningResourceResource({
    title: "Bai giang",
    subjectId: "subject-1",
    categoryId: "level-1",
    selectedFileType: "PPTX",
    upstreamUrl: "https://docs.google.com/presentation/d/deck-123/embed",
    totalSlides: 12,
  });

  expect(apiRequestMock).toHaveBeenNthCalledWith(
    2,
    "/api/content/assets",
    expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"totalSlides":12'),
    }),
  );
  expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/content/items/content-1/assets", expect.objectContaining({ method: "POST" }));
});

test("lists learning resources through LCMS GraphQL reads", async () => {
  graphQlRequestMock.mockResolvedValueOnce({
    lms: {
      learningResourceLibrary: {
        taxonomyTree: [],
        resources: {
          items: [
            {
              id: "content-1",
              title: "Internet safety.pptx",
              subjectId: "subject-1",
              categoryId: "level-1",
              sectionId: "topic-1",
              topicId: "topic-1",
              visibility: "public",
              status: "published",
            },
          ],
          page: 0,
          size: 20,
          totalItems: 1,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        },
      },
    },
  });

  const resources = await listLearningResourceResources({ limit: 20, subjectId: "subject-1", categoryId: "level-1" });

  expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({
    operationName: "LcmsLearningResourceLibrary",
    portal: "lcms",
    variables: {
      input: expect.objectContaining({
        tenantId: "erg",
        subjectId: "subject-1",
        categoryId: "level-1",
        size: 20,
      }),
    },
  }));
  expect(resources.data).toMatchObject([
    {
      id: "content-1",
      title: "Internet safety.pptx",
      subjectId: "subject-1",
      categoryId: "level-1",
      sectionId: "topic-1",
      selectedFileType: "PPTX",
    },
  ]);
});

test("loads learning resource taxonomies from GraphQL library tree", async () => {
  graphQlRequestMock.mockResolvedValueOnce({
    lms: {
      learningResourceLibrary: {
        taxonomyTree: [
          { id: "subject-1", kind: "subject", label: "Tin hoc", slug: "tin-hoc", sortOrder: 2, childCount: 1, resourceCount: 1 },
          { id: "level-1", kind: "level", label: "Level 1", parentId: "subject-1", subjectId: "subject-1", sortOrder: 1, childCount: 1, resourceCount: 1 },
          { id: "topic-1", kind: "topic", label: "May tinh", parentId: "level-1", categoryId: "level-1", sortOrder: 1, childCount: 0, resourceCount: 1 },
        ],
        resources: { items: [], page: 0, size: 1, totalItems: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      },
    },
  });

  const taxonomy = await loadLearningResourceTaxonomies();

  expect(graphQlRequestMock).toHaveBeenCalledWith(expect.objectContaining({ portal: "lcms" }));
  expect(taxonomy.subjects).toEqual([expect.objectContaining({ id: "subject-1", label: "Tin hoc" })]);
  expect(taxonomy.categories).toEqual([expect.objectContaining({ id: "level-1", label: "Level 1", subjectId: "subject-1" })]);
  expect(taxonomy.sections).toEqual([expect.objectContaining({ id: "topic-1", label: "May tinh", categoryId: "level-1" })]);
  expect(taxonomy.topics).toEqual(taxonomy.sections);
});

test("loads curriculum impact before taxonomy removal actions", async () => {
  apiRequestMock.mockResolvedValueOnce({
    nodeId: "topic-1",
    nodeType: "topic",
    canHardDelete: false,
    canArchive: true,
    impact: { questions: 2, quizzes: 1, contentItems: 3 },
    recommendedActions: ["ARCHIVE", "REASSIGN"],
  });

  const impact = await loadLearningResourceTaxonomyImpact("sections", "topic-1");

  expect(apiRequestMock).toHaveBeenCalledWith("/api/curriculum/topics/topic-1/impact");
  expect(impact).toMatchObject({
    nodeId: "topic-1",
    nodeType: "topic",
    canHardDelete: false,
    canArchive: true,
  });
});

test("creates updates and deletes mapped curriculum taxonomy kinds through canonical endpoints", async () => {
  apiRequestMock
    .mockResolvedValueOnce({ id: "subject-1", name: "Tin hoc" })
    .mockResolvedValueOnce({ id: "level-1", name: "Level 1", subjectId: "subject-1" })
    .mockResolvedValueOnce({ deleted: true });

  await createLearningResourceTaxonomy("subjects", { label: "Tin hoc", slug: "tin-hoc" });
  await updateLearningResourceTaxonomy("categories", "level-1", { label: "Level 1", subjectId: "subject-1" });
  await deleteLearningResourceTaxonomy("sections", "topic-1");

  expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/curriculum/subjects", {
    method: "POST",
    body: JSON.stringify({ code: "tin-hoc", name: "Tin hoc", slug: "tin-hoc" }),
  });
  expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/curriculum/levels/level-1", {
    method: "PATCH",
    body: JSON.stringify({ code: "level-1", name: "Level 1", subjectId: "subject-1" }),
  });
  expect(apiRequestMock).toHaveBeenNthCalledWith(3, "/api/curriculum/topics/topic-1", {
    method: "DELETE",
  });
});

test("creates levels and topics with their required parent path", async () => {
  apiRequestMock.mockResolvedValueOnce({ id: "level-1", name: "Level 1", subjectId: "subject-1" });
  apiRequestMock.mockResolvedValueOnce({ id: "topic-1", name: "Topic 1", levelId: "level-1" });

  await createLearningResourceTaxonomy("levels", { label: "Level 1", subjectId: "subject-1" });
  await createLearningResourceTaxonomy("topics", { label: "Topic 1", categoryId: "level-1", subjectId: "subject-1" });

  expect(apiRequestMock).toHaveBeenNthCalledWith(1, "/api/curriculum/subjects/subject-1/levels", {
    method: "POST",
    body: JSON.stringify({ code: "level-1", name: "Level 1", subjectId: "subject-1" }),
  });
  expect(apiRequestMock).toHaveBeenNthCalledWith(2, "/api/curriculum/levels/level-1/topics", {
    method: "POST",
    body: JSON.stringify({ code: "topic-1", name: "Topic 1", subjectId: "subject-1", levelId: "level-1", categoryId: "level-1" }),
  });
});

test("rejects taxonomy kinds outside subject level and topic", async () => {
  await expect(createLearningResourceTaxonomy("book-series", { label: "Book 1", parentId: "subject-1" })).rejects.toThrow(
    "Only subject, level, and topic taxonomy kinds are supported.",
  );
  expect(apiRequestMock).not.toHaveBeenCalled();
});

test("archives taxonomy through curriculum endpoint instead of hard deleting", async () => {
  apiRequestMock.mockResolvedValueOnce({ id: "subject-1", label: "IC3", status: "archived" });

  const archived = await archiveLearningResourceTaxonomy("subjects", "subject-1");

  expect(apiRequestMock).toHaveBeenCalledWith("/api/curriculum/subjects/subject-1/archive", {
    method: "POST",
  });
  expect(archived).toMatchObject({ id: "subject-1", status: "archived" });
});
