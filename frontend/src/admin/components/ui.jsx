import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cx } from '../../utils/helpers.js';

export function Field({ label, error, hint, children, className, htmlFor }) {
  return (
    <div className={cx('afield', error && 'has-error', className)}>
      {label && <label htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <p className="afield__hint">{hint}</p>}
      {error && <p className="afield__err" role="alert">{error}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__scrim" onClick={onClose} />
      <div className={cx('modal__box', wide && 'modal__box--wide')} ref={ref} tabIndex={-1}>
        <div className="modal__head">
          <h2>{title}</h2>
          <button type="button" className="abtn abtn--ghost abtn--icon" onClick={onClose} aria-label="Close dialog"><X size={20} /></button>
        </div>
        {children}
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** Confirmation dialog for destructive actions. */
export function ConfirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Delete', busy, onConfirm, onClose, children }) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="abtn" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="abtn abtn--danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </>
      }
    >
      <p>{message}</p>
      {children}
    </Modal>
  );
}

export const Spinner = () => <span className="spinner" role="status" aria-label="Loading" />;

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="apage__head">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      <div className="apage__actions">{children}</div>
    </div>
  );
}

export function Pager({ page, pages, total, onPage, label = 'items' }) {
  return (
    <div className="apager">
      <span>{total} {label}</span>
      {pages > 1 && (
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="abtn abtn--sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="abtn abtn--sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>Next</button>
        </span>
      )}
    </div>
  );
}

export const Empty = ({ children }) => <div className="empty-admin">{children}</div>;
export const ErrorBanner = ({ error, onRetry }) =>
  error ? (
    <div className="alert" role="alert">
      {error.message}{' '}
      {onRetry && <button type="button" className="abtn abtn--sm" onClick={onRetry} style={{ marginLeft: 8 }}>Retry</button>}
    </div>
  ) : null;
