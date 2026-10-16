import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './AdminLayout.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './components/ui.jsx';
import { ErrorBoundary } from '../components/States.jsx';
import Seo from '../components/Seo.jsx';

const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Projects = lazy(() => import('./pages/Projects.jsx'));
const ProjectForm = lazy(() => import('./pages/ProjectForm.jsx'));
const Images = lazy(() => import('./pages/Images.jsx'));
const Categories = lazy(() => import('./pages/Categories.jsx'));
const Collections = lazy(() => import('./pages/Collections.jsx'));
const Services = lazy(() => import('./pages/Services.jsx'));
const Enquiries = lazy(() => import('./pages/Enquiries.jsx'));
const Journal = lazy(() => import('./pages/Journal.jsx'));
const SettingsPage = lazy(() => import('./pages/Settings.jsx'));

/** Rejects unauthenticated visitors; everything under /admin except /admin/login requires a valid session. */
function Protected({ children }) {
  const { isAuthenticated, checking } = useAuth();
  if (checking) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}><Spinner /></div>;
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

export default function AdminApp() {
  const { isAuthenticated, checking } = useAuth();
  return (
    <ErrorBoundary>
      <Seo title="Admin" noindex />
      <Routes>
        <Route path="login" element={!checking && isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <Login />} />
        <Route element={<Protected><AdminLayout /></Protected>}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Suspense fallback={<Spinner />}><Dashboard /></Suspense>} />
          <Route path="projects" element={<Suspense fallback={<Spinner />}><Projects /></Suspense>} />
          <Route path="projects/new" element={<Suspense fallback={<Spinner />}><ProjectForm /></Suspense>} />
          <Route path="projects/:id/edit" element={<Suspense fallback={<Spinner />}><ProjectForm /></Suspense>} />
          <Route path="images" element={<Suspense fallback={<Spinner />}><Images /></Suspense>} />
          <Route path="categories" element={<Suspense fallback={<Spinner />}><Categories /></Suspense>} />
          <Route path="collections" element={<Suspense fallback={<Spinner />}><Collections /></Suspense>} />
          <Route path="services" element={<Suspense fallback={<Spinner />}><Services /></Suspense>} />
          <Route path="enquiries" element={<Suspense fallback={<Spinner />}><Enquiries /></Suspense>} />
          <Route path="journal" element={<Suspense fallback={<Spinner />}><Journal /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<Spinner />}><SettingsPage /></Suspense>} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
