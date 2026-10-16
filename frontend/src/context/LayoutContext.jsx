import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const LayoutContext = createContext(null);
export const useLayout = () => useContext(LayoutContext);

/** Shared UI state: does the current page start with a full-bleed hero, and what is the visitor looking at (for WhatsApp). */
export function LayoutProvider({ children }) {
  const [heroNav, setHeroNav] = useState(false);
  const [waTopic, setWaTopic] = useState('');
  const value = useMemo(() => ({ heroNav, setHeroNav, waTopic, setWaTopic }), [heroNav, waTopic]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

/** Pages that open with a hero image call this so the navbar starts transparent. */
export function useHeroNav() {
  const { setHeroNav } = useLayout();
  useEffect(() => {
    setHeroNav(true);
    return () => setHeroNav(false);
  }, [setHeroNav]);
}

/** Tells the WhatsApp button what the visitor is currently viewing. */
export function useWhatsAppTopic(topic) {
  const { setWaTopic } = useLayout();
  useEffect(() => {
    setWaTopic(topic || '');
    return () => setWaTopic('');
  }, [topic, setWaTopic]);
}
