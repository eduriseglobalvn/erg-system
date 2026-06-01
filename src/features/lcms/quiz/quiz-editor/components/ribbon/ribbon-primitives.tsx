import type { ReactNode } from "react";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { cn } from "@/utils/cn";

export function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="classic-editor__ribbon-group">
      {children}
      <div className="classic-editor__group-label">{label}</div>
    </section>
  );
}

export function ToolbarButton({
  label,
  iconNode,
  tone = "default",
  caret = false,
  size = "regular",
  active = false,
  onClick,
}: {
  label: string;
  iconNode?: ReactNode;
  tone?: "default" | "muted";
  caret?: boolean;
  size?: "narrow" | "regular" | "wide";
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "classic-editor__toolbar-button",
        tone === "muted" && "is-muted",
        active && "is-active",
        size === "narrow" && "is-narrow",
        size === "wide" && "is-wide",
      )}
    >
      <span className="classic-editor__toolbar-icon">{iconNode}</span>
      <span className="classic-editor__toolbar-text">{label}</span>
      {caret ? <ArrowDropDownIcon className="classic-editor__toolbar-caret h-3 w-3" fontSize="inherit" /> : <span className="h-3" />}
    </button>
  );
}

export function PptGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="classic-editor__ppt-group">
      <div className="classic-editor__ppt-group-inner">{children}</div>
      <div className="classic-editor__ppt-group-label">{label}</div>
    </section>
  );
}

export function PptTool({
  label,
  icon,
  large = false,
  muted = false,
  active = false,
  caret = false,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  large?: boolean;
  muted?: boolean;
  active?: boolean;
  caret?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "classic-editor__ppt-tool",
        large && "is-large",
        muted && "is-muted",
        active && "is-active",
      )}
    >
      <span className="classic-editor__ppt-tool-icon">{icon}</span>
      <span className="classic-editor__ppt-tool-label">{label}</span>
      {caret ? <ArrowDropDownIcon className="h-3 w-3 text-[#7d7d7d]" fontSize="inherit" /> : null}
    </button>
  );
}

export function PptWideControl({ children }: { children: ReactNode }) {
  return <div className="classic-editor__ppt-control classic-editor__ppt-control--wide">{children}</div>;
}

export function PptSmallControl({ children }: { children: ReactNode }) {
  return <div className="classic-editor__ppt-control classic-editor__ppt-control--small">{children}</div>;
}

export function PptMiniTools({ items, grid = false }: { items: string[]; grid?: boolean }) {
  return (
    <div className={cn("classic-editor__ppt-mini-tools", grid && "is-grid")}>
      {items.map((item) => (
        <span key={item} className="classic-editor__ppt-mini-tool">
          {item}
        </span>
      ))}
    </div>
  );
}
