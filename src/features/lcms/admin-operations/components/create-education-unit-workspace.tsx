import { useForm } from "@tanstack/react-form";
import { useState, type FormEvent } from "react";
import { Building2, CheckCircle2, MapPin, School } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { TsForm, TsFormMessage } from "@/components/ui/tanstack-form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  createEducationUnit,
  type LmsEducationUnitDTO,
} from "@/features/lms/infrastructure/lms-dashboard-api";
import { cn } from "@/lib/utils";

type EducationUnitType = "system" | "school" | "center";

type CreateEducationUnitDialogProps = {
  onCreated?: (unit: LmsEducationUnitDTO) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const unitTypes: Array<{
  id: EducationUnitType;
  title: string;
  description: string;
  icon: typeof School;
  accentClassName: string;
}> = [
  {
    id: "system",
    title: "Hệ thống",
    description: "Dành cho phạm vi toàn hệ thống như ERG hoặc Hoclieu Studio.",
    icon: Building2,
    accentClassName: "bg-[var(--erg-blue-light)] text-[var(--erg-blue)] ring-[var(--erg-blue-ring)]",
  },
  {
    id: "school",
    title: "Trường",
    description: "Dành cho cơ sở có nhiều lớp, giáo viên và học sinh theo năm học.",
    icon: School,
    accentClassName: "bg-[var(--erg-blue-light)] text-[var(--erg-blue)] ring-[var(--erg-blue-ring)]",
  },
  {
    id: "center",
    title: "Trung tâm",
    description: "Dành cho đơn vị vận hành lớp theo ca học, khóa học hoặc điểm học.",
    icon: Building2,
    accentClassName: "bg-amber-50 text-amber-700 ring-amber-100",
  },
];

export function CreateEducationUnitDialog({
  onCreated,
  open,
  onOpenChange,
}: CreateEducationUnitDialogProps) {
  const [selectedType, setSelectedType] = useState<EducationUnitType>("school");
  const [unitName, setUnitName] = useState("");
  const [unitCode, setUnitCode] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createUnitMutation = useMutation({
    mutationFn: createEducationUnit,
  });
  const form = useForm({
    defaultValues: {
      unitName,
    },
    onSubmit: () => handleCreateUnit(),
  });

  async function handleCreateUnit() {
    setErrorMessage(null);

    try {
      const created = await createUnitMutation.mutateAsync({
        address: address.trim(),
        avatarUrl: avatarUrl.trim(),
        code: unitCode.trim() || createUnitCode(unitName),
        description: description.trim(),
        email: email.trim(),
        name: unitName.trim(),
        phone: phone.trim(),
        type: selectedType,
        website: website.trim(),
      });
      onCreated?.(created);
      setAddress("");
      setAvatarUrl("");
      setDescription("");
      setEmail("");
      setPhone("");
      setWebsite("");
      setUnitCode("");
      setUnitName("");
      onOpenChange(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể tạo cơ sở giáo dục.");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[760px] gap-0 p-0">
        <TsForm onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
            <div className="flex items-start gap-3 pr-8">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/10">
                <School className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle>Tạo cơ sở giáo dục</DialogTitle>
                <DialogDescription>
                  Chọn loại đơn vị và nhập thông tin tối thiểu để khởi tạo cấu trúc LMS.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-5 px-6 py-5">
            <section className="grid gap-3">
              <p className="text-xs font-semibold text-slate-400">
                Loại cơ sở
              </p>
              <div className="grid gap-3 lg:grid-cols-3">
                {unitTypes.map((unitType) => (
                  <EducationUnitTypeCard
                    key={unitType.id}
                    active={selectedType === unitType.id}
                    unitType={unitType}
                    onSelect={() => setSelectedType(unitType.id)}
                  />
                ))}
              </div>
            </section>

            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    Thông tin cơ bản
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Giữ form ngắn để admin tạo nhanh, các cấu hình nâng cao xử lý sau.
                  </p>
                </div>
                <span className="rounded-full border border-[#b8d6fa] bg-[var(--erg-blue-light)] px-2.5 py-1 text-xs font-semibold text-[var(--erg-blue)]">
                  {selectedType === "school" ? "Trường" : "Trung tâm"}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <form.Field
                  name="unitName"
                  validators={{
                    onChange: ({ value }) => value.trim() ? undefined : "Tên cơ sở là bắt buộc.",
                  }}
                >
                  {(field) => (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Tên cơ sở</span>
                  <Input
                    className="h-10 bg-white"
                    placeholder={selectedType === "school" ? "VD: ERG Alpha School" : "VD: ERG East Learning Point"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      field.handleChange(event.target.value);
                      setUnitName(event.target.value);
                    }}
                    aria-invalid={field.state.meta.errors.length ? "true" : undefined}
                  />
                  <TsFormMessage>{field.state.meta.errors[0]}</TsFormMessage>
                </label>
                  )}
                </form.Field>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Mã cơ sở</span>
                  <Input
                    className="h-10 bg-white"
                    placeholder="VD: ERG-ALPHA"
                    value={unitCode}
                    onChange={(event) => setUnitCode(event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Người phụ trách</span>
                  <Input className="h-10 bg-white" placeholder="Tên quản trị viên" />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">Số điện thoại</span>
                  <Input className="h-10 bg-white" placeholder="09xx xxx xxx" />
                </label>
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex items-start gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-600">
                <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <p className="leading-6">
                  Địa chỉ, phân quyền chi tiết, lớp học và giáo viên sẽ được bổ sung trong bước cấu hình sau khi tạo.
                </p>
              </div>
            </section>
          </div>

          <DialogFooter className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="lg">
                Hủy
              </Button>
            </DialogClose>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
            <Button type="submit" size="lg" disabled={!canSubmit || !unitName.trim() || createUnitMutation.isPending || isSubmitting}>
              Tạo cơ sở
            </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </TsForm>
      </DialogContent>
    </Dialog>
  );
}

function createUnitCode(value: string) {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();

  return normalized ? `ERG-${normalized.slice(0, 24)}` : `ERG-${Date.now()}`;
}

function EducationUnitTypeCard({
  active,
  onSelect,
  unitType,
}: {
  active: boolean;
  onSelect: () => void;
  unitType: (typeof unitTypes)[number];
}) {
  const Icon = unitType.icon;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex min-h-[118px] items-start gap-4 rounded-lg border bg-white p-4 text-left transition",
        "hover:border-[#b8d6fa] hover:shadow-sm",
        active ? "border-[#b8d6fa] shadow-sm ring-2 ring-[var(--erg-blue-ring)]" : "border-slate-200",
      )}
    >
      <span
        className={cn(
          "grid size-11 shrink-0 place-items-center rounded-lg ring-1",
          unitType.accentClassName,
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-base font-semibold text-slate-950">{unitType.title}</span>
          {active ? <CheckCircle2 className="size-4 text-[var(--erg-blue)]" /> : null}
        </span>
        <span className="mt-1.5 block text-sm leading-6 text-slate-500">
          {unitType.description}
        </span>
      </span>
    </button>
  );
}
