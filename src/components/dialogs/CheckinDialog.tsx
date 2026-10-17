import DialogMessage from './DialogMessage';

export default function CheckinDialog() {
  return <DialogMessage title="Check-in" description="Take a moment to review your workload.">
    <p className="text-sm text-ink">How is your day going?</p>
  </DialogMessage>;
}