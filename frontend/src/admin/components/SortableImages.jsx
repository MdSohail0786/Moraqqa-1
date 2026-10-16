import {
  DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

/** Drag-and-drop wrapper. `onReorder(newItems)` receives the full list in its new order. */
export function SortableList({ items, onReorder, children, layout = 'grid' }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i._id === active.id);
    const to = items.findIndex((i) => i._id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i._id)} strategy={layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Render-prop wrapper that provides drag handle props for one sortable item. */
export function SortableItem({ id, className, children, as: Tag = 'div' }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <Tag ref={setNodeRef} style={style} className={`${className || ''} ${isDragging ? 'is-dragging' : ''}`}>
      {children({ handle: { ref: setActivatorNodeRef, ...attributes, ...listeners } })}
    </Tag>
  );
}

export const Grip = ({ handle, className = 'icard__grip', label = 'Drag to reorder' }) => (
  <button type="button" className={className} aria-label={label} title={label} {...handle}>
    <GripVertical size={16} />
  </button>
);
