import { useUi } from '../ui';
import AnalysisDialog from './dialogs/AnalysisDialog';
import AskSeniorDialog from './dialogs/AskSeniorDialog';
import RoundupDialog from './dialogs/RoundupDialog';
import CheckinDialog from './dialogs/CheckinDialog';
import CelebrateDialog from './dialogs/CelebrateDialog';
import { CapacityDialog, CreateTaskDialog, MoreMenuDialog, SummarizeDialog, WriteDialog } from './dialogs/QuickDialogs';

/** Renders the one active dialog. Keyed so each open starts from fresh state. */
export default function DialogHost() {
  const dialog = useUi((s) => s.dialog);
  if (!dialog) return null;
  const p = (dialog.payload ?? {}) as { taskId?: string; helperId?: string; person?: string };
  const key = `${dialog.kind}:${p.taskId ?? ''}:${p.helperId ?? ''}`;
  switch (dialog.kind) {
    case 'analysis': return <AnalysisDialog key={key} taskId={p.taskId} />;
    case 'askSenior': return <AskSeniorDialog key={key} taskId={p.taskId} helperId={p.helperId} />;
    case 'roundup': return <RoundupDialog key={key} />;
    case 'checkin': return <CheckinDialog key={key} />;
    case 'celebrate': return <CelebrateDialog key={key} taskId={p.taskId} />;
    case 'summarize': return <SummarizeDialog key={key} />;
    case 'write': return <WriteDialog key={key} />;
    case 'createTask': return <CreateTaskDialog key={key} />;
    case 'moreMenu': return <MoreMenuDialog key={key} />;
    case 'capacity': return <CapacityDialog key={key} taskId={p.taskId} person={p.person} />;
  }
}
