import DialogMessage from './DialogMessage';

export default function AskSeniorDialog({ taskId, helperId }: { taskId?: string; helperId?: string }) {
  return <DialogMessage title="Ask a teammate" description="Prepare a question for a teammate.">
    <p className="text-sm text-ink">{taskId ? `This question is about task ${taskId}.` : 'Choose a task to add more context.'}</p>
    {helperId && <p className="text-xs text-muted">Suggested teammate: {helperId}</p>}
  </DialogMessage>;
}