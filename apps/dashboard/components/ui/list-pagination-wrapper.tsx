"use client";

import * as React from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Button } from "@workspace/ui/components/button";

interface Meta {
  page?: number;
  limit?: number;
  totalPages?: number;
  total?: number;
}

interface ListPaginationWrapperProps<T> {
  data: T[];
  ListItem: React.ComponentType<{ item: T }>;
  isLoading?: boolean;
  emptyMessage?: string;
  meta?: Meta;
  page: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  className?: string;
  itemClassName?: string;
  paginationPosition?: "top" | "bottom" | "both";
}

export function ListPaginationWrapper<T extends { id: string }>({
  data,
  ListItem,
  isLoading,
  emptyMessage = "No items found",
  meta,
  page,
  onPageChange,
  limit,
  onLimitChange,
  limitOptions = [10, 20, 50, 100],
  className,
  itemClassName,
  paginationPosition = "bottom",
}: ListPaginationWrapperProps<T>) {
  const totalPages =
    meta?.totalPages ||
    (meta?.total && meta?.limit
      ? Math.max(1, Math.ceil(meta.total / meta.limit))
      : 1);
  const hasPagination = totalPages > 1;
  const showControls = hasPagination || !!onLimitChange;

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2 py-4">
      {onLimitChange && (
        <div className="flex items-center gap-2 mr-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="text-sm border rounded px-2 py-1.5 bg-background"
          >
            {limitOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground min-w-[100px] text-center">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "p-4 rounded-xl border border-border/60 bg-card",
              itemClassName,
            )}
          >
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 p-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showControls && paginationPosition !== "bottom" && (
        <PaginationControls />
      )}

      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border border-border/60 bg-card hover:shadow-md transition-all",
              itemClassName,
            )}
          >
            <ListItem item={item} />
          </div>
        ))}
      </div>

      {showControls && paginationPosition !== "top" && <PaginationControls />}
    </div>
  );
}
