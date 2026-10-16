import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ImageIcon, Star, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import {
  adminImages, adminProjectById, createProject, deleteImage, reorderImages, updateImage, updateProject,
} from '../../services/endpoints.js';
import { cld } from '../../utils/cloudinary.js';
import { Empty, ErrorBanner, Field, PageHead, Spinner, ConfirmDialog } from '../components/ui.jsx';
import AssetInput from '../components/AssetInput.jsx';
import UploadPanel from '../components/UploadPanel.jsx';
import { Grip, SortableItem, SortableList } from '../components/SortableImages.jsx';
import { PROJECT_TYPES } from '../../config/site.js';

const BLANK = {
  title: '', description: '', story: '', location: '', year: new Date().getFullYear(), category: '', style: '', projectType: 'Residential',
  roomTypes: '', area: '', client: '', designType: '', status: 'Completed', featured: false, published: false, tags: '', coverImage: undefined, beforeAfter: {},
};

const listToText = (v) => (Array.isArray(v) ? v.join(', ') : v || '');

function Gallery({ projectId, project, onCoverChange }) {
  const toast = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Admin gallery management loads in pages of 60 until all images for this project are in
      let page = 1;
      let all = [];
      for (;;) {
        // eslint-disable-next-line no-await-in-loop
        const res = await adminImages({ project: projectId, limit: 60, page });
        all = [...all, ...res.data];
        if (!res.hasMore) break;
        page += 1;
      }
      setImages(all);
    } catch (err) { setError(err); } finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const onReorder = async (next) => {
    const previous = images;
    setImages(next);
    try {
      await reorderImages(next.map((img, i) => ({ id: img._id, order: i })));
      toast.success('Image order saved');
    } catch (err) {
      setImages(previous);
      toast.error(`Could not save order: ${err.message}`);
    }
  };

  const setCover = async (img) => {
    try {
      await updateProject(projectId, { coverImage: { url: img.cloudinaryUrl, publicId: img.cloudinaryPublicId, alt: img.altText } });
      onCoverChange({ url: img.cloudinaryUrl, publicId: img.cloudinaryPublicId, alt: img.altText });
      toast.success('Cover image updated');
    } catch (err) { toast.error(err.message); }
  };

  const toggleFeatured = async (img) => {
    try {
      await updateImage(img._id, { featured: !img.featured });
      setImages((cur) => cur.map((i) => (i._id === img._id ? { ...i, featured: !i.featured } : i)));
    } catch (err) { toast.error(err.message); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await deleteImage(toDelete._id);
      setImages((cur) => cur.filter((i) => i._id !== toDelete._id));
      toast.success('Image deleted');
      setToDelete(null);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="acard">
      <h2>Gallery</h2>
      <p className="afield__hint" style={{ marginBottom: 14 }}>Drag the handle to reorder. The public gallery follows this order. Images upload straight to Cloudinary in folder <code>projects/{project.slug}</code>.</p>
      <UploadPanel meta={{ project: projectId }} onUploaded={load} />
      <div style={{ marginTop: 24 }}>
        <ErrorBanner error={error} onRetry={load} />
        {loading ? <Spinner /> : images.length === 0 ? <Empty>No images yet. Upload some above.</Empty> : (
          <SortableList items={images} onReorder={onReorder}>
            <div className="igrid">
              {images.map((img, i) => (
                <SortableItem key={img._id} id={img._id} className="icard">
                  {({ handle }) => (
                    <>
                      <img className="icard__img" src={cld(img.cloudinaryUrl, { w: 320, h: 320 })} alt={img.altText || img.title || ''} loading="lazy" />
                      {project.coverImage?.publicId === img.cloudinaryPublicId && <span className="cover-badge">Cover</span>}
                      <Grip handle={handle} />
                      <span className="icard__order">{i + 1}</span>
                      <div className="icard__tools">
                        <button type="button" onClick={() => setCover(img)} aria-label="Use as cover image" title="Use as cover"><ImageIcon size={14} /></button>
                        <button type="button" onClick={() => toggleFeatured(img)} aria-label="Toggle featured image" aria-pressed={img.featured} title="Featured"><Star size={14} fill={img.featured ? 'currentColor' : 'none'} className="icard__star" /></button>
                        <button type="button" onClick={() => setToDelete(img)} aria-label="Delete image" title="Delete"><Trash2 size={14} /></button>
                      </div>
                      <div className="icard__body"><span className="icard__title">{img.title || 'Untitled'}</span></div>
                    </>
                  )}
                </SortableItem>
              ))}
            </div>
          </SortableList>
        )}
      </div>
      {toDelete && <ConfirmDialog title="Delete image" message="Delete this image from the project and from Cloudinary?" busy={busy} onConfirm={remove} onClose={() => setToDelete(null)} />}
    </div>
  );
}

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const { categories, reload: reloadCategories } = useSettings();
  const [values, setValues] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null); // loaded project document (slug, cover ...)

  const { data, loading, error, reload } = useFetch(() => adminProjectById(id), [id], { enabled: isEdit });

  useEffect(() => {
    if (!data?.data) return;
    const p = data.data;
    setSaved(p);
    setValues({
      ...BLANK, ...p,
      category: p.category?._id || '',
      roomTypes: listToText(p.roomTypes), tags: listToText(p.tags),
      year: p.year ?? '', beforeAfter: p.beforeAfter || {},
    });
  }, [data]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((cur) => ({ ...cur, [k]: v }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (values.title.trim().length < 2) found.title = 'Title is required (at least 2 characters)';
    if (values.year && (Number(values.year) < 1900 || Number(values.year) > 2100)) found.year = 'Enter a valid year';
    setErrors(found);
    if (Object.keys(found).length) { toast.error('Please fix the highlighted fields.'); return; }

    const payload = {
      ...values,
      title: values.title.trim(),
      year: values.year ? Number(values.year) : undefined,
      category: values.category || null,
      coverImage: values.coverImage || null,
      beforeAfter: values.beforeAfter?.before?.url && values.beforeAfter?.after?.url ? values.beforeAfter : { before: undefined, after: undefined },
    };
    delete payload._id; delete payload.__v; delete payload.createdAt; delete payload.updatedAt; delete payload.gallery; delete payload.imageCount; delete payload.slug;

    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateProject(id, payload);
        setSaved(res.data);
        toast.success('Project updated');
      } else {
        const res = await createProject(payload);
        toast.success('Project created. You can now upload its gallery.');
        navigate(`/admin/projects/${res.data._id}/edit`, { replace: true });
      }
      reloadCategories();
    } catch (err) {
      if (err.details?.length) setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  if (isEdit && loading) return <Spinner />;
  const types = categories.filter((c) => c.group === 'type');
  const styles = categories.filter((c) => c.group === 'style');

  return (
    <>
      <PageHead title={isEdit ? 'Edit project' : 'New project'} subtitle={isEdit ? saved?.title : 'Fill in the details, then upload the gallery after saving.'}>
        <Link to="/admin/projects" className="abtn">Back to projects</Link>
        {isEdit && saved?.published && <a href={`/projects/${saved.slug}`} className="abtn" target="_blank" rel="noopener noreferrer">View live</a>}
      </PageHead>
      <ErrorBanner error={error} onRetry={reload} />

      <form onSubmit={submit} noValidate>
        <div className="acard">
          <h2>Details</h2>
          <div className="agrid agrid--2">
            <Field label="Title *" htmlFor="title" error={errors.title}><input id="title" type="text" value={values.title} onChange={set('title')} maxLength={140} /></Field>
            <Field label="Location" htmlFor="location" hint="e.g. Mumbai, India"><input id="location" type="text" value={values.location} onChange={set('location')} maxLength={120} /></Field>
            <Field label="Year" htmlFor="year" error={errors.year}><input id="year" type="number" value={values.year} onChange={set('year')} min={1900} max={2100} /></Field>
            <Field label="Area" htmlFor="area" hint="e.g. 4,200 sq ft"><input id="area" type="text" value={values.area} onChange={set('area')} /></Field>
            <Field label="Category" htmlFor="category">
              <select id="category" value={values.category} onChange={set('category')}><option value="">None</option>{types.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
            </Field>
            <Field label="Project type" htmlFor="projectType"><select id="projectType" value={values.projectType} onChange={set('projectType')}>{PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Style" htmlFor="style" hint={styles.length ? `Existing styles: ${styles.map((s) => s.slug).join(', ')}` : 'e.g. modern'}><input id="style" type="text" value={values.style} onChange={set('style')} list="style-list" /></Field>
            <datalist id="style-list">{styles.map((s) => <option key={s._id} value={s.slug} />)}</datalist>
            <Field label="Room types" htmlFor="roomTypes" hint="Comma separated slugs, e.g. living-room, bedroom"><input id="roomTypes" type="text" value={values.roomTypes} onChange={set('roomTypes')} /></Field>
            <Field label="Client" htmlFor="client"><input id="client" type="text" value={values.client} onChange={set('client')} /></Field>
            <Field label="Design type" htmlFor="designType"><input id="designType" type="text" value={values.designType} onChange={set('designType')} placeholder="Full interior design" /></Field>
            <Field label="Status" htmlFor="status"><select id="status" value={values.status} onChange={set('status')}>{['Completed', 'In Progress', 'Concept'].map((s) => <option key={s}>{s}</option>)}</select></Field>
            <Field label="Tags" htmlFor="tags" hint="Comma separated" className="full"><input id="tags" type="text" value={values.tags} onChange={set('tags')} /></Field>
          </div>
          <div className="agrid" style={{ marginTop: 18 }}>
            <Field label="Short description" htmlFor="description" hint="Used for SEO and project cards (max 600 characters)"><textarea id="description" rows={3} value={values.description} onChange={set('description')} maxLength={600} /></Field>
            <Field label="Design story" htmlFor="story" hint="Separate paragraphs with a blank line"><textarea id="story" rows={8} value={values.story} onChange={set('story')} /></Field>
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 18, flexWrap: 'wrap' }}>
            <label className="acheck"><input type="checkbox" checked={values.published} onChange={set('published')} /> Published</label>
            <label className="acheck"><input type="checkbox" checked={values.featured} onChange={set('featured')} /> Featured on homepage</label>
          </div>
        </div>

        <div className="acard">
          <h2>Cover &amp; before / after</h2>
          <div className="agrid agrid--2">
            <AssetInput label="Cover image" folder={`projects/${saved?.slug || 'new'}`} value={values.coverImage} onChange={(v) => setValues((c) => ({ ...c, coverImage: v }))} hint="Or pick one from the gallery below" />
          </div>
          <div className="agrid agrid--2" style={{ marginTop: 18 }}>
            <AssetInput label="Before image (optional)" folder="before-after" value={values.beforeAfter?.before} onChange={(v) => setValues((c) => ({ ...c, beforeAfter: { ...c.beforeAfter, before: v } }))} />
            <AssetInput label="After image (optional)" folder="before-after" value={values.beforeAfter?.after} onChange={(v) => setValues((c) => ({ ...c, beforeAfter: { ...c.beforeAfter, after: v } }))} />
          </div>
        </div>

        <div style={{ margin: '20px 0', display: 'flex', gap: 10 }}>
          <button type="submit" className="abtn abtn--primary" disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}</button>
          <Link to="/admin/projects" className="abtn">Cancel</Link>
        </div>
      </form>

      {isEdit && saved && <Gallery projectId={id} project={{ ...saved, coverImage: values.coverImage || saved.coverImage }} onCoverChange={(cover) => setValues((c) => ({ ...c, coverImage: cover }))} />}
    </>
  );
}
