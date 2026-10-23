import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputProps = ComponentProps<"input">;

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className="relative flex h-10 items-center rounded-lg border border-border bg-[var(--card)] pl-9 pr-3.5 shadow-none transition-all duration-150 focus-within:border-[var(--primary)] focus-within:ring-3 focus-within:ring-[rgba(105,108,255,0.12)]">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
      <input
        type="text"
        className={cn(
          "h-full w-full flex-1 border-0 bg-transparent p-0 text-sm font-medium leading-5 text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}

// Backward compatibility alias
export { SearchInput as LmsSearchInput };
