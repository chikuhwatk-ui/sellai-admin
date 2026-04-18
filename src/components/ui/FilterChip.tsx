"use client";

import * as React from "react";
import { X, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { cn } from "@/lib/cn";

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export function FilterChip({
  label,
  value,
  options,
  onChange,
  onClear,
}: {
  label: string;
  value?: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  onClear?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  const active = !!value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-0.5">
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1.5 h-7 px-2 rounded-md border text-xs transition-colors",
              active
                ? "bg-accent-bg border-accent text-accent"
                : "bg-panel border-default text-fg-muted hover:border-strong hover:text-fg"
            )}
          >
            <span className="font-medium">{label}</span>
            {selected && (
              <>
                <span className="text-fg-subtle">·</span>
                <span className="text-fg">{selected.label}</span>
              </>
            )}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
        </PopoverTrigger>
        {active && onClear && (
          <button
            onClick={onClear}
            className="h-7 w-6 flex items-center justify-center rounded-md text-fg-subtle hover:bg-raised hover:text-fg transition-colors"
            aria-label="Clear filter"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <PopoverContent className="min-w-[180px]" align="start">
        <div className="py-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn(
                "flex items-center justify-between w-full px-2 py-1.5 rounded text-sm-compact text-fg",
                "hover:bg-raised transition-colors",
                value === opt.value && "text-accent"
              )}
            >
              <span>{opt.label}</span>
              {opt.count !== undefined && (
                <span className="text-2xs text-fg-subtle tabular">{opt.count}</span>
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
