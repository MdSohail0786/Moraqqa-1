import ResourceManager from '../components/ResourceManager.jsx';
import AssetInput from '../components/AssetInput.jsx';
import { Field } from '../components/ui.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

const GROUPS = { type: 'Project type', style: 'Style', room: 'Room type' };

export default function Categories() {
  const { reload } = useSettings();
  return (
    <ResourceManager
      path="categories" title="Categories" noun="Category" sortable onChanged={reload}
      subtitle="Project types, styles and room types. These drive navigation, filters and category pages."
      blank={{ name: '', group: 'type', description: '', coverImage: undefined }}
      validate={(v) => (v.name.trim().length < 2 ? { name: 'Name is required (at least 2 characters)' } : {})}
      toPayload={(v) => ({ name: v.name.trim(), group: v.group, description: v.description, coverImage: v.coverImage || null })}
      rowTitle={(d) => d.name}
      rowMeta={(d) => `${GROUPS[d.group]} · /projects/${d.slug}`}
      rowImage={(d) => d.coverImage?.url}
      renderForm={({ values, set, setValues, errors }) => (
        <div className="agrid">
          <Field label="Name *" htmlFor="c-name" error={errors.name}><input id="c-name" type="text" value={values.name} onChange={set('name')} maxLength={80} autoFocus /></Field>
          <Field label="Group" htmlFor="c-group" hint="Type = residential, commercial… · Style = modern, classic… · Room = bedroom, kitchen…">
            <select id="c-group" value={values.group} onChange={set('group')}>{Object.entries(GROUPS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          </Field>
          <Field label="Description" htmlFor="c-desc"><textarea id="c-desc" rows={3} value={values.description} onChange={set('description')} maxLength={600} /></Field>
          <AssetInput label="Cover image" folder="categories" value={values.coverImage} onChange={(v) => setValues((c) => ({ ...c, coverImage: v }))} />
        </div>
      )}
    />
  );
}
