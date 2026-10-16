import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Mail, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useMisc.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminEnquiries, deleteEnquiry, updateEnquiry } from '../../services/endpoints.js';
import { ENQUIRY_STATUSES } from '../../config/site.js';
import { formatDateTime } from '../../utils/helpers.js';
import { ConfirmDialog, Empty, ErrorBanner, PageHead, Pager, Spinner } from '../components/ui.jsx';

function Enquiry({ e, open, onToggle, onChange, onDelete }) {
  const toast = useToast();
  const [notes, setNotes] = useState(e.notes || '');
  const [saving, setSaving] = useState(false);
  useEffect(() => setNotes(e.notes || ''), [e.notes]);

  const patch = async (changes, msg) => {
    try { const res = await updateEnquiry(e._id, changes); onChange(res.data); if (msg) toast.success(msg); } catch (err) { toast.error(err.message); }
  };
  const saveNotes = async () => { setSaving(true); await patch({ notes }, 'Notes saved'); setSaving(false); };

  return (
    <article className={`enq ${e.read ? '' : 'is-unread'}`}>
      <button type="button" className="enq__row" onClick={() => { onToggle(); if (!e.read && !open) patch({ read: true }); }} aria-expanded={open}>
        <span><strong>{e.name}</strong><br /><small>{formatDateTime(e.createdAt)}</small></span>
        <span>{e.email}<br /><small>{e.phone}</small></span>
        <span>{e.projectType}<br /><small>{e.budget}</small></span>
        <span><span className={`tag ${e.status === 'New' ? 'tag--new' : ''}`}>{e.status}</span></span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {open && (
        <div className="enq__detail">
          <dl className="enq__dl">
            <div><dt>Email</dt><dd><a href={`mailto:${e.email}`}><u>{e.email}</u></a></dd></div>
            <div><dt>Phone</dt><dd><a href={`tel:${e.phone}`}><u>{e.phone}</u></a></dd></div>
            <div><dt>City</dt><dd>{e.city || '—'}</dd></div>
            <div><dt>Approx. area</dt><dd>{e.area || '—'}</dd></div>
          </dl>
          <p className="enq__msg">{e.message}</p>
          <div className="agrid agrid--2" style={{ alignItems: 'start' }}>
            <div className="afield">
              <label htmlFor={`st-${e._id}`}>Status</label>
              <select id={`st-${e._id}`} value={e.status} onChange={(ev) => patch({ status: ev.target.value }, 'Status updated')}>
                {ENQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <button type="button" className="abtn abtn--sm" onClick={() => patch({ read: !e.read }, e.read ? 'Marked unread' : 'Marked read')}><Mail size={14} /> Mark {e.read ? 'unread' : 'read'}</button>
                <button type="button" className="abtn abtn--sm abtn--danger" onClick={onDelete}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
            <div className="afield">
              <label htmlFor={`nt-${e._id}`}>Internal notes</label>
              <textarea id={`nt-${e._id}`} rows={3} value={notes} onChange={(ev) => setNotes(ev.target.value)} maxLength={3000} />
              <div><button type="button" className="abtn abtn--sm" onClick={saveNotes} disabled={saving || notes === (e.notes || '')}>{saving ? 'Saving…' : 'Save notes'}</button></div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default function Enquiries() {
  const toast = useToast();
  const [filters, setFilters] = useState({ status: '', read: '', q: '' });
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [rows, setRows] = useState([]);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const dq = useDebounce(filters.q, 350);

  const { data, loading, error, reload } = useFetch(() => adminEnquiries({ page, limit: 20, status: filters.status || undefined, read: filters.read || undefined, q: dq || undefined }), [page, filters.status, filters.read, dq]);
  useEffect(() => { if (data) setRows(data.data); }, [data]);

  const replace = (doc) => setRows((cur) => cur.map((r) => (r._id === doc._id ? doc : r)));
  const setFilter = (k) => (ev) => { setFilters((f) => ({ ...f, [k]: ev.target.value })); setPage(1); };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteEnquiry(toDelete._id);
      toast.success('Enquiry deleted');
      setToDelete(null);
      if (rows.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Enquiries" subtitle="Messages from the contact form." />
      <div className="atoolbar">
        <input className="ainput" type="search" placeholder="Search name, email, message…" value={filters.q} onChange={setFilter('q')} aria-label="Search enquiries" />
        <select className="ainput" value={filters.status} onChange={setFilter('status')} aria-label="Filter by status"><option value="">All statuses</option>{ENQUIRY_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <select className="ainput" value={filters.read} onChange={setFilter('read')} aria-label="Filter by read state"><option value="">Read &amp; unread</option><option value="false">Unread</option><option value="true">Read</option></select>
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && !rows.length ? <Spinner /> : rows.length === 0 && !error ? <Empty>No enquiries found.</Empty> : rows.map((e) => (
        <Enquiry key={e._id} e={e} open={openId === e._id} onToggle={() => setOpenId(openId === e._id ? null : e._id)} onChange={replace} onDelete={() => setToDelete(e)} />
      ))}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} label="enquiries" />}
      {toDelete && <ConfirmDialog title="Delete enquiry" message={`Delete the enquiry from ${toDelete.name}? This cannot be undone.`} busy={busy} onConfirm={confirmDelete} onClose={() => setToDelete(null)} />}
    </>
  );
}
