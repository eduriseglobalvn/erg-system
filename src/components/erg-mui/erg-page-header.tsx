import { useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

import { ErgIconButton } from "./erg-actions";

export type ErgPageHeaderAction = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

type ErgPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Đúng một nút chính (contained), do trang truyền vào. */
  primaryAction?: ReactNode;
  /** Các hành động còn lại, gom vào menu "⋯". */
  secondaryActions?: ErgPageHeaderAction[];
};

export function ErgPageHeader({ title, description, primaryAction, secondaryActions = [] }: ErgPageHeaderProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ alignItems: "flex-start", display: "flex", gap: 2, justifyContent: "space-between", mb: 3 }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 600, lineHeight: 1.3 }}>
          {title}
        </Typography>
        {description ? (
          <Typography sx={{ color: "text.secondary", fontSize: 14, mt: 0.5 }}>{description}</Typography>
        ) : null}
      </Box>
      {primaryAction || secondaryActions.length ? (
        <Box sx={{ alignItems: "center", display: "flex", flexShrink: 0, gap: 1 }}>
          {secondaryActions.length ? (
            <>
              <ErgIconButton label="Thao tác khác" onClick={(event) => setAnchor(event.currentTarget)}>
                <MoreHorizIcon />
              </ErgIconButton>
              <Menu anchorEl={anchor} onClose={() => setAnchor(null)} open={Boolean(anchor)}>
                {secondaryActions.map((action) => (
                  <MenuItem
                    disabled={action.disabled}
                    key={action.label}
                    onClick={() => {
                      setAnchor(null);
                      action.onClick();
                    }}
                  >
                    {action.label}
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : null}
          {primaryAction}
        </Box>
      ) : null}
    </Box>
  );
}
