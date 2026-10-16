import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import { ErrorBoundary } from './components/States.jsx';
import { PageSkeleton } from './components/Skeletons.jsx';
import ProjectsRoute from './pages/ProjectsRoute.jsx';

// Route-based code splitting: every page is its own chunk.
const Home = lazy(() => import('./pages/Home.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail.jsx'));
const Collections = lazy(() => import('./pages/Collections.jsx'));
const CollectionDetail = lazy(() => import('./pages/CollectionDetail.jsx'));
const Journal = lazy(() => import('./pages/Journal.jsx'));
const Article = lazy(() => import('./pages/Article.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const Legal = lazy(() => import('./pages/Legal.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="projects" element={<ProjectsRoute />} />
            <Route path="projects/:slug" element={<ProjectsRoute />} />
            <Route path="services" element={<Services />} />
            <Route path="services/:slug" element={<ServiceDetail />} />
            <Route path="collections" element={<Collections />} />
            <Route path="collections/:slug" element={<CollectionDetail />} />
            <Route path="journal" element={<Journal />} />
            <Route path="journal/:slug" element={<Article />} />
            <Route path="contact" element={<Contact />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="privacy" element={<Legal kind="privacy" />} />
            <Route path="terms" element={<Legal kind="terms" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
