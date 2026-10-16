import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { resource } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cld } from '../../utils/cloudinary.js';
import { ConfirmDialog, Empty, ErrorBanner, Modal, PageHead, Spinner } from './ui.jsx';
import { Grip, SortableItem, SortableList } from './SortableImages.jsx';

/**
 * Generic list + modal form + delete + drag-reorder for simple content models
 * (categories, collections, services, journal).
 *
 * props:
 *  path, title, subtitle, noun        — API path and labels
 *  blank                              — default form values
 *  toForm(doc) / toPayload(values)    — convert between API documents and form state
 *  validate(values) -> { field: msg }
 *  renderForm({ values, set, setValues, errors })
 *  rowTitle(doc), rowMeta(doc), rowImage(doc)
 *  sortable                           — enable drag-and-drop ordering (saved to MongoDB)
 *  rowExtra(doc)                      — extra badges
 *  loadDoc(doc)                       — optional: fetch the full document before editing
 *  onChanged()                        — called after any successful create/update/delete
 */
export default function ResourceManager({
  path, title, subtitle, noun, blank, toForm = (d) => ({ ...blank, ...d }), toPayload = (v) => v, validate = () => ({}),
  renderForm, rowTitle, rowMeta, rowImage, rowExtra, sortable = false, loadDoc, onChanged, wide = false, query,
}) {
  const api = useMemo(() => resource(path), [path]);
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | doc
  const [values, setValues] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.list(query);
      setItems(res.data);
    } catch (err) { setError(err); } finally { setLoading(false); }
  }, [api, query]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setValues(blank); setErrors({}); setEditing('new'); };
  const openEdit = async (doc) => {
    let full = doc;
    if (loadDoc) {
      try { full = await loadDoc(doc); } catch (err) { toast.error(err.message); return; }
    }
    setValues(toForm(full)); setErrors({}); setEditing(full);
  };
  const close = () => setEditing(null);

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === 'checkbox' ? e.target.checked : e.target.value) : e;
    setValues((cur) => ({ ...cur, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const save = async () => {
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) { toast.error('Please fix the highlighted fields.'); return; }
    setSaving(true);
    try {
      if (editing === 'new') { await api.create(toPayload(values)); toast.success(`${noun} created`); }
      else { await api.update(editing._id, toPayload(values)); toast.success(`${noun} updated`); }
      close();
      await load();
      onChanged?.();
    } catch (err) {
      if (err.details?.length) setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.remove(toDelete._id);
      toast.success(`${noun} deleted`);
      setToDelete(null);
      await load();
      onChanged?.();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const reorder = async (next) => {
    const previous = items;
    setItems(next);
    try {
      await api.reorder(next.map((d, i) => ({ id: d._id, order: i })));
      toast.success('Order saved');
      onChanged?.();
    } catch (err) { setItems(previous); toast.error(`Could not save order: ${err.message}`); }
  };

  const Row = ({ doc, handle }) => (
    <>
      {sortable && <Grip handle={handle} className="sortrow__grip" label={`Drag to reorder ${rowTitle(doc)}`} />}
      {rowImage?.(doc) ? <img className="sortrow__thumb" src={cld(rowImage(doc), { w: 120, h: 90 })} alt="" /> : <div className="sortrow__thumb" />}
      <div style={{ minWidth: 0 }}>
        <strong>{rowTitle(doc)}</strong> {rowExtra?.(doc)}
        <div style={{ fontSize: 13, color: 'var(--c-stone-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rowMeta?.(doc)}</div>
      </div>
      <div className="atable__actions">
        <button type="button" className="abtn abtn--sm abtn--icon" onClick={() => openEdit(doc)} aria-label={`Edit ${rowTitle(doc)}`}><Pencil size={15} /></button>
        <button type="button" className="abtn abtn--sm abtn--icon abtn--danger" onClick={() => setToDelete(doc)} aria-label={`Delete ${rowTitle(doc)}`}><Trash2 size={15} /></button>
      </div>
    </>
  );

  return (
    <>
      <PageHead title={title} subtitle={subtitle}>
        <button type="button" className="abtn abtn--primary" onClick={openNew}><Plus size={15} /> New {noun.toLowerCase()}</button>
      </PageHead>
      <ErrorBanner error={error} onRetry={load} />
      {loading && !items.length ? <Spinner /> : items.length === 0 && !error ? <Empty>No {title.toLowerCase()} yet.</Empty> : sortable ? (
        <SortableList items={items} onReorder={reorder} layout="list">
          <div className="sortlist">
            {items.map((doc) => (
              <SortableItem key={doc._id} id={doc._id} className="sortrow">{({ handle }) => <Row doc={doc} handle={handle} />}</SortableItem>
            ))}
          </div>
        </SortableList>
      ) : (
        <div className="sortlist">
          {items.map((doc) => <div key={doc._id} className="sortrow" style={{ gridTemplateColumns: '56px 1fr auto' }}><Row doc={doc} /></div>)}
        </div>
      )}

      {editing && (
        <Modal
          title={editing === 'new' ? `New ${noun.toLowerCase()}` : `Edit ${noun.toLowerCase()}`} wide={wide} onClose={close}
          footer={<><button type="button" className="abtn" onClick={close} disabled={saving}>Cancel</button><button type="button" className="abtn abtn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}
        >
          <form onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>{renderForm({ values, set, setValues, errors })}</form>
        </Modal>
      )}
      {toDelete && <ConfirmDialog title={`Delete ${noun.toLowerCase()}`} message={`Delete “${rowTitle(toDelete)}”? This cannot be undone.`} busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />}
    </>
  );
}
