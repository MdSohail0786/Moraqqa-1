import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { uploadMedia } from '../../services/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { cld } from '../../utils/cloudinary.js';
import { Field } from './ui.jsx';

const MAX = 15 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Single image field (logo, cover, hero, before/after). The file goes to the backend,
 * which uploads to Cloudinary; the field's value is { url, publicId, alt }.
 */
export default function AssetInput({ label, value, onChange, folder = 'site', hint, withAlt = true }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [state, setState] = useState({ busy: false, pct: 0 });

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!TYPES.includes(file.type)) return toast.error('Only JPG, PNG or WEBP images are allowed.');
    if (file.size > MAX) return toast.error('Image is larger than 15MB.');
    setState({ busy: true, pct: 0 });
    try {
      const res = await uploadMedia(file, folder, (p) => setState({ busy: true, pct: Math.round((p.loaded / (p.total || file.size)) * 100) }));
      onChange({ url: res.data.url, publicId: res.data.publicId, alt: value?.alt || '' });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setState({ busy: false, pct: 0 });
    }
  };

  return (
    <Field label={label} hint={hint}>
      <div className="asset-input">
        <div className="asset-input__preview">
          {value?.url ? <img src={cld(value.url, { w: 240, h: 180 })} alt="" /> : 'No image'}
        </div>
        <div className="asset-input__ctrl">
          <input ref={inputRef} type="file" accept={TYPES.join(',')} onChange={pick} hidden />
          <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="abtn abtn--sm" onClick={() => inputRef.current?.click()} disabled={state.busy}>
              <ImagePlus size={14} /> {state.busy ? `Uploading ${state.pct}%` : value?.url ? 'Replace' : 'Upload'}
            </button>
            {value?.url && !state.busy && (
              <button type="button" className="abtn abtn--sm abtn--danger" onClick={() => onChange(undefined)}><Trash2 size={14} /> Remove</button>
            )}
          </span>
          {withAlt && value?.url && (
            <input className="ainput" type="text" placeholder="Alt text (describe the image)" value={value.alt || ''} onChange={(e) => onChange({ ...value, alt: e.target.value })} aria-label={`${label} alt text`} />
          )}
        </div>
      </div>
    </Field>
  );
}
