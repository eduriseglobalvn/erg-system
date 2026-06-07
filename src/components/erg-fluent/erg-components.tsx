import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Toolbar,
  ToolbarButton,
  type BadgeProps,
  type ButtonProps,
  type CheckboxProps,
  type DropdownProps,
  type InputProps,
  type TableProps,
  type ToolbarButtonProps,
} from "@fluentui/react-components";
import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ErgButton({ className, ...props }: ButtonProps) {
  return <Button className={cn("rounded-md font-medium", className)} {...props} />;
}

export function ErgInput({ className, ...props }: InputProps) {
  return <Input className={cn("rounded-md", className)} {...props} />;
}

export function ErgDropdown({
  className,
  options,
  ...props
}: DropdownProps & { options?: Array<{ label: string; value: string }> }) {
  return (
    <Dropdown className={cn("rounded-md", className)} {...props}>
      {options?.map((option) => (
        <Option key={option.value} value={option.value}>
          {option.label}
        </Option>
      ))}
    </Dropdown>
  );
}

export function ErgCheckbox({ className, ...props }: CheckboxProps) {
  return <Checkbox className={cn("rounded-sm", className)} {...props} />;
}

export function ErgBadge({ className, ...props }: BadgeProps) {
  return <Badge appearance="tint" className={cn("rounded-md font-medium", className)} {...props} />;
}

export function ErgPanel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("rounded-lg border border-[#d9e0ea] bg-white shadow-sm", className)} {...props} />;
}

export function ErgCommandBar({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <Toolbar
      className={cn("min-h-10 rounded-lg border border-[#d9e0ea] bg-white px-2 shadow-sm", className)}
      {...props}
    />
  );
}

export function ErgCommandButton({ className, ...props }: ToolbarButtonProps) {
  return <ToolbarButton className={cn("rounded-md font-medium", className)} {...props} />;
}

export function ErgTable({ className, ...props }: TableProps) {
  return <Table className={cn("w-full text-[13px]", className)} {...props} />;
}

export { Dialog, DialogActions, DialogBody, DialogContent, DialogSurface, DialogTitle, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Text };

export function ErgTableShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("overflow-auto rounded-lg border border-[#d9e0ea] bg-white", className)}>{children}</div>;
}
