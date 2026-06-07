import { Children, isValidElement, useMemo, useState, type ChangeEvent, type ReactElement, type ReactNode, type SelectHTMLAttributes } from "react";

import { Select, SelectContent, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const emptyValue = "__app_select_empty__";

type OptionModel = {
  disabled?: boolean;
  label: string;
  value: string;
};

type GroupModel = {
  label: string;
  options: OptionModel[];
};

type AppSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "multiple" | "size"> & {
  children?: ReactNode;
  /**
   * When "native", renders a lightweight native <select> element instead of Radix Select.
   * Use this for high-frequency renders (table cells, repeated filter bars).
   * Defaults to "custom" (Radix Select).
   */
  variant?: "custom" | "native";
};

export function AppSelect({
  "aria-label": ariaLabel,
  children,
  className,
  defaultValue,
  disabled,
  onChange,
  style,
  value,
  variant = "custom",
  ...props
}: AppSelectProps) {
  const groups = useMemo(() => parseSelectChildren(children), [children]);
  const flatOptions = groups.flatMap((group) => group.options);
  const initialValue = normalizeValue(String(defaultValue ?? value ?? flatOptions.find((option) => !option.disabled)?.value ?? ""));
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const selectedValue = value === undefined ? uncontrolledValue : normalizeValue(String(value));
  const isClassificationSelect = (props as Record<string, unknown>)["data-classification-select"] === "true" || (props as Record<string, unknown>)["data-classification-select"] === true;
  const triggerProps = pickTriggerProps(props);

  // Lightweight native <select> path – no Radix runtime overhead
  if (variant === "native") {
    const nativeValue = value === undefined ? uncontrolledValue : String(value);
    return (
      <select
        aria-label={ariaLabel}
        disabled={disabled}
        style={style}
        value={nativeValue}
        onChange={(event) => {
          if (value === undefined) setUncontrolledValue(event.target.value);
          onChange?.(event as unknown as ChangeEvent<HTMLSelectElement>);
        }}
        className={cn(
          "erg-select-native h-10 min-w-[150px] rounded-lg text-sm font-medium",
          isClassificationSelect && "erg-grade-pill min-w-0 justify-center px-5 text-center",
          className,
        )}
        {...triggerProps}
      >
        {flatOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  function handleValueChange(nextValue: string) {
    const nativeValue = denormalizeValue(nextValue);
    if (value === undefined) setUncontrolledValue(nextValue);
    onChange?.({ target: { value: nativeValue }, currentTarget: { value: nativeValue } } as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange} disabled={disabled}>
      <SelectTrigger
        aria-label={ariaLabel}
        hideIcon={isClassificationSelect}
        style={style}
        className={cn(
          "h-10 min-w-[150px] rounded-[10px] border-[var(--border)] bg-[var(--card)] px-3.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-xs)] hover:border-[var(--muted-foreground)]/30",
          isClassificationSelect && "relative min-w-0 justify-center px-5 text-center shadow-none *:data-[slot=select-value]:w-full *:data-[slot=select-value]:justify-center",
          className,
        )}
        {...triggerProps}
      >
        <SelectValue />
        {isClassificationSelect ? <ClassificationDropdownHint /> : null}
      </SelectTrigger>
      <SelectContent position="popper" align="start" className="p-1 shadow-lg shadow-slate-900/10">
        {groups.map((group, groupIndex) => (
          <SelectGroupBlock key={`${group.label}-${groupIndex}`} group={group} showLabel={groups.length > 1 || Boolean(group.label)} />
        ))}
      </SelectContent>
    </Select>
  );
}

function pickTriggerProps(props: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(props).filter(([key]) => key.startsWith("data-") || key.startsWith("aria-") || key === "id" || key === "title"));
}

function ClassificationDropdownHint() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-[60%] rotate-45 border-b border-r border-current opacity-45"
    />
  );
}

function SelectGroupBlock({ group, showLabel }: { group: GroupModel; showLabel: boolean }) {
  return (
    <>
      {showLabel ? <SelectLabel>{group.label}</SelectLabel> : null}
      {group.options.map((option) => (
        <SelectItem key={option.value} value={normalizeValue(option.value)} disabled={option.disabled} className="font-medium">
          {option.label}
        </SelectItem>
      ))}
      {showLabel ? <SelectSeparator /> : null}
    </>
  );
}

function parseSelectChildren(children: ReactNode): GroupModel[] {
  const groups: GroupModel[] = [{ label: "", options: [] }];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const element = child as ReactElement<{ children?: ReactNode; disabled?: boolean; label?: string; value?: string }>;
    if (element.type === "option") {
      groups[0].options.push(parseOptionElement(element));
      return;
    }
    if (element.type === "optgroup") {
      groups.push({
        label: element.props.label ?? "",
        options: Children.toArray(element.props.children).filter(isValidElement).map((option) => parseOptionElement(option as ReactElement<{ children?: ReactNode; disabled?: boolean; value?: string }>)),
      });
    }
  });

  return groups.filter((group) => group.options.length > 0);
}

function parseOptionElement(element: ReactElement<{ children?: ReactNode; disabled?: boolean; value?: string }>): OptionModel {
  const label = optionLabel(element.props.children);
  return {
    disabled: element.props.disabled,
    label,
    value: String(element.props.value ?? label),
  };
}

function optionLabel(children: ReactNode): string {
  return Children.toArray(children).join("");
}

function normalizeValue(value: string) {
  return value === "" ? emptyValue : value;
}

function denormalizeValue(value: string) {
  return value === emptyValue ? "" : value;
}
