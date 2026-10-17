import DialogMessage from './DialogMessage';

export default function CelebrateDialog({ taskId }: { taskId?: string }) {
  return <DialogMessage title="Task complete" description="Nice work making progress.">
    {taskId && <p className="text-sm text-ink">Completed task: {taskId}</p>}
  </DialogMessage>;
}