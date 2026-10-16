import ResourceManager from '../components/ResourceManager.jsx';
import AssetInput from '../components/AssetInput.jsx';
import { Field } from '../components/ui.jsx';
import { adminArticleById } from '../../services/endpoints.js';
import { formatDate } from '../../utils/helpers.js';

export default function Journal() {
  return (
    <ResourceManager
      path="journal" title="Journal" noun="Article" wide
      subtitle="Write, draft and publish journal articles."
      query={{ all: true }}
      blank={{ title: '', excerpt: '', content: '', coverImage: undefined, author: 'MORAQQA Studio', category: 'Design', tags: '', featured: false, published: false }}
      loadDoc={(d) => adminArticleById(d._id).then((r) => r.data)}
      toForm={(d) => ({ title: d.title, excerpt: d.excerpt || '', content: d.content || '', coverImage: d.coverImage, author: d.author || '', category: d.category || '', tags: (d.tags || []).join(', '), featured: Boolean(d.featured), published: Boolean(d.published) })}
      validate={(v) => {
        const e = {};
        if (v.title.trim().length < 2) e.title = 'Title is required';
        if (v.content.trim().length < 20) e.content = 'Article content is too short (at least 20 characters)';
        return e;
      }}
      toPayload={(v) => ({ ...v, title: v.title.trim(), coverImage: v.coverImage || null, tags: v.tags.split(',').map((t) => t.trim()).filter(Boolean) })}
      rowTitle={(d) => d.title}
      rowMeta={(d) => `${d.category} · ${d.published ? `Published ${formatDate(d.publishedAt)}` : 'Draft'}`}
      rowImage={(d) => d.coverImage?.url}
      rowExtra={(d) => <><span className={`tag ${d.published ? 'tag--ok' : 'tag--muted'}`}>{d.published ? 'Published' : 'Draft'}</span> {d.featured && <span className="tag tag--warn">Featured</span>}</>}
      renderForm={({ values, set, setValues, errors }) => (
        <div className="agrid">
          <Field label="Title *" htmlFor="a-title" error={errors.title}><input id="a-title" type="text" value={values.title} onChange={set('title')} maxLength={180} autoFocus /></Field>
          <div className="agrid agrid--3">
            <Field label="Author" htmlFor="a-author"><input id="a-author" type="text" value={values.author} onChange={set('author')} /></Field>
            <Field label="Category" htmlFor="a-cat"><input id="a-cat" type="text" value={values.category} onChange={set('category')} /></Field>
            <Field label="Tags" htmlFor="a-tags" hint="Comma separated"><input id="a-tags" type="text" value={values.tags} onChange={set('tags')} /></Field>
          </div>
          <Field label="Excerpt" htmlFor="a-ex"><textarea id="a-ex" rows={2} value={values.excerpt} onChange={set('excerpt')} maxLength={400} /></Field>
          <Field label="Content *" htmlFor="a-content" error={errors.content} hint="Separate paragraphs with a blank line"><textarea id="a-content" rows={12} value={values.content} onChange={set('content')} /></Field>
          <AssetInput label="Cover image" folder="journal" value={values.coverImage} onChange={(v) => setValues((c) => ({ ...c, coverImage: v }))} />
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <label className="acheck"><input type="checkbox" checked={values.published} onChange={set('published')} /> Published (otherwise saved as draft)</label>
            <label className="acheck"><input type="checkbox" checked={values.featured} onChange={set('featured')} /> Featured article</label>
          </div>
        </div>
      )}
    />
  );
}
