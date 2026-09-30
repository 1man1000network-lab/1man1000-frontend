"use client";

import { Badge } from "@workspace/ui/components/badge";
import { cn } from "@workspace/ui/lib/utils";

type StatusType =
  | "pending"
  | "approved"
  | "rejected"
  | "reversed"
  | "active"
  | "completed"
  | "processing"
  | "failed"
  | "draft"
  | "closed"
  | "paused";

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-0",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-0",
  },
  reversed: {
    label: "Reversed",
    className: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-0",
  },
  active: {
    label: "Active",
    className:
      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-0",
  },
  completed: {
    label: "Completed",
    className: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-0",
  },
  processing: {
    label: "Processing",
    className: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-0",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/15 text-red-700 dark:text-red-400 border-0",
  },
  draft: {
    label: "Draft",
    className: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-0",
  },
  closed: {
    label: "Closed",
    className: "bg-gray-500/15 text-gray-700 dark:text-gray-400 border-0",
  },
  paused: {
    label: "Paused",
    className:
      "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-0",
  },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    className: "bg-gray-500/15 text-gray-700 border-0",
  };

  return (
    <Badge className={cn(config.className, className)}>{config.label}</Badge>
  );
}
