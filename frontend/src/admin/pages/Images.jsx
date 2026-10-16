import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Star, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useMisc.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminImages, bulkDeleteImages, bulkUpdateImages, deleteImage, updateImage } from '../../services/endpoints.js';
import { cld } from '../../utils/cloudinary.js';
import { ConfirmDialog, Empty, ErrorBanner, Field, Modal, PageHead, Pager, Spinner } from '../components/ui.jsx';
import UploadPanel from '../components/UploadPanel.jsx';
import { useCollectionOptions, useProjectOptions } from '../hooks.js';

const LIMIT = 36;

const Select = ({ value, onChange, options, placeholder, label, ...rest }) => (
  <select className="ainput" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} {...rest}>
    <option value="">{placeholder}</option>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

function EditModal({ image, categories, projects, collections, onClose, onSaved }) {
  const toast = useToast();
  const [v, setV] = useState({
    title: image.title || '', altText: image.altText || '', description: image.description || '', tags: (image.tags || []).join(', '),
    category: image.category?._id || '', project: image.project?._id || '', collectionId: image.collectionId || '',
    featured: Boolean(image.featured), order: image.order ?? 0, subCategory: image.subCategory || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setV((c) => ({ ...c, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await updateImage(image._id, { ...v, order: Number(v.order) || 0 });
      toast.success('Image updated');
      onSaved();
    } catch (err) { toast.error(err.message); } finally { setSaving(false); }
  };

  return (
    <Modal title="Edit image" wide onClose={onClose} footer={<><button type="button" className="abtn" onClick={onClose}>Cancel</button><button type="button" className="abtn abtn--primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
      <div className="agrid agrid--2" style={{ alignItems: 'start' }}>
        <img src={cld(image.cloudinaryUrl, { w: 800 })} alt={image.altText || ''} style={{ width: '100%', background: 'var(--c-beige)' }} />
        <div className="agrid">
          <Field label="Title" htmlFor="im-title"><input id="im-title" type="text" value={v.title} onChange={set('title')} maxLength={160} /></Field>
          <Field label="Alt text" htmlFor="im-alt" hint="Describe the image for screen readers and SEO"><input id="im-alt" type="text" value={v.altText} onChange={set('altText')} maxLength={240} /></Field>
          <Field label="Tags" htmlFor="im-tags" hint="Comma separated"><input id="im-tags" type="text" value={v.tags} onChange={set('tags')} /></Field>
          <div className="agrid agrid--2">
            <Field label="Category" htmlFor="im-cat"><select id="im-cat" value={v.category} onChange={set('category')}><option value="">None</option>{categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></Field>
            <Field label="Project" htmlFor="im-proj"><select id="im-proj" value={v.project} onChange={set('project')}><option value="">None</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}</select></Field>
            <Field label="Collection" htmlFor="im-col"><select id="im-col" value={v.collectionId} onChange={set('collectionId')}><option value="">None</option>{collections.map((c) => <option key={c._id} value={c._id}>{c.title}</option>)}</select></Field>
            <Field label="Order" htmlFor="im-order"><input id="im-order" type="number" min={0} value={v.order} onChange={set('order')} /></Field>
          </div>
          <Field label="Sub-category" htmlFor="im-sub"><input id="im-sub" type="text" value={v.subCategory} onChange={set('subCategory')} /></Field>
          <label className="acheck"><input type="checkbox" checked={v.featured} onChange={set('featured')} /> Featured image</label>
        </div>
      </div>
    </Modal>
  );
}

export default function Images() {
  const toast = useToast();
  const { categories } = useSettings();
  const projects = useProjectOptions();
  const collections = useCollectionOptions();

  const [filters, setFilters] = useState({ category: '', project: '', collection: '', unassigned: false, q: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null); // image | 'bulk'
  const [busy, setBusy] = useState(false);
  const [bulk, setBulk] = useState({ category: '', project: '', collection: '' });
  const [uploadMeta, setUploadMeta] = useState({ category: '', project: '', collection: '', tags: '', featured: false });
  const dq = useDebounce(filters.q, 350);

  const params = useMemo(() => ({
    page, limit: LIMIT, sort: 'newest',
    category: filters.category || undefined, project: filters.project || undefined, collection: filters.collection || undefined,
    unassigned: filters.unassigned || undefined, q: dq || undefined,
  }), [page, filters.category, filters.project, filters.collection, filters.unassigned, dq]);

  const { data, loading, error, reload } = useFetch(() => adminImages(params), [JSON.stringify(params)]);
  const rows = data?.data || [];

  useEffect(() => setSelected(new Set()), [JSON.stringify(params)]);

  const setFilter = (k) => (v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const toggle = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r._id));

  const projectOpts = projects.map((p) => ({ value: p._id, label: p.title }));
  const catOpts = categories.map((c) => ({ value: c._id, label: `${c.name} (${c.group})` }));
  const colOpts = collections.map((c) => ({ value: c._id, label: c.title }));

  const applyBulk = async (update, msg) => {
    if (!Object.keys(update).length) return;
    try {
      await bulkUpdateImages([...selected], update);
      toast.success(msg);
      setBulk({ category: '', project: '', collection: '' });
      setSelected(new Set());
      reload();
    } catch (err) { toast.error(err.message); }
  };

  const bulkAssign = () => {
    const update = {};
    if (bulk.category) update.category = bulk.category;
    if (bulk.project) update.project = bulk.project;
    if (bulk.collection) update.collectionId = bulk.collection;
    if (!Object.keys(update).length) return toast.info('Choose a category, project or collection to assign.');
    return applyBulk(update, 'Images updated');
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (toDelete === 'bulk') await bulkDeleteImages([...selected]);
      else await deleteImage(toDelete._id);
      toast.success(toDelete === 'bulk' ? `${selected.size} images deleted` : 'Image deleted');
      setToDelete(null);
      setSelected(new Set());
      if (rows.length <= (toDelete === 'bulk' ? selected.size : 1) && page > 1) setPage(page - 1); else reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  const toggleFeatured = useCallback(async (img) => {
    try { await updateImage(img._id, { featured: !img.featured }); reload(); } catch (err) { toast.error(err.message); }
  }, [reload, toast]);

  return (
    <>
      <PageHead title="Images" subtitle={data ? `${data.total} images in the library` : 'Upload and organise the image library.'} />

      <div className="acard">
        <h2>Upload</h2>
        <div className="agrid agrid--4" style={{ marginBottom: 16 }}>
          <Field label="Project"><Select label="Upload to project" placeholder="No project" value={uploadMeta.project} onChange={(v) => setUploadMeta((m) => ({ ...m, project: v }))} options={projectOpts} /></Field>
          <Field label="Category"><Select label="Upload category" placeholder="No category" value={uploadMeta.category} onChange={(v) => setUploadMeta((m) => ({ ...m, category: v }))} options={catOpts} /></Field>
          <Field label="Collection"><Select label="Upload collection" placeholder="No collection" value={uploadMeta.collection} onChange={(v) => setUploadMeta((m) => ({ ...m, collection: v }))} options={colOpts} /></Field>
          <Field label="Tags" hint="Comma separated"><input className="ainput" type="text" value={uploadMeta.tags} onChange={(e) => setUploadMeta((m) => ({ ...m, tags: e.target.value }))} aria-label="Tags for uploaded images" /></Field>
        </div>
        <label className="acheck" style={{ marginBottom: 16 }}><input type="checkbox" checked={uploadMeta.featured} onChange={(e) => setUploadMeta((m) => ({ ...m, featured: e.target.checked }))} /> Mark uploaded images as featured</label>
        <UploadPanel meta={{ ...uploadMeta, featured: uploadMeta.featured ? 'true' : '' }} onUploaded={() => { setPage(1); reload(); }} />
      </div>

      <div className="acard">
        <h2>Library</h2>
        <div className="atoolbar">
          <input className="ainput" type="search" placeholder="Search title, alt text, tags…" value={filters.q} onChange={(e) => setFilter('q')(e.target.value)} aria-label="Search images" />
          <Select label="Filter by category" placeholder="All categories" value={filters.category} onChange={setFilter('category')} options={catOpts} />
          <Select label="Filter by project" placeholder="All projects" value={filters.project} onChange={setFilter('project')} options={projectOpts} />
          <Select label="Filter by collection" placeholder="All collections" value={filters.collection} onChange={setFilter('collection')} options={colOpts} />
          <label className="acheck"><input type="checkbox" checked={filters.unassigned} onChange={(e) => setFilter('unassigned')(e.target.checked)} /> Unassigned only</label>
        </div>

        {selected.size > 0 && (
          <div className="bulkbar" role="region" aria-label="Bulk actions">
            <strong>{selected.size} selected</strong>
            <select aria-label="Assign category" value={bulk.category} onChange={(e) => setBulk((b) => ({ ...b, category: e.target.value }))}><option value="">Category…</option>{catOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <select aria-label="Assign project" value={bulk.project} onChange={(e) => setBulk((b) => ({ ...b, project: e.target.value }))}><option value="">Project…</option>{projectOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <select aria-label="Assign collection" value={bulk.collection} onChange={(e) => setBulk((b) => ({ ...b, collection: e.target.value }))}><option value="">Collection…</option>{colOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            <button type="button" className="abtn abtn--sm" onClick={bulkAssign}>Assign</button>
            <button type="button" className="abtn abtn--sm" onClick={() => applyBulk({ featured: true }, 'Marked as featured')}>Feature</button>
            <button type="button" className="abtn abtn--sm" onClick={() => applyBulk({ featured: false }, 'Removed from featured')}>Unfeature</button>
            <button type="button" className="abtn abtn--sm" onClick={() => setToDelete('bulk')}>Delete</button>
            <button type="button" className="abtn abtn--sm" onClick={() => setSelected(new Set())}>Clear</button>
          </div>
        )}

        <ErrorBanner error={error} onRetry={reload} />
        {loading && !rows.length ? <Spinner /> : rows.length === 0 && !error ? <Empty>No images found.</Empty> : (
          <>
            <label className="acheck" style={{ marginBottom: 10 }}>
              <input type="checkbox" checked={allSelected} onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map((r) => r._id)))} /> Select all on this page
            </label>
            <div className="igrid">
              {rows.map((img) => (
                <div key={img._id} className={`icard ${selected.has(img._id) ? 'is-selected' : ''}`}>
                  <img className="icard__img" src={cld(img.cloudinaryUrl, { w: 320, h: 320 })} alt={img.altText || img.title || ''} loading="lazy" />
                  <label className="icard__check"><input type="checkbox" checked={selected.has(img._id)} onChange={() => toggle(img._id)} aria-label={`Select ${img.title || 'image'}`} /></label>
                  <div className="icard__tools">
                    <button type="button" onClick={() => toggleFeatured(img)} aria-label="Toggle featured" aria-pressed={img.featured}><Star size={14} fill={img.featured ? 'currentColor' : 'none'} className="icard__star" /></button>
                    <button type="button" onClick={() => setEditing(img)} aria-label={`Edit ${img.title || 'image'}`}><Pencil size={14} /></button>
                    <button type="button" onClick={() => setToDelete(img)} aria-label={`Delete ${img.title || 'image'}`}><Trash2 size={14} /></button>
                  </div>
                  <div className="icard__body">
                    <span className="icard__title">{img.title || 'Untitled'}</span>
                    <span className="icard__meta">{[img.project?.title, img.category?.name].filter(Boolean).join(' · ') || 'Unassigned'}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} label="images" />}
      </div>

      {editing && <EditModal image={editing} categories={categories} projects={projects} collections={collections} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
      {toDelete && (
        <ConfirmDialog title="Delete images" busy={busy} onConfirm={confirmDelete} onClose={() => setToDelete(null)}
          message={toDelete === 'bulk' ? `Permanently delete ${selected.size} selected images, including the files on Cloudinary?` : 'Permanently delete this image, including the file on Cloudinary?'} />
      )}
    </>
  );
}
