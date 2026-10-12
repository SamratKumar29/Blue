import { useBlueStore, SOURCE_LABELS, type SourceKey } from '../store';
import { SectionTitle, ToggleRow } from './parts';

export default function Connectors() {
  const s = useBlueStore((x) => x.settings);
  const meta = useBlueStore((x) => x.meta);
  const update = useBlueStore((x) => x.updateSettings);
  const updateMeta = useBlueStore((x) => x.updateMeta);

  return (
    <div>
      <SectionTitle title="Connectors" hint="Blue reads only what you switch on. Everything is read-only." />
      <ToggleRow title="Demo Workspace" hint="Fictional Slack-like, Gmail-like and Calendar data bundled with the app." checked={s.allowConnectors} onChange={(v) => update({ allowConnectors: v })} />
      <div className={`mt-2 ${s.allowConnectors ? '' : 'opacity-50 pointer-events-none'}`} aria-disabled={!s.allowConnectors}>
        {(Object.keys(SOURCE_LABELS) as SourceKey[]).map((k) => (
          <ToggleRow
            key={k}
            title={`${SOURCE_LABELS[k]} (read-only)`}
            hint={meta.lastAccess[k] ? `Last accessed ${new Date(meta.lastAccess[k]).toLocaleString()}` : 'Not accessed yet'}
            checked={meta.sources[k]}
            onChange={(v) => updateMeta({ sources: { ...meta.sources, [k]: v } })}
          />
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Codebase access: never. Repos, diffs, CI logs and secrets are always excluded. Real Slack/Gmail connections are on the roadmap.</p>
    </div>
  );
}
