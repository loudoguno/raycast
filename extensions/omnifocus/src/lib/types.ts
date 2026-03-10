export type DestinationType = "inbox" | "project" | "task" | "folder" | "tag";

export interface Destination {
  id: string;
  name: string;
  type: DestinationType;
  breadcrumb: string;
  projectName: string | null;
  hasChildren: boolean;
  depth: number;
}

export interface CreateTaskOptions {
  name: string;
  note?: string;
  dueDate?: Date | null;
  flagged?: boolean;
  tags?: string[];
  repetition?: {
    ruleString: string;
    method: RepetitionMethod;
  } | null;
}

export type RepetitionMethod =
  | "fixed"
  | "due-after-completion"
  | "defer-after-completion";

export interface OmniFocusTag {
  id: string;
  name: string;
}

export type TodaySection = "overdue" | "due-today" | "flagged" | "due-soon";

export interface TodayTask {
  id: string;
  name: string;
  projectName: string | null;
  tags: string[];
  dueDate: string | null;
  deferDate: string | null;
  flagged: boolean;
  estimatedMinutes: number | null;
  noteExcerpt: string;
  section: TodaySection;
}
