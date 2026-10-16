import { useEffect, useState } from 'react';
import { adminProjects, resource } from '../services/endpoints.js';

/** Loads every project (id, title, slug) for select boxes, paging through the API. */
export function useProjectOptions() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let page = 1;
        let all = [];
        for (;;) {
          // eslint-disable-next-line no-await-in-loop
          const res = await adminProjects({ page, limit: 48, sort: 'title' });
          all = [...all, ...res.data.map((p) => ({ _id: p._id, title: p.title, slug: p.slug }))];
          if (!res.hasMore) break;
          page += 1;
        }
        if (alive) setProjects(all);
      } catch { /* selects just stay empty; the page shows its own errors */ }
    })();
    return () => { alive = false; };
  }, []);
  return projects;
}

export function useCollectionOptions() {
  const [list, setList] = useState([]);
  useEffect(() => {
    let alive = true;
    resource('collections').list().then((r) => alive && setList(r.data)).catch(() => {});
    return () => { alive = false; };
  }, []);
  return list;
}
