import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  LibraryBig,
  Link as LinkIcon,
  ListTree,
  Pencil,
  Plus,
  Settings2,
  Trash2,
} from "@/components/mui-icon-shim";
import { queryKeys } from "@/lib/query-keys";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, inputClassName } from "@/components/ui/input";
import {
  ChecklistItem,
  Field,
  InfoRow,
  PublishCard,
  PublishStep,
  SearchInput,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-fields";
import { TaxonomyCreateDialog } from "@/features/lcms/admin-operations/components/learning-resource-authoring-create-dialog";
import { StructureScreen } from "@/features/lcms/admin-operations/components/learning-resource-authoring-structure-screen";
import { getNodeKindLabel } from "@/features/lcms/admin-operations/components/learning-resource-authoring-tree";
import { TsForm } from "@/components/ui/tanstack-form";
import {
  createLearningResourceResource,
  loadLearningResourceStudioWorkspaceData,
  uploadLearningResourceResource,
  type LearningResourceResourceCard,
  type LearningResourceTaxonomyResponse,
} from "@/features/lcms/admin-operations/api/learning-resource-authoring-api";
import {
  LocalContentEditDialog,
  TaxonomyDeleteDialog,
  TaxonomyEditDialog,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-edit-dialogs";
import {
  USE_LEARNING_RESOURCE_AUTHORING_MOCK,
  mockLearningResourceAuthoringLocalContent as mockExplorerLocalContent,
  mockLearningResourceAuthoringResources as mockExplorerResources,
  mockLearningResourceAuthoringTaxonomy as mockExplorerModel,
} from "@/features/lcms/admin-operations/api/mock-learning-resource-authoring-data";
import type { DashboardLeaf } from "@/layouts/dashboard/types/dashboard-types";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { usePacedStateBatch } from "@/hooks/use-paced-state-batch";
import {
  normalizeGoogleViewerUrl,
} from "@/features/lcms/admin-operations/utils/learning-resource-content-dialog";
import type {
  LocalContentEditTarget,
  LocalContentItem,
  StudioNode,
  StudioSubject,
  TaxonomyDeleteTarget,
  TaxonomyDialogState,
  TaxonomyEditTarget,
} from "@/features/lcms/admin-operations/types/learning-resource-authoring";
import { cn } from "@/lib/utils";
import { AppSelect } from "@/components/ui/app-select";
import {
  buildResourceLocation,
  buildSubjects,
  emptyModel,
  findNode,
  findPath,
  flattenNodes,
  getPublishStatusLabel,
  nodeIdForCreated,
  normalizeContentModel,
  normalizeResources,
  normalizeTaxonomyOptions,
  parsePositiveInteger,
  pathLabel,
  screenKind,
  toEditTargetFromNode,
} from "@/features/lcms/admin-operations/components/learning-resource-authoring-utils";

const screenMeta: Record<string, { title: string; description: string; icon: ReactNode }> = {
  "admin-learning-resources": {
    title: "Chủ đề học liệu",
    description: "Tạo môn học, xây cây chủ đề và gắn tài liệu theo một luồng duy nhất.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-structure": {
    title: "Cấu trúc",
    description: "Tổ chức môn học thành nhóm học liệu, chủ đề và unit/lesson để LMS hiển thị.",
    icon: <ListTree className="h-5 w-5" />,
  },
  "admin-learning-resource-list": {
    title: "Tài liệu",
    description: "Tra cứu và cập nhật học liệu đã gắn vào từng vị trí trong cấu trúc môn học.",
    icon: <LibraryBig className="h-5 w-5" />,
  },
  "admin-learning-resource-upload": {
    title: "Gắn link",
    description: "Dán link Google Drive/Google Slides và chọn nơi gắn trong cây học liệu.",
    icon: <LinkIcon className="h-5 w-5" />,
  },
  "admin-learning-resource-publish": {
    title: "Xuất bản",
    description: "Kiểm tra trạng thái sẵn sàng trước khi hiển thị trên LMS.",
    icon: <CheckCircle2 className="h-5 w-5" />,
  },
};

export function LearningResourceAuthoringWorkspace({ activeLeaf }: { activeLeaf: DashboardLeaf; onOpenLeaf?: (leafId: string) => void }) {
  const queryClient = useQueryClient();
  const [model, setModel] = useState<LearningResourceTaxonomyResponse>(emptyModel);
  const [resources, setResources] = useState<LearningResourceResourceCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [dialogState, setDialogState] = useState<TaxonomyDialogState>(null);
  const [editTarget, setEditTarget] = useState<TaxonomyEditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaxonomyDeleteTarget | null>(null);
  const [localContentItems, setLocalContentItems] = useState<LocalContentItem[]>(mockExplorerLocalContent);
  const [editingLocalContent, setEditingLocalContent] = useState<LocalContentEditTarget>(null);
  const paceStateUpdate = usePacedStateBatch();

  const refreshData = useCallback(async (options: { force?: boolean } = {}) => {
    setLoading(true);
    try {
      if (USE_LEARNING_RESOURCE_AUTHORING_MOCK) {
        setModel(mockExplorerModel);
        setResources(mockExplorerResources);
        setLocalContentItems(mockExplorerLocalContent);
        return mockExplorerModel;
      }

      if (options.force) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.learningResourcesV2() });
        await queryClient.invalidateQueries({ queryKey: queryKeys.adminOperations.learningResourcesV2() });
      }

      const staleTime = options.force ? 0 : 60_000;
      const workspaceData = await queryClient.fetchQuery({
        queryKey: queryKeys.adminOperations.learningResourcesWorkspace(120),
        queryFn: () => loadLearningResourceStudioWorkspaceData(120),
        staleTime,
      });

      const normalizedSubjects = normalizeTaxonomyOptions(workspaceData.subjects);
      const nextModel = normalizedSubjects.length
        ? { ...normalizeContentModel(workspaceData.taxonomy), subjects: normalizedSubjects }
        : mockExplorerModel;
      const nextResources = normalizeResources(workspaceData.resources.data);
      setModel(nextModel);
      setResources(nextResources.length ? nextResources : mockExplorerResources);
      return nextModel;
    } catch {
      setModel(mockExplorerModel);
      setResources(mockExplorerResources);
      return mockExplorerModel;
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;
    paceStateUpdate(() => {
      void refreshData().finally(() => {
        if (!mounted) return;
      });
    });
    return () => {
      mounted = false;
    };
  }, [paceStateUpdate, refreshData]);

  const subjects = useMemo(() => buildSubjects(model, resources), [model, resources]);
  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) ?? subjects[0];
  const allNodes = selectedSubject ? flattenNodes(selectedSubject.tree) : [];
  const selectedNode = selectedSubject && selectedNodeId ? findNode(selectedSubject.tree, selectedNodeId) : undefined;
  const selectedPath = selectedSubject && selectedNode ? findPath(selectedSubject.tree, selectedNode.id) : [];

  useEffect(() => {
    paceStateUpdate(() => {
    if (!selectedSubject && subjects[0]) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedNodeId("");
      return;
    }
    if (selectedSubject && !subjects.some((subject) => subject.id === selectedSubjectId)) {
      setSelectedSubjectId(selectedSubject.id);
    }
    });
  }, [paceStateUpdate, selectedSubject, selectedSubjectId, subjects]);

  const filteredSubjects = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase();
    if (!keyword) return subjects;
    return subjects.filter((subject) => `${subject.label} ${subject.description ?? ""}`.toLowerCase().includes(keyword));
  }, [debouncedQuery, subjects]);

  const currentScreen = screenKind(activeLeaf.id);
  const meta = screenMeta[activeLeaf.id] ?? screenMeta["admin-learning-resources"];
  void meta;
  void loading;
  const selectedSubjectTarget = useMemo(
    () =>
      selectedSubject
        ? {
            kind: "subject" as const,
            id: selectedSubject.id,
            label: selectedSubject.label,
            description: selectedSubject.description,
            status: selectedSubject.status,
            metadata: selectedSubject.metadata,
          }
        : undefined,
    [selectedSubject],
  );
  const selectedNodeTarget = useMemo(() => toEditTargetFromNode(selectedNode), [selectedNode]);
  const openCreateSubjectDialog = useCallback(() => setDialogState({ mode: "subject" }), []);
  const openCreateRootDialog = useCallback(() => setDialogState({ mode: "root" }), []);
  const openCreateChildDialog = useCallback((option?: "section" | "lecture" | "exercise") => {
    setDialogState({ mode: "child", initialOption: option });
  }, []);
  const selectStructureSubject = useCallback((subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedNodeId("");
  }, []);
  const editSelectedSubject = useCallback(() => {
    if (selectedSubjectTarget) setEditTarget(selectedSubjectTarget);
  }, [selectedSubjectTarget]);
  const deleteSelectedSubject = useCallback(() => {
    if (selectedSubjectTarget) setDeleteTarget(selectedSubjectTarget);
  }, [selectedSubjectTarget]);
  const editSelectedNode = useCallback(() => {
    if (selectedNodeTarget) {
      setEditTarget(selectedNodeTarget);
      return;
    }
    if (selectedSubjectTarget) setEditTarget(selectedSubjectTarget);
  }, [selectedNodeTarget, selectedSubjectTarget]);
  const deleteSelectedNode = useCallback(() => {
    if (selectedNodeTarget) {
      setDeleteTarget(selectedNodeTarget);
      return;
    }
    if (selectedSubjectTarget) setDeleteTarget(selectedSubjectTarget);
  }, [selectedNodeTarget, selectedSubjectTarget]);
  const updateLocalContentItem = useCallback((itemId: string, patch: Partial<LocalContentItem>) => {
    setLocalContentItems((current) => current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)));
  }, []);
  const deleteLocalContentItem = useCallback((itemId: string) => {
    setLocalContentItems((current) => current.filter((item) => item.id !== itemId));
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {currentScreen === "subjects" ? (
        <SubjectsScreen
          subjects={filteredSubjects}
          query={query}
          onQueryChange={setQuery}
          selectedSubject={selectedSubject}
          onSelectSubject={setSelectedSubjectId}
          onCreateSubject={openCreateSubjectDialog}
          onEditSubject={(subject) => setEditTarget({ kind: "subject", id: subject.id, label: subject.label, description: subject.description, status: subject.status, metadata: subject.metadata })}
          onDeleteSubject={(subject) => setDeleteTarget({ kind: "subject", id: subject.id, label: subject.label, description: subject.description, status: subject.status, metadata: subject.metadata })}
        />
      ) : null}
      {currentScreen === "structure" ? (
        <StructureScreen
          subjects={subjects}
          selectedSubject={selectedSubject}
          selectedNode={selectedNode}
          selectedPath={selectedPath}
          onSelectSubject={selectStructureSubject}
          onSelectNode={setSelectedNodeId}
          onCreateSubject={openCreateSubjectDialog}
          onCreateRoot={openCreateRootDialog}
          onCreateChild={openCreateChildDialog}
          onEditSubject={editSelectedSubject}
          onDeleteSubject={deleteSelectedSubject}
          onEditSelection={editSelectedNode}
          onDeleteSelection={deleteSelectedNode}
          onEditNodeSelection={(node) => {
            const target = toEditTargetFromNode(node);
            if (target) setEditTarget(target);
          }}
          onDeleteNodeSelection={(node) => {
            const target = toEditTargetFromNode(node);
            if (target) setDeleteTarget(target);
          }}
          localContentItems={localContentItems}
          onEditLocalContent={(item) => setEditingLocalContent(item)}
          onDeleteLocalContent={deleteLocalContentItem}
          onRefreshData={() => refreshData({ force: true }).then(() => undefined)}
          resources={resources}
        />
      ) : null}
      {currentScreen === "resources" ? <ResourcesScreen subjects={subjects} resources={resources} /> : null}
      {currentScreen === "upload" ? <UploadScreen subjects={subjects} selectedSubject={selectedSubject} allNodes={allNodes} /> : null}
      {currentScreen === "publish" ? <PublishScreen subjects={subjects} resources={resources} /> : null}
      <TaxonomyCreateDialog
        key={dialogState ? `open-${dialogState.mode}-${dialogState.initialOption ?? ""}` : "closed"}
        state={dialogState}
        selectedSubject={selectedSubject}
        selectedNode={selectedNode}
        selectedPath={selectedPath}
        onClose={() => setDialogState(null)}
        onCreateLocalContent={async (items) => {
          setLocalContentItems((current) => [...items, ...current]);
          setDialogState(null);
        }}
        onCreateLecture={async (payload) => {
          await createLearningResourceResource(payload);
          await refreshData({ force: true });
          setDialogState(null);
        }}
        onUploadResource={async () => {
          await refreshData({ force: true });
          setDialogState(null);
        }}
        onCreated={async ({ mode, kind, id }) => {
          const nextModel = await refreshData({ force: true });
          if (mode === "subject") {
            setSelectedSubjectId(id);
            setSelectedNodeId("");
            return;
          }
          const subjectStillExists = nextModel.subjects.some((subject) => subject.id === selectedSubject?.id);
          if (selectedSubject?.id && subjectStillExists) setSelectedSubjectId(selectedSubject.id);
          setSelectedNodeId(nodeIdForCreated(kind, id));
        }}
      />
      <TaxonomyEditDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={async () => {
          await refreshData({ force: true });
          setEditTarget(null);
        }}
      />
      <TaxonomyDeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={async () => {
          await refreshData({ force: true });
          setDeleteTarget(null);
          if (deleteTarget?.kind === "subject") {
            setSelectedSubjectId("");
            setSelectedNodeId("");
          } else if (deleteTarget?.id === selectedNode?.optionId) {
            setSelectedNodeId("");
          }
        }}
      />
      <LocalContentEditDialog
        target={editingLocalContent}
        onClose={() => setEditingLocalContent(null)}
        onSaved={(patch) => {
          if (!editingLocalContent) return;
          updateLocalContentItem(editingLocalContent.id, patch);
          setEditingLocalContent(null);
        }}
      />
    </div>
  );
}

function SubjectsScreen({
  subjects,
  query,
  onQueryChange,
  selectedSubject,
  onSelectSubject,
  onCreateSubject,
  onEditSubject,
  onDeleteSubject,
}: {
  subjects: StudioSubject[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedSubject?: StudioSubject;
  onSelectSubject: (id: string) => void;
  onCreateSubject: () => void;
  onEditSubject: (subject: StudioSubject) => void;
  onDeleteSubject: (subject: StudioSubject) => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Danh sách môn học</CardTitle>
              <CardDescription>Mỗi môn có thể có nhiều nhóm học liệu, chủ đề và unit khác nhau.</CardDescription>
            </div>
            <Button onClick={onCreateSubject} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">
              <Plus className="h-4 w-4" />
              Tạo môn học
            </Button>
          </div>
          <SearchInput value={query} onChange={onQueryChange} placeholder="Tìm môn học, chương trình, bộ sách" />
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-[#e0e4ea]">
            <div className="grid grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] bg-[#f7f8fa] px-4 py-3 text-[11px] font-semibold text-slate-600">
              <span>Môn học</span>
              <span>Category</span>
              <span>Tài liệu</span>
              <span>Trạng thái</span>
              <span className="text-right">Thao tác</span>
            </div>
            {subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className={cn(
                  "grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_120px_120px_120px_120px] items-center gap-3 border-t border-[#e0e4ea] px-4 py-4 text-left hover:bg-[#f7f8fa]",
                  selectedSubject?.id === subject.id ? "bg-[#ebf3fc]" : "bg-white",
                )}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-slate-950">{subject.label}</span>
                  <span className="mt-1 block truncate text-sm text-slate-500">{subject.description || "Chưa có mô tả."}</span>
                </span>
                <span className="text-sm font-semibold text-slate-700">{subject.groupCount}</span>
                <span className="text-sm font-semibold text-slate-700">{subject.resourceCount}</span>
                <span>
                  <Badge tone={subject.status === "ACTIVE" || subject.status === "active" ? "success" : "outline"}>{getPublishStatusLabel(subject.status)}</Badge>
                </span>
                <span className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onEditSubject(subject);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSubject(subject);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Môn đang chọn</CardTitle>
          <CardDescription>Thông tin tổng quát trước khi vào cấu trúc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedSubject ? (
            <>
              <div className="rounded-lg border border-[#e0e4ea] bg-[#fafbfc] p-5">
                <div className="text-xl font-medium text-slate-950">{selectedSubject.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{selectedSubject.description || "Môn này chưa có mô tả."}</p>
              </div>
              <InfoRow label="Nhóm học liệu" value={`${selectedSubject.groupCount} nhóm`} />
              <InfoRow label="Bài học" value={`${selectedSubject.lessonCount} bài`} />
              <InfoRow label="Tài liệu" value={`${selectedSubject.resourceCount} tài liệu`} />
              <InfoRow label="Trạng thái" value={getPublishStatusLabel(selectedSubject.status)} />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => onEditSubject(selectedSubject)}>
                  <Pencil className="h-4 w-4" />
                  Sửa môn
                </Button>
                <Button variant="destructive" onClick={() => onDeleteSubject(selectedSubject)}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </>
          ) : (
            <EmptyState title="Chưa chọn môn" description="Chọn một môn ở danh sách để xem chi tiết." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ResourcesScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: LearningResourceResourceCard[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Kho tài liệu</CardTitle>
            <CardDescription>Cập nhật thông tin, trạng thái và nơi gắn tài liệu.</CardDescription>
          </div>
          <Button className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">
            <LinkIcon className="h-4 w-4" />
            Gắn link tài liệu
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <SearchInput value="" onChange={() => undefined} placeholder="Tìm tài liệu" />
          <AppSelect className={inputClassName}>
            <option>Tất cả môn học</option>
            {subjects.map((subject) => (
              <option key={subject.id}>{subject.label}</option>
            ))}
          </AppSelect>
          <AppSelect className={inputClassName}>
            <option>Tất cả định dạng</option>
            <option>PDF</option>
            <option>PPTX</option>
            <option>Video</option>
            <option>Audio</option>
          </AppSelect>
        </div>
      </CardHeader>
      <CardContent>
        {resources.length ? (
          <div className="grid gap-3">
            {resources.map((resource) => (
              <div key={resource.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--erg-blue-light)] text-[var(--erg-blue)]">
                  <LibraryBig className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-slate-950">{resource.title}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {resource.fileTypeBadge || resource.selectedFileType} · {getPublishStatusLabel(resource.status)}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Cập nhật
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Chưa có tài liệu" description="Khi BE trả resources, danh sách sẽ hiển thị ở đây để cập nhật riêng." />
        )}
      </CardContent>
    </Card>
  );
}

function UploadScreen({
  subjects,
  selectedSubject,
  allNodes,
}: {
  subjects: StudioSubject[];
  selectedSubject?: StudioSubject;
  allNodes: StudioNode[];
}) {
  const [subjectId, setSubjectId] = useState(selectedSubject?.id ?? "");
  const subject = subjects.find((item) => item.id === subjectId) ?? selectedSubject ?? subjects[0];
  const subjectNodes = useMemo(() => (subject ? flattenNodes(subject.tree) : allNodes), [allNodes, subject]);
  const [nodeId, setNodeId] = useState(subjectNodes[0]?.id ?? "");
  const node = subjectNodes.find((item) => item.id === nodeId) ?? subjectNodes[0];
  const path = subject && node ? findPath(subject.tree, node.id) : [];
  const location = buildResourceLocation(path);
  const [title, setTitle] = useState("");
  const [fileType, setFileType] = useState("PDF");
  const [resourceUrl, setResourceUrl] = useState("");
  const [totalSlides, setTotalSlides] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const paceStateUpdate = usePacedStateBatch();
  const form = useForm({
    defaultValues: { title, fileType, resourceUrl, totalSlides },
    onSubmit: () => handleUpload(),
  });

  useEffect(() => {
    if (!subjectId && selectedSubject?.id) {
      paceStateUpdate(() => setSubjectId(selectedSubject.id));
    }
  }, [paceStateUpdate, selectedSubject?.id, subjectId]);

  useEffect(() => {
    paceStateUpdate(() => setNodeId(subjectNodes[0]?.id ?? ""));
  }, [paceStateUpdate, subject?.id, subjectNodes]);

  async function handleUpload() {
    const normalizedUrl = normalizeGoogleViewerUrl(resourceUrl);
    if (!normalizedUrl || !subject || !location.categoryId) {
      setMessage("Vui lòng chọn môn, vị trí có nhóm học liệu và dán link Google Drive/Google Slides.");
      return;
    }
    const parsedTotalSlides = parsePositiveInteger(totalSlides);
    if (fileType === "PPTX" && totalSlides.trim() && !parsedTotalSlides) {
      setMessage("Tổng số slide phải là số nguyên lớn hơn 0.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await uploadLearningResourceResource({
        title: title.trim() || "Tài liệu Google Drive",
        selectedFileType: fileType,
        subjectId: subject.id,
        programSlug: subject.id,
        categoryId: location.categoryId,
        sectionId: location.sectionId,
        bookSeriesId: location.bookSeriesId,
        topicId: location.topicId,
        documentTypeId: location.categoryId,
        status: "published",
        visibility: "public",
        upstreamUrl: normalizedUrl,
        totalSlides: parsedTotalSlides,
        canDownload: fileType !== "PPTX",
      });
      setMessage("Đã lưu link và gắn tài liệu vào đúng vị trí trong cây học liệu.");
      setTitle("");
      setResourceUrl("");
      setTotalSlides("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không lưu được link tài liệu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Gắn tài liệu bằng link</CardTitle>
          <CardDescription>Chọn môn, vị trí trong cấu trúc và dán link Google Drive/Google Slides để giáo viên mở trực tiếp.</CardDescription>
        </CardHeader>
        <CardContent>
          <TsForm
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void form.handleSubmit();
            }}
          >
            <Field label="Môn học">
              <AppSelect className={inputClassName} value={subject?.id ?? ""} onChange={(event) => setSubjectId(event.target.value)}>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </AppSelect>
            </Field>
            <Field label="Gắn vào vị trí">
              <AppSelect className={inputClassName} value={node?.id ?? ""} onChange={(event) => setNodeId(event.target.value)}>
                {subjectNodes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {pathLabel(subject?.label ?? "", findPath(subject?.tree ?? [], item.id))}
                  </option>
                ))}
              </AppSelect>
            </Field>
            <Field label="Tên hiển thị">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Bài giảng Unit 1" />
            </Field>
            <Field label="Loại tài liệu">
              <AppSelect className={inputClassName} value={fileType} onChange={(event) => setFileType(event.target.value)}>
                <option value="PPTX">Bài giảng điện tử</option>
                <option value="PDF">PDF / Giáo trình</option>
                <option value="AUDIO">Audio</option>
                <option value="VIDEO">Video</option>
                <option value="ZIP">Gói học liệu ZIP</option>
                <option value="HTML5">HTML5</option>
              </AppSelect>
            </Field>
            <div className="md:col-span-2">
              <Field label="Link Google Drive / Google Slides">
                <Input
                  value={resourceUrl}
                  onChange={(event) => setResourceUrl(event.target.value)}
                  placeholder="Dán link share, preview hoặc embed từ Google Drive"
                />
                <p className="text-xs leading-5 text-slate-500">
                  FE sẽ lưu link vào asset, không upload file thật. Link Google Drive dạng `/file/d/.../view` sẽ được chuẩn hóa về `/preview`.
                </p>
              </Field>
            </div>
            {fileType === "PPTX" ? (
              <div className="md:col-span-2">
                <Field label="Tổng số slide">
                  <Input
                    value={totalSlides}
                    onChange={(event) => setTotalSlides(event.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="Ví dụ: 20"
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    Dùng cho popup xác nhận khi giáo viên back hoặc tắt bài trình chiếu.
                  </p>
                </Field>
              </div>
            ) : null}
            {message ? <div className="md:col-span-2 rounded-lg border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-4 py-3 text-sm font-semibold text-[var(--erg-blue)]">{message}</div> : null}
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving || !resourceUrl.trim() || !subject || !location.categoryId} className="bg-[var(--erg-blue)] hover:bg-[var(--erg-blue-hover)]">
                {saving ? "Đang lưu..." : "Lưu link và gắn tài liệu"}
              </Button>
            </div>
          </TsForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin vị trí</CardTitle>
          <CardDescription>Giúp giáo viên kiểm tra link sẽ được gắn vào đâu trước khi lưu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <InfoRow label="Môn" value={subject?.label ?? "Chưa chọn"} />
          <InfoRow label="Vị trí" value={pathLabel(subject?.label ?? "", path) || "Chưa chọn"} />
          <InfoRow label="Loại" value={node ? getNodeKindLabel(node.kind) : "Chưa chọn"} />
          <ChecklistItem label={location.categoryId ? "Đã xác định nhóm học liệu" : "Cần chọn một nhóm học liệu"} />
          <ChecklistItem label={resourceUrl.trim() ? "Đã nhập link tài liệu" : "Chưa nhập link tài liệu"} />
        </CardContent>
      </Card>
    </div>
  );
}

function PublishScreen({ subjects, resources }: { subjects: StudioSubject[]; resources: LearningResourceResourceCard[] }) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <PublishCard title="Môn học" value={subjects.length} description="Sẵn sàng đưa vào catalog." />
      <PublishCard title="Tài liệu" value={resources.length} description="Đang có trong kho học liệu." />
      <PublishCard title="Cần kiểm tra" value={resources.filter((item) => item.status !== "published").length} description="Chưa ở trạng thái đã xuất bản." />
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Luồng xuất bản đề xuất</CardTitle>
          <CardDescription>Tách khỏi màn hình tạo cấu trúc để admin kiểm tra trước khi public.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <PublishStep icon={<BookOpen className="h-5 w-5" />} title="Môn học" description="Có tên, mô tả và trạng thái." />
          <PublishStep icon={<ListTree className="h-5 w-5" />} title="Cấu trúc" description="Có nhóm học liệu, chủ đề và unit/lesson." />
          <PublishStep icon={<LinkIcon className="h-5 w-5" />} title="Tài liệu" description="Link tài liệu đã được gắn đúng vị trí." />
          <PublishStep icon={<Settings2 className="h-5 w-5" />} title="Public" description="Kiểm tra visibility trước khi lên web." />
        </CardContent>
      </Card>
    </div>
  );
}
