import { Plus, Trash2 } from 'lucide-react';
import ResourceManager from '../components/ResourceManager.jsx';
import AssetInput from '../components/AssetInput.jsx';
import { Field } from '../components/ui.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function Services() {
  const { types } = useSettings();
  return (
    <ResourceManager
      path="services" title="Services" noun="Service" sortable wide
      subtitle="Shown on the Services page and the homepage when featured."
      blank={{ title: '', description: '', content: '', image: undefined, process: [], relatedCategory: '', featured: false }}
      toForm={(d) => ({ title: d.title, description: d.description, content: d.content || '', image: d.image, process: d.process || [], relatedCategory: d.relatedCategory?._id || d.relatedCategory || '', featured: Boolean(d.featured) })}
      validate={(v) => {
        const e = {};
        if (v.title.trim().length < 2) e.title = 'Title is required';
        if (v.description.trim().length < 10) e.description = 'Description must be at least 10 characters';
        return e;
      }}
      toPayload={(v) => ({
        title: v.title.trim(), description: v.description.trim(), content: v.content, image: v.image || null,
        process: v.process.filter((p) => p.title?.trim()), relatedCategory: v.relatedCategory || null, featured: v.featured,
      })}
      rowTitle={(d) => d.title}
      rowMeta={(d) => d.description}
      rowImage={(d) => d.image?.url}
      rowExtra={(d) => d.featured && <span className="tag tag--warn">Featured</span>}
      renderForm={({ values, set, setValues, errors }) => (
        <div className="agrid">
          <div className="agrid agrid--2">
            <Field label="Title *" htmlFor="s-title" error={errors.title}><input id="s-title" type="text" value={values.title} onChange={set('title')} maxLength={100} autoFocus /></Field>
            <Field label="Related project category" htmlFor="s-cat" hint="Used to pick related projects">
              <select id="s-cat" value={values.relatedCategory} onChange={set('relatedCategory')}><option value="">Any (latest featured)</option>{types.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
            </Field>
          </div>
          <Field label="Short description *" htmlFor="s-desc" error={errors.description}><textarea id="s-desc" rows={2} value={values.description} onChange={set('description')} maxLength={600} /></Field>
          <Field label="Detailed content" htmlFor="s-content" hint="Separate paragraphs with a blank line"><textarea id="s-content" rows={5} value={values.content} onChange={set('content')} /></Field>
          <AssetInput label="Image" folder="services" value={values.image} onChange={(v) => setValues((c) => ({ ...c, image: v }))} />
          <div className="afield">
            <span className="label">Process steps</span>
            {values.process.map((step, i) => (
              <div key={i} className="agrid" style={{ gridTemplateColumns: '1fr 2fr auto', alignItems: 'start' }}>
                <input className="ainput" type="text" placeholder="Step title" aria-label={`Step ${i + 1} title`} value={step.title || ''} onChange={(e) => setValues((c) => ({ ...c, process: c.process.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)) }))} />
                <input className="ainput" type="text" placeholder="Step description" aria-label={`Step ${i + 1} description`} value={step.text || ''} onChange={(e) => setValues((c) => ({ ...c, process: c.process.map((s, j) => (j === i ? { ...s, text: e.target.value } : s)) }))} />
                <button type="button" className="abtn abtn--sm abtn--icon abtn--danger" aria-label={`Remove step ${i + 1}`} onClick={() => setValues((c) => ({ ...c, process: c.process.filter((_, j) => j !== i) }))}><Trash2 size={14} /></button>
              </div>
            ))}
            <div><button type="button" className="abtn abtn--sm" onClick={() => setValues((c) => ({ ...c, process: [...c.process, { title: '', text: '' }] }))}><Plus size={14} /> Add step</button></div>
          </div>
          <label className="acheck"><input type="checkbox" checked={values.featured} onChange={set('featured')} /> Featured on homepage</label>
        </div>
      )}
    />
  );
}
