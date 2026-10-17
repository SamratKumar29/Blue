import type { ReactNode } from 'react';
import Modal from '../Modal';
import { useUi } from '../../ui';

export default function DialogMessage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  const closeDialog = useUi((state) => state.closeDialog);
  return (
    <Modal title={title} subtitle={description} onClose={closeDialog}>
      <div className="space-y-4">
        {children}
        <p className="text-xs text-muted">Local demo only. No external action is taken.</p>
      </div>
    </Modal>
  );
}