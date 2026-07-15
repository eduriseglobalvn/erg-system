import { apiRequest } from "@/lib/api-client";
import { getDefaultTenantId, graphQlRequest, type GraphQlPage } from "@/lib/graphql-client";

export type LearningResourceTaxonomyOption = {
  id: string;
  label: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, string>;
};

export type LearningResourceTaxonomyResponse = {
  grades: LearningResourceTaxonomyOption[];
  subjects: LearningResourceTaxonomyOption[];
  categories: LearningResourceTaxonomyOption[];
  sections: LearningResourceTaxonomyOption[];
  bookSeries: LearningResourceTaxonomyOption[];
  topics: LearningResourceTaxonomyOption[];
  fileTypes: string[];
  designerPresets?: Array<{
    id: string;
    name: string;
    description: string;
    accentColor: string;
    layout: string;
  }>;
};

export type LearningResourceResourceCard = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  programSlug: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  selectedFileType: string;
  fileTypeBadge?: string;
  launchMode: string;
  priceType: string;
  accessState: string;
  visibility?: string;
  status?: string;
  canDownload: boolean;
  updatedAt?: string;
};

export type LearningResourceAssetDetail = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: string;
  fileTypeBadge?: string;
  launchMode?: string;
  originalFileName?: string;
  detectedMimeType?: string;
  fileExtension?: string;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
};

export type LearningResourceResourceDetail = LearningResourceResourceCard & {
  description?: string;
  assets: LearningResourceAssetDetail[];
};

export type LearningResourceResourceList = {
  data: LearningResourceResourceCard[];
  total?: number;
  page?: number;
  limit?: number;
};

type LearningResourceStudioBootstrap = {
  subjects: LearningResourceTaxonomyOption[];
  groups?: LearningResourceTaxonomyOption[];
  categories?: LearningResourceTaxonomyOption[];
  lessons?: LearningResourceTaxonomyOption[];
  sections?: LearningResourceTaxonomyOption[];
  resources?: StudioResourceResponse[];
  fileTypes?: string[];
  designerPresets?: LearningResourceTaxonomyResponse["designerPresets"];
};

type StudioResourceResponse = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  subjectId?: string;
  categoryId?: string;
  groupId?: string;
  lessonId?: string;
  sectionId?: string;
  fileType?: string;
  type?: string;
  status?: string;
  visibility?: string;
  updatedAt?: string;
};

type ContentItemResponse = {
  id: string;
  contentType?: string;
  title: string;
  description?: string;
  status?: string;
  visibility?: string;
  updatedAt?: string;
  assets?: ContentAssetResponse[];
  placements?: ContentPlacementResponse[];
};

type ContentAssetResponse = {
  id: string;
  assetType?: string;
  title?: string;
  storageProvider?: string;
  storageUrl?: string;
  mimeType?: string;
  byteSize?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  assetRole?: string;
  sortOrder?: number;
};

type ContentPlacementResponse = {
  id: string;
  topicId: string;
  contentRole?: string;
  sortOrder?: number;
  status?: string;
};

type GoogleSlidesLectureResponse = {
  contentItem: ContentItemResponse;
  contentAsset: ContentAssetResponse;
  placement: ContentPlacementResponse;
};

type LearningResourceLibraryGraphQlInput = {
  tenantId?: string;
  educationUnitId?: string;
  academicYear?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  sectionId?: string;
  topicId?: string;
  status?: string;
  visibility?: string;
  page?: number;
  size?: number;
};

type LearningResourceLibraryGraphQlNode = {
  id: string;
  kind?: string | null;
  label?: string | null;
  slug?: string | null;
  parentId?: string | null;
  subjectId?: string | null;
  categoryId?: string | null;
  sortOrder?: number | null;
  status?: string | null;
  description?: string | null;
  childCount?: number | null;
  resourceCount?: number | null;
};

type LearningResourceLibraryGraphQlCard = {
  id: string;
  subjectId?: string | null;
  gradeId?: string | null;
  categoryId?: string | null;
  sectionId?: string | null;
  topicId?: string | null;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  visibility?: string | null;
  status?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

type LearningResourceLibraryGraphQl = {
  tenantId?: string | null;
  educationUnitId?: string | null;
  taxonomyTree: LearningResourceLibraryGraphQlNode[];
  resources: GraphQlPage<LearningResourceLibraryGraphQlCard>;
};

type LearningResourceLibraryGraphQlData = {
  lms?: {
    learningResourceLibrary?: LearningResourceLibraryGraphQl | null;
  } | null;
};

const LearningResourceLibraryDocument = `
query LcmsLearningResourceLibrary($input: LearningResourceLibraryInput) {
  lms {
    learningResourceLibrary(input: $input) {
      tenantId
      educationUnitId
      taxonomyTree {
        id
        kind
        label
        slug
        parentId
        subjectId
        categoryId
        sortOrder
        status
        description
        childCount
        resourceCount
      }
      resources {
        items {
          id
          subjectId
          gradeId
          categoryId
          sectionId
          topicId
          title
          slug
          subtitle
          thumbnailUrl
          visibility
          status
          publishedAt
          updatedAt
        }
        page
        size
        totalItems
        totalPages
        hasNext
        hasPrevious
      }
    }
  }
}
`;

type CurriculumTreeResponse = {
  subjects?: CurriculumTreeNodeResponse[];
  levels?: CurriculumTreeNodeResponse[];
  topics?: CurriculumTreeNodeResponse[];
  fileTypes?: string[];
  designerPresets?: LearningResourceTaxonomyResponse["designerPresets"];
};

type CurriculumTreeNodeResponse = {
  id: string;
  label?: string;
  name?: string;
  title?: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  levelId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  kind?: string;
  type?: string;
  nodeType?: string;
  metadata?: Record<string, string>;
  levels?: CurriculumTreeNodeResponse[];
  topics?: CurriculumTreeNodeResponse[];
  children?: CurriculumTreeNodeResponse[];
};

export type StudioAssetResponse = {
  id: string;
  resourceId: string;
  title?: string;
  selectedFileType?: string;
  fileType?: string;
  launchMode?: string;
  originalFileName?: string;
  mimeType?: string;
  extension?: string;
  sizeBytes?: number;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
};

export type CreateLearningResourceResourcePayload = {
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  upstreamUrl?: string;
  programSlug: string;
  subjectId: string;
  gradeId?: string;
  categoryId: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  selectedFileType: string;
  originalFileName?: string;
  detectedMimeType?: string;
  storageUrl?: string;
  totalSlides?: number;
  priceType?: string;
  visibility?: string;
  status?: string;
  canDownload?: boolean;
  tags?: string[];
  items?: Array<{
    id?: string;
    unitTitle: string;
    lessonTitle?: string;
    sortOrder?: number;
    pageCount?: number;
    durationSec?: number;
  }>;
  lectureDesign?: {
    templateId?: string;
    bannerTitle?: string;
    bannerSubtitle?: string;
    backgroundUrl?: string;
    coverUrl?: string;
    accentColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    itemColumns?: number;
    showDownload?: boolean;
    unitLabels?: string[];
  };
};

export type CreateTaxonomyPayload = {
  id?: string;
  code?: string;
  label: string;
  slug?: string;
  parentId?: string;
  subjectId?: string;
  gradeId?: string;
  categoryId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelIds?: string[];
  description?: string;
  sortOrder?: number;
  status?: string;
  metadata?: Record<string, string>;
};

export type CurriculumTaxonomyImpact = {
  nodeId: string;
  nodeType: "subject" | "level" | "topic";
  canHardDelete: boolean;
  canArchive: boolean;
  impact: {
    questions: number;
    quizzes: number;
    publishedQuizVersions: number;
    contentItems: number;
    assignments: number;
    studentAttempts: number;
  };
  recommendedActions: Array<"ARCHIVE" | "REASSIGN" | "MERGE" | "HARD_DELETE">;
  source?: "api" | "estimated";
};

async function loadLearningResourceLibraryGraphQl(
  input: Partial<LearningResourceLibraryGraphQlInput> = {},
): Promise<LearningResourceLibraryGraphQl> {
  const page = Number(input.page ?? 0);
  const size = Number(input.size ?? 100);
  const variables = {
    input: compactObject({
      tenantId: input.tenantId ?? getDefaultTenantId(),
      educationUnitId: input.educationUnitId,
      academicYear: input.academicYear,
      subjectId: input.subjectId,
      gradeId: input.gradeId,
      categoryId: input.categoryId,
      sectionId: input.sectionId,
      topicId: input.topicId,
      status: input.status ?? "active",
      visibility: input.visibility,
      page: Number.isFinite(page) && page >= 0 ? page : 0,
      size: Number.isFinite(size) && size > 0 ? size : 100,
    }),
  };
  const data = await graphQlRequest<LearningResourceLibraryGraphQlData, typeof variables>({
    operationName: "LcmsLearningResourceLibrary",
    portal: "lcms",
    query: LearningResourceLibraryDocument,
    variables,
  });
  const library = data.lms?.learningResourceLibrary;
  if (!library) {
    throw new Error("GraphQL learningResourceLibrary response is missing.");
  }
  return library;
}

function mapGraphQlLibraryToStudioBootstrap(library: LearningResourceLibraryGraphQl): LearningResourceStudioBootstrap {
  const taxonomy = mapGraphQlLibraryToTaxonomies(library);
  return {
    subjects: taxonomy.subjects,
    groups: taxonomy.categories,
    categories: taxonomy.categories,
    lessons: taxonomy.sections,
    sections: taxonomy.sections,
    resources: mapGraphQlLibraryToResources(library).data.map(mapCardToStudioResource),
    fileTypes: taxonomy.fileTypes,
    designerPresets: taxonomy.designerPresets,
  };
}

function mapGraphQlLibraryToCurriculumTree(library: LearningResourceLibraryGraphQl): CurriculumTreeResponse {
  const taxonomy = mapGraphQlLibraryToTaxonomies(library);
  const levelsBySubject = groupBy(taxonomy.categories, (level) => level.subjectId || level.parentId || "");
  const topicsByLevel = groupBy(taxonomy.topics, (topic) => topic.categoryId || topic.parentId || "");
  const subjects = taxonomy.subjects.map((subject) => ({
    ...taxonomyToCurriculumNode(subject, "subject"),
    levels: (levelsBySubject.get(subject.id) ?? []).map((level) => ({
      ...taxonomyToCurriculumNode(level, "level"),
      topics: (topicsByLevel.get(level.id) ?? []).map((topic) => taxonomyToCurriculumNode(topic, "topic")),
    })),
  }));

  return {
    subjects,
    levels: taxonomy.categories.map((level) => taxonomyToCurriculumNode(level, "level")),
    topics: taxonomy.topics.map((topic) => taxonomyToCurriculumNode(topic, "topic")),
    fileTypes: taxonomy.fileTypes,
    designerPresets: taxonomy.designerPresets,
  };
}

function mapGraphQlLibraryToTaxonomies(library: LearningResourceLibraryGraphQl): LearningResourceTaxonomyResponse {
  const nodes = library.taxonomyTree ?? [];
  const subjects = sortTaxonomies(
    nodes
      .filter((node) => graphQlNodeKind(node) === "subject")
      .map((node) => mapGraphQlTaxonomyNode(node)),
  );
  const subjectIdByLevel = new Map<string, string>();
  const categories = sortTaxonomies(
    nodes
      .filter((node) => graphQlNodeKind(node) === "level")
      .map((node) => {
        const subjectId = node.subjectId || node.parentId || undefined;
        if (subjectId) subjectIdByLevel.set(node.id, subjectId);
        return mapGraphQlTaxonomyNode(node, {
          subjectId,
          categoryId: node.id,
          parentId: subjectId,
        });
      }),
  );
  const sections = sortTaxonomies(
    nodes
      .filter((node) => graphQlNodeKind(node) === "topic")
      .map((node) => {
        const categoryId = node.categoryId || node.parentId || undefined;
        return mapGraphQlTaxonomyNode(node, {
          subjectId: node.subjectId || subjectIdByLevel.get(categoryId || ""),
          categoryId,
          parentId: categoryId,
          topicId: node.id,
        });
      }),
  );

  return {
    grades: [],
    subjects,
    categories,
    sections,
    bookSeries: [],
    topics: sections,
    fileTypes: ["PDF", "PPTX", "VIDEO", "AUDIO", "LINK", "QUIZ"],
    designerPresets: [],
  };
}

function mapGraphQlLibraryToResources(
  library: LearningResourceLibraryGraphQl,
  scope: Record<string, unknown> = {},
): LearningResourceResourceList {
  const resources = library.resources;
  const data = (resources?.items ?? []).map((card) => mapGraphQlResourceCard(card, scope));
  return {
    data,
    total: resources?.totalItems ?? data.length,
    page: (resources?.page ?? 0) + 1,
    limit: resources?.size ?? data.length,
  };
}

export function loadLearningResourceStudioBootstrap() {
  return loadLearningResourceLibraryGraphQl().then(mapGraphQlLibraryToStudioBootstrap);
}

export function loadLearningResourceCurriculumTree() {
  return loadLearningResourceLibraryGraphQl().then(mapGraphQlLibraryToCurriculumTree);
}

export async function loadLearningResourceTaxonomies() {
  const library = await loadLearningResourceLibraryGraphQl({ size: 1 });
  return mapGraphQlLibraryToTaxonomies(library);
}

export async function loadLearningResourceStudioWorkspaceData(limit = 120) {
  const library = await loadLearningResourceLibraryGraphQl({ size: limit });
  const taxonomy = mapGraphQlLibraryToTaxonomies(library);
  const resources = mapGraphQlLibraryToResources(library, { limit });

  return {
    taxonomy,
    subjects: taxonomy.subjects,
    resources,
  };
}

export async function listLearningResourceTaxonomies(kind: string) {
  const taxonomy = await loadLearningResourceTaxonomies();

  switch (kind) {
    case "subjects":
      return taxonomy.subjects;
    case "categories":
    case "groups":
      return taxonomy.categories;
    case "sections":
    case "lessons":
      return taxonomy.sections;
    case "topics":
      return taxonomy.topics;
    case "book-series":
    case "bookSeries":
      return taxonomy.bookSeries;
    default:
      return [];
  }
}

export function listLearningResourceSubjects() {
  return listLearningResourceTaxonomies("subjects");
}

export async function listLearningResourceResources(params: Record<string, string | number | undefined> = {}) {
  const limit = Number(params.limit ?? 100);
  const library = await loadLearningResourceLibraryGraphQl({
    subjectId: stringParam(params.subjectId),
    categoryId: stringParam(params.categoryId || params.levelId),
    sectionId: stringParam(params.sectionId),
    topicId: stringParam(params.topicId || params.sectionId),
    size: Number.isFinite(limit) && limit > 0 ? limit : 100,
  });
  return mapGraphQlLibraryToResources(library, params);
}

export async function createLearningResourceResource(payload: CreateLearningResourceResourcePayload) {
  if (payload.selectedFileType === "PPTX" && payload.topicId && payload.upstreamUrl) {
    const lecture = await apiRequest<GoogleSlidesLectureResponse>("/api/content/lectures/google-slides", {
      method: "POST",
      body: JSON.stringify({
        topicId: payload.topicId,
        title: payload.title,
        googleSlidesUrl: payload.upstreamUrl,
        status: canonicalContentStatus(payload.status),
        visibility: canonicalContentVisibility(payload.visibility),
      }),
    });
    return mapCanonicalContentItemToCard(
      {
        ...lecture.contentItem,
        assets: [{ ...lecture.contentAsset, assetRole: "primary", sortOrder: 1 }],
        placements: [lecture.placement],
      },
      payload,
    );
  }
  const { contentItem, contentAsset, placement } = await createCanonicalLearningResource(payload);
  return mapCanonicalContentItemToCard(
    {
      ...contentItem,
      assets: contentAsset ? [{ ...contentAsset, assetRole: "primary", sortOrder: 1 }] : [],
      placements: placement ? [placement] : [],
    },
    payload,
  );
}

export async function updateLearningResourceResource(resourceId: string, payload: Partial<CreateLearningResourceResourcePayload>) {
  const contentItem = await apiRequest<ContentItemResponse>(`/api/content/items/${encodeURIComponent(resourceId)}`, {
    method: "PATCH",
    body: JSON.stringify(compactObject({
      contentType: payload.selectedFileType || payload.documentTypeId ? contentTypeForResource(payload) : undefined,
      title: payload.title,
      description: payload.description ?? payload.subtitle,
      status: payload.status ? canonicalContentStatus(payload.status) : undefined,
      visibility: payload.visibility ? canonicalContentVisibility(payload.visibility) : undefined,
    })),
  });
  return mapCanonicalContentItemToCard(contentItem, payload);
}

export function deleteLearningResourceResource(resourceId: string) {
  return apiRequest<{ deleted: boolean }>(`/api/content/items/${encodeURIComponent(resourceId)}`, {
    method: "DELETE",
  });
}

export async function loadLearningResourceResourceDetail(resourceId: string): Promise<LearningResourceResourceDetail> {
  const library = await loadLearningResourceLibraryGraphQl({ size: 100, status: undefined });
  const resource = (library.resources.items ?? []).find((item) => item.id === resourceId);
  const card = resource
    ? mapGraphQlResourceCard(resource)
    : {
        id: resourceId,
        slug: slugify(resourceId),
        title: resourceId,
        programSlug: "curriculum",
        subjectId: "curriculum",
        categoryId: "curriculum",
        selectedFileType: "PDF",
        fileTypeBadge: "PDF",
        launchMode: "pdf_reader",
        priceType: "free",
        accessState: "open",
        canDownload: false,
      };

  return {
    ...card,
    description: card.subtitle,
    assets: [],
  };
}

export async function createLearningResourceTaxonomy(kind: string, payload: CreateTaxonomyPayload) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Only subject, level, and topic taxonomy kinds are supported. Received "${kind}".`);
  }
  const createPath = curriculumPath === "levels" && payload.subjectId
    ? `subjects/${encodeURIComponent(payload.subjectId)}/levels`
    : curriculumPath === "topics" && (payload.categoryId || payload.parentId)
      ? `levels/${encodeURIComponent(payload.categoryId || payload.parentId || "")}/topics`
      : curriculumPath;
  const node = await apiRequest<CurriculumTreeNodeResponse>(`/api/curriculum/${createPath}`, {
    method: "POST",
    body: JSON.stringify(toCurriculumTaxonomyRequest(payload)),
  });
  return mapCurriculumTaxonomyNode(node, payload);
}

export async function updateLearningResourceTaxonomy(kind: string, id: string, payload: Partial<CreateTaxonomyPayload>) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Only subject, level, and topic taxonomy kinds are supported. Received "${kind}".`);
  }
  const node = await apiRequest<CurriculumTreeNodeResponse>(`/api/curriculum/${curriculumPath}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(toCurriculumTaxonomyRequest(payload)),
  });
  return mapCurriculumTaxonomyNode(node, { id, ...payload });
}

export function deleteLearningResourceTaxonomy(kind: string, id: string) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Only subject, level, and topic taxonomy kinds are supported. Received "${kind}".`);
  }
  return apiRequest<{ deleted: boolean }>(`/api/curriculum/${curriculumPath}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function loadLearningResourceTaxonomyImpact(kind: string, id: string) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Curriculum impact is only available for subject, level, and topic taxonomy kinds. Received "${kind}".`);
  }
  return apiRequest<CurriculumTaxonomyImpact>(`/api/curriculum/${curriculumPath}/${encodeURIComponent(id)}/impact`);
}

export function archiveLearningResourceTaxonomy(kind: string, id: string) {
  const curriculumPath = curriculumTaxonomyPath(kind);
  if (!curriculumPath) {
    throw new Error(`Curriculum archive is only available for subject, level, and topic taxonomy kinds. Received "${kind}".`);
  }
  return apiRequest<LearningResourceTaxonomyOption>(`/api/curriculum/${curriculumPath}/${encodeURIComponent(id)}/archive`, {
    method: "POST",
  });
}

export function uploadLearningResourceAsset(input: {
  resourceId: string;
  file?: File;
  selectedFileType: string;
  title?: string;
  storageUrl?: string;
  totalSlides?: number;
  canDownload?: boolean;
}): Promise<StudioAssetResponse> {
  return createLearningResourceAsset(input.resourceId, {
    title: input.title || input.file?.name,
    selectedFileType: input.selectedFileType,
    file: input.file,
    storageProvider: input.storageUrl ? "google_drive" : undefined,
    storageUrl: input.storageUrl,
    totalSlides: input.totalSlides,
    canDownload: input.canDownload,
  });
}

export function createLearningResourceAsset(
  resourceId: string,
  input: {
    file?: File;
    title?: string;
    selectedFileType?: string;
    launchMode?: string;
    originalFileName?: string;
    detectedMimeType?: string;
    fileExtension?: string;
    fileSizeBytes?: number;
    storageProvider?: string;
    storageUrl?: string;
    canDownload?: boolean;
    status?: string;
    totalSlides?: number;
    metadata?: Record<string, unknown>;
  },
) {
  return createCanonicalAssetForResource(resourceId, input);
}

export function updateLearningResourceAsset(
  assetId: string,
  input: {
    title?: string;
    selectedFileType?: string;
    originalFileName?: string;
    detectedMimeType?: string;
    storageProvider?: string;
    storageUrl?: string;
    upstreamUrl?: string;
    canDownload?: boolean;
    status?: string;
  },
) {
  return apiRequest<ContentAssetResponse>(`/api/content/assets/${encodeURIComponent(assetId)}`, {
    method: "PATCH",
    body: JSON.stringify(toCanonicalAssetUpdateRequest(input)),
  }).then((asset) => mapContentAssetToStudioAsset(asset, ""));
}

export function uploadLearningResourceResource(input: {
  file?: File;
  title: string;
  selectedFileType: string;
  subjectId: string;
  categoryId: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  thumbnailUrl?: string;
  programSlug?: string;
  gradeId?: string;
  sectionId?: string;
  bookSeriesId?: string;
  topicId?: string;
  levelId?: string;
  documentTypeId?: string;
  priceType?: string;
  visibility?: string;
  status?: string;
  canDownload?: boolean;
  upstreamUrl?: string;
  storageUrl?: string;
  tags?: string[];
  totalSlides?: number;
}): Promise<{ resource: LearningResourceResourceCard; asset: StudioAssetResponse }> {
  const { upstreamUrl, storageUrl, totalSlides, ...resourceInput } = input;
  return createLearningResourceResource({
    ...resourceInput,
    programSlug: input.programSlug || input.subjectId,
  }).then(async (resource) => {
    const asset = await createLearningResourceAsset(resource.id, {
      title: input.title,
      selectedFileType: input.selectedFileType,
      file: input.file,
      storageProvider: upstreamUrl || storageUrl ? "google_drive" : undefined,
      storageUrl: upstreamUrl || storageUrl,
      totalSlides,
      canDownload: input.canDownload,
    });
    return { resource, asset };
  });
}

async function createCanonicalLearningResource(payload: CreateLearningResourceResourcePayload) {
  const contentItem = await apiRequest<ContentItemResponse>("/api/content/items", {
    method: "POST",
    body: JSON.stringify({
      contentType: contentTypeForResource(payload),
      title: payload.title,
      description: payload.description,
      status: canonicalContentStatus(payload.status),
      visibility: canonicalContentVisibility(payload.visibility),
    }),
  });

  const contentAsset = await createCanonicalContentAsset(payload);
  if (contentAsset) {
    await apiRequest(`/api/content/items/${encodeURIComponent(contentItem.id)}/assets`, {
      method: "POST",
      body: JSON.stringify({
        contentAssetId: contentAsset.id,
        assetRole: "primary",
        sortOrder: 1,
        metadata: compactObject({
          source: "learning-resource-authoring",
          selectedFileType: payload.selectedFileType,
        }),
      }),
    });
  }

  const placement = payload.topicId
    ? await apiRequest<ContentPlacementResponse>(`/api/curriculum/topics/${encodeURIComponent(payload.topicId)}/content-items`, {
        method: "POST",
        body: JSON.stringify({
          contentItemId: contentItem.id,
          contentRole: contentRoleForResource(payload),
          sortOrder: firstPositiveSortOrder(payload.items?.[0]?.sortOrder),
          status: payload.status === "archived" ? "archived" : "active",
        }),
      })
    : undefined;

  return { contentItem, contentAsset, placement };
}

async function createCanonicalContentAsset(payload: CreateLearningResourceResourcePayload) {
  const storageUrl = payload.upstreamUrl || payload.storageUrl;
  const hasAssetMetadata = Boolean(storageUrl || payload.originalFileName || payload.detectedMimeType || payload.totalSlides);
  if (!hasAssetMetadata) return null;

  return apiRequest<ContentAssetResponse>("/api/content/assets", {
    method: "POST",
    body: JSON.stringify(toCanonicalAssetCreateRequest({
      title: payload.title,
      selectedFileType: payload.selectedFileType,
      originalFileName: payload.originalFileName,
      detectedMimeType: payload.detectedMimeType,
      storageProvider: storageUrl ? "google_drive" : "metadata_only",
      storageUrl,
      status: payload.status === "archived" ? "archived" : "active",
      totalSlides: payload.totalSlides,
      canDownload: payload.canDownload,
    })),
  });
}

async function createCanonicalAssetForResource(
  resourceId: string,
  input: {
    file?: File;
    title?: string;
    selectedFileType?: string;
    launchMode?: string;
    originalFileName?: string;
    detectedMimeType?: string;
    fileExtension?: string;
    fileSizeBytes?: number;
    storageProvider?: string;
    storageUrl?: string;
    canDownload?: boolean;
    status?: string;
    totalSlides?: number;
    metadata?: Record<string, unknown>;
  },
): Promise<StudioAssetResponse> {
  const asset = await apiRequest<ContentAssetResponse>("/api/content/assets", {
    method: "POST",
    body: JSON.stringify(toCanonicalAssetCreateRequest(input)),
  });

  await apiRequest(`/api/content/items/${encodeURIComponent(resourceId)}/assets`, {
    method: "POST",
    body: JSON.stringify({
      contentAssetId: asset.id,
      assetRole: "primary",
      sortOrder: 1,
      metadata: compactObject({
        source: "learning-resource-authoring",
        selectedFileType: input.selectedFileType,
      }),
    }),
  });

  return mapContentAssetToStudioAsset(asset, resourceId);
}

function toCanonicalAssetCreateRequest(input: {
  file?: File;
  title?: string;
  selectedFileType?: string;
  launchMode?: string;
  originalFileName?: string;
  detectedMimeType?: string;
  fileExtension?: string;
  fileSizeBytes?: number;
  storageProvider?: string;
  storageUrl?: string;
  canDownload?: boolean;
  status?: string;
  totalSlides?: number;
  metadata?: Record<string, unknown>;
}) {
  const fileName = input.originalFileName || input.file?.name || input.title || "learning-resource";
  const selectedFileType = normalizeStudioFileType(input.selectedFileType || input.fileExtension || "PDF");
  return compactObject({
    assetType: canonicalAssetType({ selectedFileType }),
    title: input.title || fileName,
    storageProvider: input.storageProvider || (input.storageUrl ? "google_drive" : "metadata_only"),
    storageUrl: input.storageUrl,
    mimeType: input.detectedMimeType || input.file?.type,
    byteSize: input.fileSizeBytes ?? input.file?.size,
    status: input.status || "active",
    metadata: compactObject({
      ...(input.metadata ?? {}),
      originalFileName: fileName,
      selectedFileType,
      launchMode: input.launchMode || launchModeFor(selectedFileType),
      fileExtension: input.fileExtension || extensionFromFileName(fileName),
      totalSlides: positiveInteger(input.totalSlides),
      canDownload: input.canDownload,
    }),
  });
}

function toCanonicalAssetUpdateRequest(input: {
  title?: string;
  selectedFileType?: string;
  originalFileName?: string;
  detectedMimeType?: string;
  storageProvider?: string;
  storageUrl?: string;
  upstreamUrl?: string;
  canDownload?: boolean;
  status?: string;
}) {
  const selectedFileType = input.selectedFileType ? normalizeStudioFileType(input.selectedFileType) : undefined;
  return compactObject({
    assetType: selectedFileType ? canonicalAssetType({ selectedFileType }) : undefined,
    title: input.title,
    storageProvider: input.storageProvider || (input.upstreamUrl || input.storageUrl ? "google_drive" : undefined),
    storageUrl: input.upstreamUrl || input.storageUrl,
    mimeType: input.detectedMimeType,
    status: input.status,
    metadata: compactObject({
      originalFileName: input.originalFileName,
      selectedFileType,
      launchMode: selectedFileType ? launchModeFor(selectedFileType) : undefined,
      canDownload: input.canDownload,
    }),
  });
}

function canonicalAssetType(payload: Pick<CreateLearningResourceResourcePayload, "selectedFileType" | "documentTypeId">) {
  const type = normalizeStudioFileType(payload.documentTypeId || payload.selectedFileType || "PDF");
  if (type === "PPTX") return "GOOGLE_SLIDE";
  if (type === "QUIZ") return "QUIZ_PACKAGE";
  if (type === "VIDEO") return "VIDEO";
  if (type === "AUDIO") return "AUDIO";
  if (type === "LINK") return "EXTERNAL_LINK";
  return "DOCUMENT";
}

function contentTypeForResource(payload: Partial<Pick<CreateLearningResourceResourcePayload, "selectedFileType" | "documentTypeId">>) {
  const type = normalizeStudioFileType(payload.documentTypeId || payload.selectedFileType || "PDF");
  if (type === "QUIZ") return "EXERCISE";
  if (type === "PPTX" || type === "PDF" || type === "VIDEO" || type === "AUDIO" || type === "LINK") return "LECTURE";
  return "DOCUMENT";
}

function contentRoleForResource(payload: Partial<Pick<CreateLearningResourceResourcePayload, "selectedFileType" | "documentTypeId">>) {
  return contentTypeForResource(payload) === "EXERCISE" ? "EXERCISE" : "LECTURE";
}

function canonicalContentStatus(status?: string) {
  if (!status || status === "published") return "published";
  if (status === "ready") return "published";
  if (status === "archived") return "archived";
  return "draft";
}

function canonicalContentVisibility(visibility?: string) {
  if (!visibility || visibility === "open" || visibility === "published") return "public";
  if (visibility === "private") return "private";
  return visibility;
}

function firstPositiveSortOrder(value?: number) {
  return positiveInteger(value) ?? undefined;
}

function toCurriculumTaxonomyRequest(payload: Partial<CreateTaxonomyPayload>) {
  return compactObject({
    id: payload.id,
    code: payload.code || payload.slug || slugify(payload.label || "node"),
    name: payload.label,
    slug: payload.slug,
    parentId: payload.parentId,
    subjectId: payload.subjectId,
    gradeId: payload.gradeId,
    levelId: payload.categoryId || payload.parentId,
    categoryId: payload.categoryId,
    bookSeriesId: payload.bookSeriesId,
    topicId: payload.topicId,
    levelIds: payload.levelIds,
    sortOrder: payload.sortOrder,
    status: payload.status,
    description: payload.description,
    metadata: payload.metadata,
  });
}

function mapCurriculumTaxonomyNode(node: CurriculumTreeNodeResponse, fallback: Partial<LearningResourceTaxonomyOption> = {}): LearningResourceTaxonomyOption {
  const categoryId = node.categoryId || node.levelId || fallback.categoryId;
  return {
    id: node.id || fallback.id || "",
    label: node.label || node.name || node.title || fallback.label || "",
    slug: node.slug || fallback.slug,
    parentId: node.parentId || fallback.parentId || categoryId,
    subjectId: node.subjectId || fallback.subjectId,
    gradeId: node.gradeId || fallback.gradeId,
    categoryId,
    bookSeriesId: node.bookSeriesId || fallback.bookSeriesId,
    topicId: node.topicId || fallback.topicId,
    levelIds: node.levelIds || fallback.levelIds,
    description: node.description || fallback.description,
    sortOrder: node.sortOrder ?? fallback.sortOrder,
    status: node.status || fallback.status,
    metadata: node.metadata || fallback.metadata,
  };
}

function mapCanonicalContentItemToCard(
  item: ContentItemResponse,
  scope: Record<string, unknown> = {},
): LearningResourceResourceCard {
  const primaryPlacement = [...(item.placements ?? [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))[0];
  const primaryAsset = [...(item.assets ?? [])].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))[0];
  const selectedFileType = fileTypeForCanonicalContent(item, primaryAsset);
  const topicId = primaryPlacement?.topicId || String(scope.topicId || scope.sectionId || item.id);
  const categoryId = String(scope.categoryId || scope.levelId || topicId);
  const subjectId = String(scope.subjectId || "curriculum");

  return {
    id: item.id,
    slug: slugify(item.title || item.id),
    title: item.title,
    subtitle: item.description,
    programSlug: subjectId,
    subjectId,
    categoryId,
    sectionId: topicId,
    topicId,
    selectedFileType,
    fileTypeBadge: selectedFileType,
    launchMode: launchModeFor(selectedFileType),
    priceType: "free",
    accessState: "open",
    visibility: item.visibility,
    status: item.status,
    canDownload: Boolean(primaryAsset?.metadata?.canDownload),
    updatedAt: item.updatedAt,
  };
}

function mapGraphQlTaxonomyNode(
  node: LearningResourceLibraryGraphQlNode,
  fallback: Partial<LearningResourceTaxonomyOption> = {},
): LearningResourceTaxonomyOption {
  return {
    id: node.id,
    label: node.label || node.id,
    slug: node.slug || undefined,
    parentId: node.parentId || fallback.parentId,
    subjectId: node.subjectId || fallback.subjectId,
    categoryId: node.categoryId || fallback.categoryId,
    topicId: fallback.topicId,
    description: node.description || undefined,
    sortOrder: node.sortOrder ?? fallback.sortOrder,
    status: node.status || fallback.status,
    metadata: {
      kind: graphQlNodeKind(node),
      childCount: String(node.childCount ?? 0),
      resourceCount: String(node.resourceCount ?? 0),
    },
  };
}

function mapGraphQlResourceCard(
  card: LearningResourceLibraryGraphQlCard,
  scope: Record<string, unknown> = {},
): LearningResourceResourceCard {
  const subjectId = card.subjectId || stringParam(scope.subjectId) || "curriculum";
  const categoryId = card.categoryId || stringParam(scope.categoryId || scope.levelId) || card.sectionId || card.topicId || subjectId;
  const sectionId = card.sectionId || card.topicId || stringParam(scope.sectionId) || categoryId;
  const topicId = card.topicId || stringParam(scope.topicId) || sectionId;
  const selectedFileType = fileTypeFromGraphQlCard(card);
  return {
    id: card.id,
    slug: card.slug || slugify(card.title || card.id),
    title: card.title || card.id,
    subtitle: card.subtitle || undefined,
    thumbnailUrl: card.thumbnailUrl || undefined,
    programSlug: subjectId,
    subjectId,
    gradeId: card.gradeId || stringParam(scope.gradeId),
    categoryId,
    sectionId,
    topicId,
    selectedFileType,
    fileTypeBadge: selectedFileType,
    launchMode: launchModeFor(selectedFileType),
    priceType: "free",
    accessState: "open",
    visibility: card.visibility || undefined,
    status: card.status || undefined,
    canDownload: false,
    updatedAt: card.updatedAt || card.publishedAt || undefined,
  };
}

function mapCardToStudioResource(card: LearningResourceResourceCard): StudioResourceResponse {
  return {
    id: card.id,
    title: card.title,
    subtitle: card.subtitle,
    thumbnailUrl: card.thumbnailUrl,
    subjectId: card.subjectId,
    categoryId: card.categoryId,
    sectionId: card.sectionId,
    fileType: card.selectedFileType,
    type: card.selectedFileType,
    status: card.status,
    visibility: card.visibility,
    updatedAt: card.updatedAt,
  };
}

function mapContentAssetToStudioAsset(asset: ContentAssetResponse, resourceId: string): StudioAssetResponse {
  const selectedFileType = typeof asset.metadata?.selectedFileType === "string"
    ? normalizeStudioFileType(asset.metadata.selectedFileType)
    : fileTypeForCanonicalAsset(asset);
  const originalFileName = typeof asset.metadata?.originalFileName === "string" ? asset.metadata.originalFileName : asset.title;
  return {
    id: asset.id,
    resourceId,
    title: asset.title,
    selectedFileType,
    fileType: selectedFileType,
    launchMode: typeof asset.metadata?.launchMode === "string" ? asset.metadata.launchMode : launchModeFor(selectedFileType),
    originalFileName,
    mimeType: asset.mimeType,
    extension: extensionFromFileName(originalFileName || asset.title || selectedFileType.toLowerCase()),
    sizeBytes: asset.byteSize,
    storageProvider: asset.storageProvider,
    storageUrl: asset.storageUrl,
    upstreamUrl: asset.storageUrl,
    canDownload: Boolean(asset.metadata?.canDownload),
    status: asset.status,
  };
}

function taxonomyToCurriculumNode(item: LearningResourceTaxonomyOption, kind: string): CurriculumTreeNodeResponse {
  return {
    id: item.id,
    label: item.label,
    name: item.label,
    slug: item.slug,
    parentId: item.parentId,
    subjectId: item.subjectId,
    categoryId: item.categoryId,
    topicId: item.topicId,
    description: item.description,
    sortOrder: item.sortOrder,
    status: item.status,
    kind,
    nodeType: kind,
    metadata: item.metadata,
  };
}

function fileTypeForCanonicalContent(item: ContentItemResponse, asset?: ContentAssetResponse) {
  const assetType = (asset?.assetType || "").toUpperCase();
  const contentType = (item.contentType || "").toUpperCase();
  const selectedFileType = typeof asset?.metadata?.selectedFileType === "string" ? asset.metadata.selectedFileType : "";
  if (selectedFileType) return normalizeStudioFileType(selectedFileType);
  if (assetType === "GOOGLE_SLIDE") return "PPTX";
  if (assetType === "QUIZ_PACKAGE" || contentType === "EXERCISE") return "QUIZ";
  if (assetType === "VIDEO") return "VIDEO";
  if (assetType === "AUDIO") return "AUDIO";
  if (assetType === "EXTERNAL_LINK") return "LINK";
  return "PDF";
}

function fileTypeForCanonicalAsset(asset: ContentAssetResponse) {
  const assetType = (asset.assetType || "").toUpperCase();
  if (assetType === "GOOGLE_SLIDE") return "PPTX";
  if (assetType === "QUIZ_PACKAGE") return "QUIZ";
  if (assetType === "VIDEO") return "VIDEO";
  if (assetType === "AUDIO") return "AUDIO";
  if (assetType === "EXTERNAL_LINK") return "LINK";
  return "PDF";
}

function fileTypeFromGraphQlCard(card: LearningResourceLibraryGraphQlCard) {
  const status = (card.status || "").toUpperCase();
  const title = (card.title || "").toUpperCase();
  if (status.includes("QUIZ") || title.endsWith(".QUIZ")) return "QUIZ";
  if (title.endsWith(".PPT") || title.endsWith(".PPTX")) return "PPTX";
  if (title.endsWith(".MP4") || title.endsWith(".MOV")) return "VIDEO";
  if (title.endsWith(".MP3") || title.endsWith(".WAV")) return "AUDIO";
  if (title.startsWith("HTTP://") || title.startsWith("HTTPS://")) return "LINK";
  return "PDF";
}

function sortTaxonomies(items: LearningResourceTaxonomyOption[]) {
  return [...items].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0) || left.label.localeCompare(right.label, "vi"));
}

function groupBy<T>(items: T[], keyFor: (item: T) => string) {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = keyFor(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  });
  return groups;
}

function graphQlNodeKind(node: LearningResourceLibraryGraphQlNode) {
  return (node.kind || "").toLowerCase();
}

function stringParam(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  return String(value);
}

function normalizeStudioFileType(fileType: string) {
  const normalized = fileType.toUpperCase();
  if (normalized === "LECTURE") return "PPTX";
  if (normalized === "EXERCISE") return "QUIZ";
  return normalized;
}

function launchModeFor(fileType: string) {
  const normalized = normalizeStudioFileType(fileType);
  if (normalized === "PPTX") return "google_slide_embed";
  if (normalized === "QUIZ") return "quiz_runtime";
  if (normalized === "PDF") return "pdf_reader";
  if (normalized === "VIDEO") return "video_player";
  if (normalized === "AUDIO") return "audio_player";
  if (normalized === "LINK") return "external";
  return "download_only";
}

function curriculumTaxonomyPath(kind: string) {
  const normalized = kind.toLowerCase();
  if (normalized === "subjects" || normalized === "subject") return "subjects";
  if (["levels", "level", "categories", "category", "groups", "group"].includes(normalized)) return "levels";
  if (["topics", "topic", "sections", "section", "lessons", "lesson"].includes(normalized)) return "topics";
  return null;
}

function positiveInteger(value?: number) {
  if (!Number.isFinite(value)) return undefined;
  const normalized = Math.floor(Number(value));
  return normalized > 0 ? normalized : undefined;
}

function extensionFromFileName(fileName: string) {
  const segments = fileName.split(".");
  return segments.length > 1 ? segments.pop()?.toLowerCase() : undefined;
}

function compactObject<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== "")) as Partial<T>;
}

function slugify(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}
