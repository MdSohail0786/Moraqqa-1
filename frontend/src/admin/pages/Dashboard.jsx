import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { adminStats } from '../../services/endpoints.js';
import { PageHead, ErrorBanner, Spinner, Empty } from '../components/ui.jsx';
import { formatDateTime } from '../../utils/helpers.js';

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => adminStats(), []);
  const s = data?.data;
  const cards = s && [
    ['Total projects', s.projects, `${s.publishedProjects} published`, '/admin/projects'],
    ['Total images', s.images, 'in the library', '/admin/images'],
    ['Total enquiries', s.enquiries, 'all time', '/admin/enquiries'],
    ['Unread enquiries', s.unread, 'need attention', '/admin/enquiries', s.unread > 0],
    ['Categories', s.categories, 'types, styles, rooms', '/admin/categories'],
    ['Featured projects', s.featuredProjects, 'on the homepage', '/admin/projects'],
  ];

  return (
    <>
      <PageHead title="Dashboard" subtitle="An overview of the studio website." />
      <ErrorBanner error={error} onRetry={reload} />
      {loading && <Spinner />}
      {cards && (
        <div className="agrid agrid--3">
          {cards.map(([label, n, sub, to, alert]) => (
            <Link key={label} to={to} className={`stat ${alert ? 'stat--alert' : ''}`}>
              <div className="stat__n">{n}</div>
              <div className="stat__l">{label}</div>
              <small style={{ color: 'var(--c-stone-dark)' }}>{sub}</small>
            </Link>
          ))}
        </div>
      )}
      {s && (
        <div className="acard" style={{ marginTop: 24 }}>
          <h2>Recent enquiries</h2>
          {s.recentEnquiries.length === 0 ? <Empty>No enquiries yet.</Empty> : (
            <div className="atable-wrap" style={{ border: 0 }}>
              <table className="atable">
                <thead><tr><th>Name</th><th>Project</th><th>Budget</th><th>Received</th><th>Status</th></tr></thead>
                <tbody>
                  {s.recentEnquiries.map((e) => (
                    <tr key={e._id}>
                      <td><strong>{e.name}</strong><br /><small>{e.email}</small></td>
                      <td>{e.projectType}</td><td>{e.budget}</td><td>{formatDateTime(e.createdAt)}</td>
                      <td><span className={`tag ${e.status === 'New' ? 'tag--new' : ''}`}>{e.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
