"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

import { CustomSelect } from "@/components/ui/custom-select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterOption = {
  value: string;
  label: string;
};

type FilterField = {
  name: string;
  label: string;
  defaultValue?: string;
  options: FilterOption[];
  className?: string;
};

export function DashboardFilters({
  searchPlaceholder,
  searchValue,
  searchName = "q",
  filters = [],
  clearHref,
  className
}: {
  searchPlaceholder: string;
  searchValue?: string;
  searchName?: string;
  filters?: FilterField[];
  clearHref: string;
  className?: string;
}) {
  const hasActiveFilters =
    Boolean(searchValue?.trim()) ||
    filters.some((filter) => {
      const defaultValue = filter.defaultValue ?? filter.options[0]?.value ?? "";
      return defaultValue !== (filter.options[0]?.value ?? "");
    });

  return (
    <div className={cn("rounded-[2rem] border border-border/70 bg-card/75 p-4 shadow-card backdrop-blur", className)}>
      <form method="get" className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="flex-1">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-secondary-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Search and filter
          </div>
          <label className="flex h-12 items-center gap-3 rounded-2xl border border-border bg-background/80 px-4 shadow-sm transition-all focus-within:ring-2 focus-within:ring-ring">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              name={searchName}
              defaultValue={searchValue}
              placeholder={searchPlaceholder}
              className="h-full w-full appearance-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>
        </div>

        {filters.map((filter) => (
          <div key={filter.name} className={cn("xl:w-[220px]", filter.className)}>
            <div className="mb-2 px-1 text-xs font-medium text-muted-foreground">{filter.label}</div>
            <CustomSelect name={filter.name} defaultValue={filter.defaultValue} options={filter.options} />
          </div>
        ))}

        <div className="flex gap-2 xl:pb-0.5">
          <Button type="submit" className="flex-1 xl:flex-none">
            Apply
          </Button>
          {hasActiveFilters ? (
            <Button asChild variant="outline" className="flex-1 xl:flex-none">
              <Link href={clearHref}>Reset</Link>
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
