import { DesktopExerciseBankView } from "@/features/lms/components/exercise-bank/desktop-exercise-bank-view";
import { MobileExerciseBankView } from "@/features/lms/components/exercise-bank/mobile-exercise-bank-view";
import { QuickAssignDialog } from "@/features/lms/components/exercise-bank/quick-assign-dialog";
import { useExerciseBankController } from "@/features/lms/components/exercise-bank/use-exercise-bank-controller";
import { useLmsMobileBreakpoint } from "@/features/lms/mobile/hooks/use-lms-mobile-breakpoint";
import { PortablePackageCatalogDialog } from "@/features/portable-package-export/components/portable-package-catalog-dialog";
import { useAuthSession } from "@/platform/auth/hooks/use-auth-session";
import { evaluatePermission } from "@/platform/auth/permissions/permission-evaluator";

type ExerciseBankPageProps = {
  onBack: () => void;
  onAssign: (exerciseTitle: string) => void;
};

export function ExerciseBankPage({ onBack, onAssign }: ExerciseBankPageProps) {
  const isMobile = useLmsMobileBreakpoint("(max-width: 767px)");
  const controller = useExerciseBankController();
  const auth = useAuthSession("lms");
  const canExportPortable = evaluatePermission({
    permission: "lms.quiz.read",
    grantedPermissions: auth.session?.permissions,
    deniedPermissions: auth.session?.deniedPermissions,
  });
  const openPortableCatalog = canExportPortable ? () => controller.setPortableCatalogOpen(true) : undefined;

  return (
    <>
      {isMobile ? (
        <MobileExerciseBankView controller={controller} onAssign={controller.setQuickAssignTitle} onOpenPortable={openPortableCatalog} />
      ) : (
        <DesktopExerciseBankView controller={controller} onAssign={controller.setQuickAssignTitle} onBack={onBack} onOpenPortable={openPortableCatalog} />
      )}
      {controller.quickAssignExercise ? (
        <QuickAssignDialog
          exercise={controller.quickAssignExercise}
          onClose={() => controller.setQuickAssignTitle("")}
          onDone={(title) => {
            controller.setQuickAssignTitle("");
            onAssign(title);
          }}
        />
      ) : null}
      {controller.portableCatalogOpen ? (
        <PortablePackageCatalogDialog onClose={() => controller.setPortableCatalogOpen(false)} portal="lms" />
      ) : null}
    </>
  );
}
