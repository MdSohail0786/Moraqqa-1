import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, UploadCloud, XCircle } from 'lucide-react';
import { uploadImageBatch } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';

const MAX_SIZE = 15 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_W = 400;
const MIN_H = 300;
const BATCH = 4; // files per request: keeps memory and Cloudinary load bounded on the server

const readDims = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });

/** Client-side checks mirror the server's: type, size, dimensions. */
async function precheck(file) {
  if (!TYPES.includes(file.type)) return 'Only JPG, PNG and WEBP files are allowed';
  if (file.size > MAX_SIZE) return 'File is larger than 15MB';
  const d = await readDims(file);
  if (!d) return 'File is not a readable image';
  if (d.w < MIN_W || d.h < MIN_H) return `Too small (${d.w}×${d.h}, minimum ${MIN_W}×${MIN_H})`;
  return null;
}

/**
 * Multi-image upload with validation, per-file progress and separate success / failure lists.
 * `meta` holds { category, project, collection, tags, featured } sent with every batch.
 */
export default function UploadPanel({ meta, onUploaded, disabled }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);
  const urls = useRef(new Map());

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    const next = await Promise.all(
      files.map(async (file, i) => {
        const error = await precheck(file);
        const id = `${Date.now()}-${i}-${file.name}`;
        urls.current.set(id, URL.createObjectURL(file));
        return { id, file, status: error ? 'error' : 'ready', error, pct: 0 };
      })
    );
    setItems((cur) => [...cur, ...next]);
  }, []);

  const patch = (ids, changes) => setItems((cur) => cur.map((it) => (ids.includes(it.id) ? { ...it, ...(typeof changes === 'function' ? changes(it) : changes) } : it)));

  const start = async () => {
    const queue = items.filter((i) => i.status === 'ready' || (i.status === 'error' && i.retryable));
    if (!queue.length) return;
    setRunning(true);
    let ok = 0;
    let bad = 0;
    for (let i = 0; i < queue.length; i += BATCH) {
      const batch = queue.slice(i, i + BATCH);
      const ids = batch.map((b) => b.id);
      patch(ids, { status: 'uploading', pct: 0, error: null });
      const fd = new FormData();
      Object.entries(meta).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== null) fd.append(k, v); });
      batch.forEach((b) => fd.append('images', b.file));
      try {
        // eslint-disable-next-line no-await-in-loop
        const res = await uploadImageBatch(fd, (p) => patch(ids, { pct: Math.round((p.loaded / (p.total || 1)) * 100) }));
        const failedNames = new Map((res.failed || []).map((f) => [f.filename, f.error]));
        if (res.success === false && !res.uploaded && !res.failed) throw new Error(res.message || 'Upload failed');
        batch.forEach((b) => {
          if (failedNames.has(b.file.name)) { bad += 1; patch([b.id], { status: 'error', error: failedNames.get(b.file.name), retryable: true }); }
          else { ok += 1; patch([b.id], { status: 'done', pct: 100 }); }
        });
        if (res.uploaded?.length) onUploaded?.(res.uploaded);
      } catch (err) {
        bad += batch.length;
        patch(ids, { status: 'error', error: err.message, retryable: true });
      }
    }
    setRunning(false);
    if (ok) toast.success(`${ok} image${ok === 1 ? '' : 's'} uploaded`);
    if (bad) toast.error(`${bad} image${bad === 1 ? '' : 's'} failed to upload`);
  };

  const done = items.filter((i) => i.status === 'done');
  const failed = items.filter((i) => i.status === 'error');
  const ready = items.filter((i) => i.status === 'ready' || (i.status === 'error' && i.retryable));

  const clear = () => {
    items.forEach((i) => { URL.revokeObjectURL(urls.current.get(i.id)); urls.current.delete(i.id); });
    setItems([]);
  };

  return (
    <div>
      <label
        className={`dropzone ${over ? 'is-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!disabled) addFiles(e.dataTransfer.files); }}
      >
        <input ref={inputRef} type="file" multiple accept={TYPES.join(',')} disabled={disabled || running} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <UploadCloud size={30} aria-hidden="true" />
        <strong>Drop images here or click to browse</strong>
        <small>JPG, PNG or WEBP · up to 15MB each · minimum 400×300px · uploaded {BATCH} at a time</small>
      </label>

      {items.length > 0 && (
        <>
          <ul className="uplist" aria-label="Selected images">
            {items.map((it) => (
              <li key={it.id} className={`upitem ${it.status === 'error' ? 'upitem--error' : ''} ${it.status === 'done' ? 'upitem--done' : ''}`}>
                <img src={urls.current.get(it.id)} alt="" />
                <div style={{ minWidth: 0 }}>
                  <div className="upitem__name">{it.file.name}</div>
                  {it.status === 'uploading' && <div className="upitem__bar"><i style={{ width: `${it.pct}%` }} /></div>}
                  {it.error && <p className="upitem__msg">{it.error}</p>}
                </div>
                <span>
                  {it.status === 'done' && <CheckCircle2 size={18} color="#4d6b4a" aria-label="Uploaded" />}
                  {it.status === 'error' && <XCircle size={18} color="#9b3b2f" aria-label="Failed" />}
                  {it.status === 'uploading' && `${it.pct}%`}
                  {it.status === 'ready' && <button type="button" className="abtn abtn--sm abtn--ghost" onClick={() => setItems((c) => c.filter((x) => x.id !== it.id))} aria-label={`Remove ${it.file.name}`}>Remove</button>}
                </span>
              </li>
            ))}
          </ul>
          <div className="upsummary" role="status">
            <span>Ready: {ready.length}</span>
            <span style={{ color: '#4d6b4a' }}>Successful: {done.length}</span>
            <span style={{ color: failed.length ? '#9b3b2f' : undefined }}>Failed: {failed.length}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button type="button" className="abtn abtn--primary" onClick={start} disabled={running || !ready.length || disabled}>
              {running ? 'Uploading…' : `Upload ${ready.length} image${ready.length === 1 ? '' : 's'}`}
            </button>
            <button type="button" className="abtn" onClick={clear} disabled={running}>Clear list</button>
          </div>
        </>
      )}
    </div>
  );
}
