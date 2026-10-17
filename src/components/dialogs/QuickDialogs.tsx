import DialogMessage from './DialogMessage';

export function CapacityDialog({ taskId, person }: { taskId?: string; person?: string }) {
  return <DialogMessage title="Capacity" description="Review workload before making a commitment.">
    {(person || taskId) && <p className="text-sm text-ink">{[person, taskId].filter(Boolean).join(' · ')}</p>}
  </DialogMessage>;
}

export function CreateTaskDialog() {
  return <DialogMessage title="Create a task" description="Task creation is not available in this sample workspace." />;
}

export function MoreMenuDialog() {
  return <DialogMessage title="More options" description="Additional task actions are unavailable in this sample workspace." />;
}

export function SummarizeDialog() {
  return <DialogMessage title="Summarize" description="Choose a connected source to prepare a summary." />;
}

export function WriteDialog() {
  return <DialogMessage title="Draft a message" description="Message drafting is unavailable in this sample workspace." />;
}