export const cx = (...args) => args.filter(Boolean).join(' ');

export const formatDate = (value, opts = { year: 'numeric', month: 'long', day: 'numeric' }) =>
  value ? new Date(value).toLocaleDateString('en-IN', opts) : '';

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '';

export const toTitle = (slug = '') => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const paragraphs = (text = '') =>
  String(text)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export const pad = (n) => String(n).padStart(2, '0');

export const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PHONE_RX = /^[+()\-\d\s]{7,20}$/;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isFinePointer = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Heuristic used to skip WebGL on weak devices. */
export const canRunHeavy3D = () => {
  if (typeof window === 'undefined') return false;
  if (prefersReducedMotion() || !isFinePointer()) return false;
  if (window.innerWidth < 1024) return false;
  if (navigator.connection?.saveData) return false;
  if ((navigator.deviceMemory || 8) < 4) return false;
  if ((navigator.hardwareConcurrency || 8) < 4) return false;
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
};

export const errorMessage = (err, fallback = 'Something went wrong') => err?.message || fallback;
