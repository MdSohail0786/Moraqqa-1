import ResourceManager from '../components/ResourceManager.jsx';
import AssetInput from '../components/AssetInput.jsx';
import { Field } from '../components/ui.jsx';

export default function Collections() {
  return (
    <ResourceManager
      path="collections" title="Collections" noun="Collection" sortable
      subtitle="Visual libraries by room, object or material. Assign images to a collection from the Images page."
      blank={{ title: '', description: '', coverImage: undefined, featured: false }}
      validate={(v) => (v.title.trim().length < 2 ? { title: 'Title is required (at least 2 characters)' } : {})}
      toPayload={(v) => ({ title: v.title.trim(), description: v.description, coverImage: v.coverImage || null, featured: v.featured })}
      rowTitle={(d) => d.title}
      rowMeta={(d) => `${d.imageCount ?? 0} images · /collections/${d.slug}`}
      rowImage={(d) => d.coverImage?.url}
      rowExtra={(d) => d.featured && <span className="tag tag--warn">Featured</span>}
      renderForm={({ values, set, setValues, errors }) => (
        <div className="agrid">
          <Field label="Title *" htmlFor="col-title" error={errors.title}><input id="col-title" type="text" value={values.title} onChange={set('title')} maxLength={100} autoFocus /></Field>
          <Field label="Description" htmlFor="col-desc"><textarea id="col-desc" rows={3} value={values.description} onChange={set('description')} maxLength={800} /></Field>
          <AssetInput label="Cover image" folder="collections" value={values.coverImage} onChange={(v) => setValues((c) => ({ ...c, coverImage: v }))} />
          <label className="acheck"><input type="checkbox" checked={values.featured} onChange={set('featured')} /> Featured on homepage</label>
        </div>
      )}
    />
  );
}
