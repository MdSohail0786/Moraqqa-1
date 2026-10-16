import { useRef, useState } from 'react';
import CloudImage from './CloudImage.jsx';

/** Before/after comparison. Drag the handle, or use the range input (keyboard accessible). */
export default function BeforeAfter({ before, after }) {
  const [pos, setPos] = useState(50);
  const ref = useRef(null);
  const dragging = useRef(false);

  const updateFromPointer = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  return (
    <div
      ref={ref}
      className="ba"
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        updateFromPointer(e);
      }}
      onPointerMove={(e) => dragging.current && updateFromPointer(e)}
      onPointerUp={() => {
        dragging.current = false;
      }}
      data-cursor="drag"
    >
      <CloudImage src={after.url} alt={after.alt || 'After renovation'} ratio="16 / 9" sizes="(max-width: 1200px) 100vw, 1200px" />
      <div className="ba__before" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <CloudImage src={before.url} alt={before.alt || 'Before renovation'} ratio="16 / 9" sizes="(max-width: 1200px) 100vw, 1200px" />
      </div>
      <span className="ba__tag ba__tag--before">Before</span>
      <span className="ba__tag ba__tag--after">After</span>
      <span className="ba__handle" style={{ left: `${pos}%` }} aria-hidden="true">
        <span className="ba__grip" />
      </span>
      <input
        className="ba__range"
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(pos)}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Reveal the before image"
      />
    </div>
  );
}
