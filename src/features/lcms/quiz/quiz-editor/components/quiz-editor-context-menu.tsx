import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { cn } from "@/utils/cn";

export type QuizEditorContextMenuItem = {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  dividerBefore?: boolean;
  onSelect?: () => void;
  children?: QuizEditorContextMenuItem[];
};

export function QuizEditorContextMenu({
  open,
  position,
  items,
  onClose,
}: {
  open: boolean;
  position: { x: number; y: number } | null;
  items: QuizEditorContextMenuItem[];
  onClose: () => void;
}) {
  const [activePath, setActivePath] = useState<number[]>([]);
  const [adjustedPosition, setAdjustedPosition] = useState<{ x: number; y: number } | null>(position);
  const rootMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-quiz-context-menu='true']")) onClose();
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (!open || !position || !rootMenuRef.current) return;

    const viewportPadding = 8;
    const rect = rootMenuRef.current.getBoundingClientRect();
    let nextX = position.x;
    let nextY = position.y;

    if (nextX + rect.width > window.innerWidth - viewportPadding) {
      nextX = Math.max(viewportPadding, window.innerWidth - rect.width - viewportPadding);
    }

    if (nextY + rect.height > window.innerHeight - viewportPadding) {
      nextY = Math.max(viewportPadding, position.y - rect.height);
    }

    if (nextY < viewportPadding) {
      nextY = viewportPadding;
    }

    if (nextX < viewportPadding) {
      nextX = viewportPadding;
    }

    if (nextX !== adjustedPosition?.x || nextY !== adjustedPosition?.y) {
      setAdjustedPosition({ x: nextX, y: nextY });
    }
  }, [adjustedPosition?.x, adjustedPosition?.y, open, position]);

  const rootStyle = useMemo(() => {
    if (!adjustedPosition) return undefined;
    return { left: adjustedPosition.x, top: adjustedPosition.y };
  }, [adjustedPosition]);

  if (!open || !position) return null;

  return createPortal(
    <div data-quiz-context-menu="true" className="classic-editor__context-anchor" style={rootStyle}>
      <MenuPanel
        menuRef={rootMenuRef}
        items={items}
        depth={0}
        activePath={activePath}
        onSetActivePath={setActivePath}
        onClose={onClose}
      />
    </div>,
    document.body,
  );
}

function MenuPanel({
  items,
  depth,
  activePath,
  onSetActivePath,
  onClose,
  menuRef,
}: {
  items: QuizEditorContextMenuItem[];
  depth: number;
  activePath: number[];
  onSetActivePath: (path: number[]) => void;
  onClose: () => void;
  menuRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={menuRef}
      data-quiz-context-menu="true"
      className={cn("classic-editor__context-menu", depth > 0 && "is-submenu")}
    >
      {items.map((item, index) => {
        const currentPath = [...activePath.slice(0, depth), index];
        const isActive = activePath[depth] === index;

        return (
          <div key={`${item.label}-${index}`}>
            {item.dividerBefore ? <div className="classic-editor__context-divider" /> : null}
            <button
              type="button"
              data-quiz-context-menu="true"
              disabled={item.disabled}
              className={cn("classic-editor__context-item", item.disabled && "is-disabled")}
              onMouseEnter={() => onSetActivePath(currentPath)}
              onClick={() => {
                if (item.disabled) return;
                if (item.children?.length) {
                  onSetActivePath(currentPath);
                  return;
                }
                item.onSelect?.();
                onClose();
              }}
            >
              <span className="classic-editor__context-icon">{item.icon ?? ""}</span>
              <span className="classic-editor__context-label">{item.label}</span>
              <span className="classic-editor__context-arrow">
                {item.children?.length ? <ChevronRightIcon fontSize="inherit" /> : null}
              </span>
            </button>

            {item.children?.length && isActive ? (
              <SubmenuPanel
                items={item.children}
                depth={depth + 1}
                activePath={activePath}
                onSetActivePath={onSetActivePath}
                onClose={onClose}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function SubmenuPanel({
  items,
  depth,
  activePath,
  onSetActivePath,
  onClose,
}: {
  items: QuizEditorContextMenuItem[];
  depth: number;
  activePath: number[];
  onSetActivePath: (path: number[]) => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [placement, setPlacement] = useState<{ horizontal: "right" | "left"; top: number }>({
    horizontal: "right",
    top: 0,
  });

  useLayoutEffect(() => {
    if (!wrapRef.current || !menuRef.current) return;

    const viewportPadding = 8;
    const wrapRect = wrapRef.current.getBoundingClientRect();
    const menuRect = menuRef.current.getBoundingClientRect();

    let horizontal: "right" | "left" = "right";
    let top = 0;

    if (wrapRect.right + menuRect.width + 6 > window.innerWidth - viewportPadding) {
      horizontal = "left";
    }

    if (wrapRect.top + menuRect.height > window.innerHeight - viewportPadding) {
      top = window.innerHeight - viewportPadding - wrapRect.top - menuRect.height;
    }

    if (wrapRect.top + top < viewportPadding) {
      top = viewportPadding - wrapRect.top;
    }

    setPlacement((current) =>
      current.horizontal === horizontal && current.top === top ? current : { horizontal, top },
    );
  }, [items]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "classic-editor__context-submenu-wrap",
        placement.horizontal === "left" && "is-open-left",
      )}
      style={{ top: placement.top }}
    >
      <MenuPanel
        menuRef={menuRef}
        items={items}
        depth={depth}
        activePath={activePath}
        onSetActivePath={onSetActivePath}
        onClose={onClose}
      />
    </div>
  );
}
