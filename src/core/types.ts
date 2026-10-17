export type TaskGroup = 'today' | 'this_week' | 'later' | 'needs_senior';

export interface Task {
  id: string;
  title: string;
  project: string;
  status: 'todo' | 'done';
  group: TaskGroup;
  effort: 'small' | 'medium' | 'large';
  estimateMin: number;
  explanation: { sourceCategory: string; confidence: number; reason: string };
  provenance?: { source: string; ref: string };
  blocker?: string;
  userAdjusted?: boolean;
}

export type SourceKey = 'calendar' | 'chat' | 'drive' | 'policy';

export interface ApprovalRequest {
  type: string;
  recipient?: string;
  content?: string;
  effect?: string;
}

export interface ApprovalResult {
  approved: boolean;
  request: ApprovalRequest;
  hash?: string;
}

export interface PendingApproval {
  request: ApprovalRequest;
  editable: boolean;
  resolve: (result: ApprovalResult) => void;
}