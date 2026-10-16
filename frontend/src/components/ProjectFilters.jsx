import { useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { fetchProjectFilters } from '../services/endpoints.js';
import useFetch from '../hooks/useFetch.js';

const GROUPS = [
  { key: 'category', label: 'Category' },
  { key: 'style', label: 'Style' },
  { key: 'location', label: 'Location' },
  { key: 'year', label: 'Year' },
  { key: 'roomType', label: 'Room type' },
  { key: 'projectType', label: 'Project type' },
];

const labelOf = (v) => String(v).replace(/-/g, ' ');

/**
 * Multi-select filters. `value` is { key: string[] }. Every change calls onChange,
 * and the parent turns it into a GET /api/projects query.
 */
export default function ProjectFilters({ value, onChange, total, loading }) {
  const [open, setOpen] = useState(false);
  const { data } = useFetch(() => fetchProjectFilters(), []);
  const f = data?.data;

  const options = useMemo(() => {
    if (!f) return {};
    const cats = f.categories || [];
    return {
      category: cats.filter((c) => c.group === 'type').map((c) => ({ value: c.slug, label: c.name })),
      style: (f.styles || []).map((s) => ({ value: s, label: labelOf(s) })),
      location: (f.locations || []).map((l) => ({ value: l.split(',')[0].trim(), label: l.split(',')[0].trim() })).filter((o, i, a) => a.findIndex((x) => x.value === o.value) === i),
      year: (f.years || []).map((y) => ({ value: String(y), label: String(y) })),
      roomType: (f.roomTypes || []).map((r) => ({ value: r, label: labelOf(r) })),
      projectType: (f.projectTypes || []).map((t) => ({ value: t, label: t })),
    };
  }, [f]);

  const active = GROUPS.flatMap((g) => (value[g.key] || []).map((v) => ({ group: g.key, value: v })));

  const toggle = (group, v) => {
    const current = value[group] || [];
    const next = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
    onChange({ ...value, [group]: next });
  };

  return (
    <div className="filters">
      <div className="filters__bar">
        <button type="button" className="filters__toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="filters-panel">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Filter
          {active.length > 0 && <span className="filters__count" aria-label={`${active.length} filters active`}>{active.length}</span>}
        </button>
        <p className="filters__result" role="status" aria-live="polite">
          {loading ? 'Updating…' : `${total} project${total === 1 ? '' : 's'}`}
        </p>
      </div>

      {active.length > 0 && (
        <div className="active-filters" aria-label="Active filters">
          {active.map((a) => (
            <button key={`${a.group}-${a.value}`} type="button" onClick={() => toggle(a.group, a.value)} aria-label={`Remove filter ${labelOf(a.value)}`}>
              {labelOf(a.value)} <X size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div id="filters-panel">
          <div className="filters__panel">
            {GROUPS.map((g) =>
              options[g.key]?.length ? (
                <div className="filters__group" key={g.key}>
                  <h3>{g.label}</h3>
                  <div className="filters__chips">
                    {options[g.key].map((o) => (
                      <button key={o.value} type="button" aria-pressed={(value[g.key] || []).includes(o.value)} onClick={() => toggle(g.key, o.value)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null
            )}
            {!f && <p className="muted">Loading filters…</p>}
          </div>
          <div className="filters__actions">
            <button type="button" className="btn btn--line btn--small" onClick={() => onChange({})} disabled={!active.length}>Clear all</button>
            <button type="button" className="btn btn--solid btn--small" onClick={() => setOpen(false)}>Show results</button>
          </div>
        </div>
      )}
    </div>
  );
}
