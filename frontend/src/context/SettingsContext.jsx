import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { fetchCategories, fetchSettings } from '../services/endpoints.js';

const SettingsContext = createContext(null);
export const useSettings = () => useContext(SettingsContext);

const FALLBACK = {
  siteName: 'MORAQQA',
  tagline: 'Crafting Spaces Beyond Imagination',
  social: {},
  contact: {},
  team: [],
  whatsapp: { number: '', message: 'Hello MORAQQA, I would like to discuss an interior design project.' },
};

/** Loads site-wide settings and categories once; everything else reads from here. */
export function SettingsProvider({ children }) {
  const [state, setState] = useState({ settings: FALLBACK, categories: [], loading: true, error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const [s, c] = await Promise.all([fetchSettings(), fetchCategories()]);
      setState({ settings: { ...FALLBACK, ...s.data }, categories: c.data || [], loading: false, error: null });
    } catch (error) {
      // The site stays usable with fallbacks; pages show their own error states
      setState((prev) => ({ ...prev, loading: false, error }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => {
    const byGroup = (g) => state.categories.filter((c) => c.group === g);
    return { ...state, types: byGroup('type'), styles: byGroup('style'), rooms: byGroup('room'), reload: load };
  }, [state, load]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
