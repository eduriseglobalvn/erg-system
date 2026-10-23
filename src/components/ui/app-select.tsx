import { Children, isValidElement, useMemo, useState, type ChangeEvent, type CSSProperties, type ReactElement, type ReactNode, type SelectHTMLAttributes } from "react";
import FormControl from "@mui/material/FormControl";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";

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
   * When "native", renders a lightweight native <select> element.
   * Use this for high-frequency renders (table cells, repeated filter bars).
   * Defaults to "custom" (MUI Select).
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
  const initialValue = String(defaultValue ?? value ?? flatOptions.find((option) => !option.disabled)?.value ?? "");
  const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
  const selectedValue = value === undefined ? uncontrolledValue : String(value);
  const isClassificationSelect =
    (props as Record<string, unknown>)["data-classification-select"] === "true" ||
    (props as Record<string, unknown>)["data-classification-select"] === true;
  const isQuizPlayerSelect =
    (props as Record<string, unknown>)["data-quiz-player-select"] === "true" ||
    (props as Record<string, unknown>)["data-quiz-player-select"] === true;
  const classificationValue = isClassificationSelect ? selectedValue.slice(0, 1).toUpperCase() : undefined;
  const passthrough = pickPassthroughProps(props);
  const customStyle = style as CSSProperties | undefined;

  // Lightweight native <select> path – no MUI runtime overhead
  if (variant === "native") {
    const nativeValue = value === undefined ? uncontrolledValue : String(value);
    return (
      <select
        aria-label={ariaLabel}
        className={className}
        data-classification={classificationValue}
        disabled={disabled}
        style={style as CSSProperties}
        value={nativeValue}
        onChange={(event) => {
          if (value === undefined) setUncontrolledValue(event.target.value);
          onChange?.(event as unknown as ChangeEvent<HTMLSelectElement>);
        }}
        {...passthrough}
      >
        {flatOptions.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  function handleChange(event: SelectChangeEvent<string>) {
    const nextValue = event.target.value;
    if (value === undefined) setUncontrolledValue(nextValue);
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    } as ChangeEvent<HTMLSelectElement>);
  }

  const showGroupLabels = groups.length > 1 || Boolean(groups[0]?.label);

  return (
    <FormControl
      size="small"
      disabled={disabled}
      sx={{ minWidth: isQuizPlayerSelect ? "clamp(220px, 14vw, 300px)" : 150 }}
      className={className}
      style={customStyle}
    >
      <Select
        aria-label={ariaLabel}
        data-classification={classificationValue}
        displayEmpty
        renderValue={(selected) => {
          const selectedOption = flatOptions.find((option) => option.value === selected);
          return selectedOption?.label ?? "";
        }}
        value={selectedValue}
        onChange={handleChange}
        MenuProps={
          isQuizPlayerSelect
            ? {
                slotProps: {
                  paper: {
                    sx: {
                      mt: 0.75,
                      border: "1px solid rgba(0,0,136,0.10)",
                      borderRadius: "12px",
                      boxShadow: "0 18px 44px rgba(28,37,46,0.16)",
                      overflow: "hidden",
                      "& .MuiMenuItem-root": {
                        fontSize: "var(--quiz-control-text-size)",
                        fontWeight: 750,
                        minHeight: 50,
                        px: 2.5,
                      },
                      "& .MuiMenuItem-root.Mui-selected": {
                        backgroundColor: "rgba(0,0,136,0.08)",
                        color: "#000088",
                        fontWeight: 850,
                      },
                      "& .MuiMenuItem-root.Mui-selected:hover": {
                        backgroundColor: "rgba(0,0,136,0.12)",
                      },
                    },
                  },
                },
              }
            : undefined
        }
        sx={{
          height: isQuizPlayerSelect ? "var(--quiz-control-height)" : 40,
          fontSize: isQuizPlayerSelect ? "var(--quiz-control-text-size)" : 14,
          fontWeight: isQuizPlayerSelect ? 850 : 700,
          borderRadius: isQuizPlayerSelect ? "10px" : undefined,
          backgroundColor: isQuizPlayerSelect ? customStyle?.backgroundColor ?? "#fff" : undefined,
          color: isQuizPlayerSelect ? customStyle?.color ?? "#000088" : undefined,
          boxShadow: isQuizPlayerSelect ? "0 10px 24px rgba(0,0,136,0.08)" : undefined,
          "& .MuiSelect-select": isQuizPlayerSelect
            ? {
                alignItems: "center",
                display: "flex",
                py: 0,
              }
            : undefined,
          "& .MuiOutlinedInput-notchedOutline": isQuizPlayerSelect
            ? {
                borderColor: customStyle?.borderColor ?? "rgba(0,0,136,0.18)",
                borderWidth: 1.5,
              }
            : undefined,
          "&:hover .MuiOutlinedInput-notchedOutline": isQuizPlayerSelect
            ? {
                borderColor: "#000088",
              }
            : undefined,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": isQuizPlayerSelect
            ? {
                borderColor: "#000088",
                borderWidth: 2,
              }
            : undefined,
          ...(isClassificationSelect ? { minWidth: 0, textAlign: "center" } : null),
        }}
        {...passthrough}
      >
        {groups.flatMap((group, groupIndex) => {
          const items: ReactNode[] = [];
          if (showGroupLabels && group.label) {
            items.push(<ListSubheader key={`label-${group.label}-${groupIndex}`}>{group.label}</ListSubheader>);
          }
          for (const option of group.options) {
            items.push(
              <MenuItem key={`${group.label}-${option.value}`} value={option.value} disabled={option.disabled}>
                {option.label}
              </MenuItem>,
            );
          }
          return items;
        })}
      </Select>
    </FormControl>
  );
}

function pickPassthroughProps(props: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(props).filter(([key]) => key.startsWith("data-") || key.startsWith("aria-") || key === "id" || key === "title"),
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
        options: Children.toArray(element.props.children)
          .filter(isValidElement)
          .map((option) => parseOptionElement(option as ReactElement<{ children?: ReactNode; disabled?: boolean; value?: string }>)),
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
