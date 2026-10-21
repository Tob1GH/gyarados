import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';
import { Thumb } from './AssetCard.jsx';
import { formatBytes, formatDate } from '../lib/format.js';
import { api } from '../api/client.js';
import { useToast } from './Toast.jsx';

export default function AssetDrawer({ asset, onClose, onChanged }) {
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const remove = async () => {
    setBusy(true);
    try {
      await api.deleteAsset(asset.id);
      toast(`Deleted “${asset.title}”`);
      onChanged();
      onClose();
    } catch (e) {
      toast(e.message, 'error');
      setBusy(false);
    }
  };

  const rows = [
    ['Type', asset.type],
    ['Format', asset.format.toUpperCase()],
    ['Size', formatBytes(asset.sizeBytes)],
    ['Collection', asset.collection || 'Unsorted'],
    ['Uploaded by', asset.owner],
    ['Uploaded', formatDate(asset.createdAt)],
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={asset.title}>
      <div className="absolute inset-0 bg-navy-800/50" onClick={onClose} />
      <aside className="slide-in relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-lift">
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <h2 className="text-xl font-extrabold leading-snug">{asset.title}</h2>
          <button className="btn-ghost px-2" onClick={onClose} aria-label="Close"><Icon name="x" /></button>
        </div>

        <div className="space-y-6 p-5">
          <Thumb asset={asset} className="aspect-video w-full rounded-xl" />

          <dl className="grid grid-cols-[7rem_1fr] gap-y-2 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-mute">{k}</dt>
                <dd className="capitalize">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-bold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {asset.tags.length ? asset.tags.map((t) => <span key={t} className="chip">{t}</span>) : <span className="text-sm text-ink-mute">No tags yet.</span>}
            </div>
          </div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-line p-5">
          <a className="btn-primary flex-1" href={asset.url} download target="_blank" rel="noreferrer">
            <Icon name="download" className="h-4 w-4" /> Download
          </a>
          {confirming ? (
            <button className="btn-danger" onClick={remove} disabled={busy}>{busy ? 'Deleting…' : 'Confirm delete'}</button>
          ) : (
            <button className="btn-danger" onClick={() => setConfirming(true)}><Icon name="trash" className="h-4 w-4" /> Delete</button>
          )}
        </div>
      </aside>
    </div>
  );
}
