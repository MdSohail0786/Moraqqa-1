import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import useFetch from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useMisc.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminProjects, deleteProject, updateProject } from '../../services/endpoints.js';
import { cld } from '../../utils/cloudinary.js';
import { ConfirmDialog, Empty, ErrorBanner, PageHead, Pager, Spinner } from '../components/ui.jsx';

export default function Projects() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const [alsoImages, setAlsoImages] = useState(false);
  const [busy, setBusy] = useState(false);
  const dq = useDebounce(q, 350);

  const { data, loading, error, reload } = useFetch(() => adminProjects({ q: dq || undefined, page, limit: 15, sort: 'manual' }), [dq, page]);
  const rows = data?.data || [];

  const patch = useCallback(async (p, changes, msg) => {
    try {
      await updateProject(p._id, changes);
      toast.success(msg);
      reload();
    } catch (err) { toast.error(err.message); }
  }, [toast, reload]);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteProject(toDelete._id, alsoImages);
      toast.success('Project deleted');
      setToDelete(null);
      setAlsoImages(false);
      if (rows.length === 1 && page > 1) setPage(page - 1); else reload();
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHead title="Projects" subtitle="Create, publish and feature projects.">
        <Link to="/admin/projects/new" className="abtn abtn--primary"><Plus size={15} /> New project</Link>
      </PageHead>
      <div className="atoolbar">
        <input className="ainput" type="search" placeholder="Search projects…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search projects" />
      </div>
      <ErrorBanner error={error} onRetry={reload} />
      {loading && !rows.length ? <Spinner /> : rows.length === 0 && !error ? (
        <Empty>{dq ? 'No projects match your search.' : 'No projects yet. Create your first project.'}</Empty>
      ) : (
        <div className="atable-wrap">
          <table className="atable">
            <thead><tr><th /><th>Project</th><th>Category</th><th>Images</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p._id}>
                  <td>{p.coverImage?.url ? <img className="atable__thumb" src={cld(p.coverImage.url, { w: 160, h: 120 })} alt="" /> : <div className="atable__thumb" />}</td>
                  <td><strong>{p.title}</strong><br /><small>{[p.location, p.year].filter(Boolean).join(' · ')}</small></td>
                  <td>{p.category?.name || p.projectType}</td>
                  <td>{p.imageCount}</td>
                  <td>
                    <span className={`tag ${p.published ? 'tag--ok' : 'tag--muted'}`}>{p.published ? 'Published' : 'Draft'}</span>{' '}
                    {p.featured && <span className="tag tag--warn">Featured</span>}
                  </td>
                  <td>
                    <div className="atable__actions">
                      <button type="button" className="abtn abtn--sm abtn--icon" onClick={() => patch(p, { published: !p.published }, p.published ? 'Project unpublished' : 'Project published')} aria-label={p.published ? `Unpublish ${p.title}` : `Publish ${p.title}`} title={p.published ? 'Unpublish' : 'Publish'}>
                        {p.published ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button type="button" className="abtn abtn--sm abtn--icon" onClick={() => patch(p, { featured: !p.featured }, p.featured ? 'Removed from featured' : 'Marked as featured')} aria-label={p.featured ? `Unfeature ${p.title}` : `Feature ${p.title}`} aria-pressed={p.featured} title="Toggle featured">
                        <Star size={15} fill={p.featured ? 'currentColor' : 'none'} />
                      </button>
                      <Link className="abtn abtn--sm abtn--icon" to={`/admin/projects/${p._id}/edit`} aria-label={`Edit ${p.title}`}><Pencil size={15} /></Link>
                      <button type="button" className="abtn abtn--sm abtn--icon abtn--danger" onClick={() => setToDelete(p)} aria-label={`Delete ${p.title}`}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} label="projects" />}

      {toDelete && (
        <ConfirmDialog title="Delete project" message={`Delete “${toDelete.title}”? This cannot be undone.`} busy={busy} onConfirm={confirmDelete} onClose={() => setToDelete(null)}>
          <label className="acheck" style={{ marginTop: 8 }}>
            <input type="checkbox" checked={alsoImages} onChange={(e) => setAlsoImages(e.target.checked)} />
            Also permanently delete its {toDelete.imageCount} images from Cloudinary
          </label>
          {!alsoImages && toDelete.imageCount > 0 && <p className="afield__hint" style={{ marginTop: 8 }}>Otherwise the images stay in the library, unassigned.</p>}
        </ConfirmDialog>
      )}
    </>
  );
}
