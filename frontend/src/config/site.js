// Static, non-content configuration only. All project/image/service data comes from the API.

export const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '');
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Projects', to: '/projects' },
  { label: 'Services', to: '/services' },
  { label: 'Collections', to: '/collections' },
  { label: 'Journal', to: '/journal' },
  { label: 'Contact', to: '/contact' },
];

export const PROJECT_TYPES = ['Residential', 'Commercial', 'Hospitality', 'Office', 'Other'];
export const BUDGETS = ['Under ₹10L', '₹10L–₹25L', '₹25L–₹50L', '₹50L–₹1Cr', '₹1Cr+'];
export const ENQUIRY_STATUSES = ['New', 'Contacted', 'In Discussion', 'Converted', 'Closed'];

export const SOCIAL_KEYS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'linkedin', label: 'LinkedIn' },
];

export const DEFAULT_SEO = {
  title: 'MORAQQA — Luxury Interior Architecture & Design Studio',
  description:
    'MORAQQA is a luxury interior architecture and design studio creating refined spaces where architecture, material and emotion come together.',
};
