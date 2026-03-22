/** A beads-enabled project discovered on disk */
export interface BeadsProject {
  /** Directory name (e.g., "LouCam") */
  name: string;
  /** Absolute path to the project root */
  path: string;
  /** Whether the beads DB is healthy (bd commands succeed) */
  healthy: boolean;
  /** Error message if unhealthy */
  error?: string;
}

/** A single beads issue, as returned by `bd list --json` or `bd show --json` */
export interface BeadIssue {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "closed" | "deferred";
  priority: number;
  issue_type: BeadType;
  owner: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  dependency_count: number;
  dependent_count: number;
  comment_count: number;
  labels?: string;
  parent_id?: string;
}

/** Issue types supported by beads */
export type BeadType =
  | "task"
  | "bug"
  | "feature"
  | "chore"
  | "epic"
  | "decision";

/** Status summary from `bd status --json` */
export interface BeadStatusSummary {
  summary: {
    total_issues: number;
    open_issues: number;
    in_progress_issues: number;
    closed_issues: number;
    blocked_issues: number;
    deferred_issues: number;
    ready_issues: number;
    pinned_issues: number;
    epics_eligible_for_closure: number;
    average_lead_time_hours: number;
  };
}

/** An issue with its source project attached — for cross-project views */
export interface ProjectIssue {
  issue: BeadIssue;
  project: BeadsProject;
}

/** Priority labels — beads uses 0-4, higher = more important */
export const PRIORITY_LABELS: Record<number, string> = {
  0: "Backlog",
  1: "Low",
  2: "Medium",
  3: "High",
  4: "Critical",
};

/** Icons for issue types */
export const TYPE_ICONS: Record<BeadType, string> = {
  task: "checkmark-circle-16",
  bug: "bug-16",
  feature: "star-16",
  chore: "hammer-16",
  epic: "folder-16",
  decision: "light-bulb-16",
};

/** Colors for status */
export const STATUS_COLORS: Record<string, string> = {
  open: "#3B82F6",
  in_progress: "#F59E0B",
  closed: "#10B981",
  deferred: "#6B7280",
  blocked: "#EF4444",
};

/** Colors for priority */
export const PRIORITY_COLORS: Record<number, string> = {
  0: "#6B7280",
  1: "#3B82F6",
  2: "#F59E0B",
  3: "#F97316",
  4: "#EF4444",
};
