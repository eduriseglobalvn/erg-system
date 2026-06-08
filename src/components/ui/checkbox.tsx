"use client"

import { Check, Minus } from "lucide-react"
import { useEffect, useState, type InputHTMLAttributes } from "react"

import { cn } from "@/lib/utils"

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "checked"> & {
  checked?: boolean | "indeterminate"
  onCheckedChange?: (checked: boolean | "indeterminate") => void
}

function Checkbox({
  className,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  ...props
}: CheckboxProps) {
  const isControlled = checked !== undefined
  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked))
  const visualChecked = isControlled ? checked : uncontrolledChecked
  const isIndeterminate = visualChecked === "indeterminate"
  const isChecked = visualChecked === true

  useEffect(() => {
    if (!isControlled) setUncontrolledChecked(Boolean(defaultChecked))
  }, [defaultChecked, isControlled])

  return (
    <span className="relative inline-grid size-[18px] shrink-0 place-items-center align-middle">
      <input
        type="checkbox"
        data-slot="checkbox"
        checked={isIndeterminate ? false : isChecked}
        aria-checked={isIndeterminate ? "mixed" : isChecked}
        data-checked={isChecked ? "true" : undefined}
        data-indeterminate={isIndeterminate ? "true" : undefined}
        ref={(el) => {
          if (el) el.indeterminate = isIndeterminate
        }}
        onChange={(event) => {
          onChange?.(event)
          if (!isControlled) setUncontrolledChecked(event.target.checked)
          if (onCheckedChange) {
            onCheckedChange(event.target.checked ? true : false)
          }
        }}
        className={cn(
          "peer size-[18px] cursor-pointer appearance-none rounded-[5px] border border-[#b8c8db] bg-white shadow-none transition-all duration-100",
          "checked:border-[var(--primary)] checked:bg-[var(--primary)] data-[checked=true]:border-[var(--primary)] data-[checked=true]:bg-[var(--primary)] data-[indeterminate=true]:border-[var(--primary)] data-[indeterminate=true]:bg-[var(--primary)]",
          "hover:border-[var(--primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
      {isChecked ? <Check className="pointer-events-none absolute size-3.5 text-white" strokeWidth={3} /> : null}
      {isIndeterminate ? <Minus className="pointer-events-none absolute size-3.5 text-white" strokeWidth={3} /> : null}
    </span>
  )
}

export { Checkbox }
