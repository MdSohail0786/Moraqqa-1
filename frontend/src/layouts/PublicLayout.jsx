import { Suspense, useEffect } from 'react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Cursor from '../components/Cursor.jsx';
import WhatsAppButton from '../components/WhatsAppButton.jsx';
import SmoothScroll, { useLenis } from '../components/SmoothScroll.jsx';
import { ErrorBoundary } from '../components/States.jsx';
import { PageSkeleton } from '../components/Skeletons.jsx';

function Page() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const lenis = useLenis();

  const resetScroll = () => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  };

  // Honour in-page anchors such as /about#process
  useEffect(() => {
    if (window.location.hash) {
      const el = document.getElementById(window.location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 400);
    }
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" onExitComplete={resetScroll}>
      <motion.div
        key={pathname}
        className="page"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>{outlet}</Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

export default function PublicLayout() {
  return (
    <SmoothScroll>
      <Link to="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </Link>
      <Navbar />
      <main id="main" tabIndex={-1} className="main">
        <Page />
      </main>
      <Footer />
      <WhatsAppButton />
      <Cursor />
    </SmoothScroll>
  );
}
