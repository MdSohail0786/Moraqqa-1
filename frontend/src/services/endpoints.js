import { get, getFresh, post, put, del } from './api.js';

/* ------------------------------- public ------------------------------- */
export const fetchSettings = () => get('/settings', undefined, { ttl: 5 * 60 * 1000 });
export const fetchCategories = () => get('/categories', undefined, { ttl: 5 * 60 * 1000 });

export const fetchProjects = (params, signal) => get('/projects', params, { signal });
export const fetchProjectFilters = () => get('/projects/filters', undefined, { ttl: 5 * 60 * 1000 });
export const fetchProject = (slug, signal) => get(`/projects/${slug}`, undefined, { signal });
export const fetchRelatedProjects = (slug) => get(`/projects/${slug}/related`);

export const fetchImages = (params, signal) => get('/images', params, { signal });

export const fetchServices = (params) => get('/services', params);
export const fetchService = (slug) => get(`/services/${slug}`);
export const fetchServiceProjects = (slug) => get(`/services/${slug}/projects`);

export const fetchCollections = () => get('/collections');
export const fetchCollection = (slug) => get(`/collections/${slug}`);

export const fetchArticles = (params) => get('/journal', params);
export const fetchArticle = (slug) => get(`/journal/${slug}`);

export const searchSite = (q, signal) => get('/search', { q }, { signal, ttl: 30 * 1000 });

export const submitEnquiry = (payload) => post('/enquiries', payload);
export const subscribeNewsletter = (email) => post('/newsletter', { email });

/* -------------------------------- admin -------------------------------- */
export const adminLogin = (email, password) => post('/auth/login', { email, password });
export const adminMe = () => getFresh('/auth/me');
export const adminLogout = () => post('/auth/logout');
export const changePassword = (payload) => put('/auth/password', payload);

export const adminStats = () => getFresh('/stats');

export const adminProjects = (params) => getFresh('/projects', { all: true, ...params });
export const adminProjectById = (id) => getFresh(`/projects/id/${id}`);
export const createProject = (data) => post('/projects', data);
export const updateProject = (id, data) => put(`/projects/${id}`, data);
export const deleteProject = (id, deleteImages = false) => del(`/projects/${id}`, { params: { deleteImages } });

export const adminImages = (params) => getFresh('/images', params);
export const updateImage = (id, data) => put(`/images/${id}`, data);
export const bulkUpdateImages = (ids, update) => put('/images/bulk', { ids, update });
export const reorderImages = (items) => put('/images/reorder', { items });
export const deleteImage = (id) => del(`/images/${id}`);
export const bulkDeleteImages = (ids) => post('/images/bulk-delete', { ids });

export const uploadImageBatch = (formData, onProgress) =>
  post('/images/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
    timeout: 5 * 60 * 1000,
    // 422 means "every file failed": still return the per-file report
    validateStatus: (s) => s < 500,
  });

export const uploadMedia = (file, folder = 'site', onProgress) => {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('folder', folder);
  return post('/media/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress,
    timeout: 2 * 60 * 1000,
  });
};

/** Generic CRUD helpers for categories / collections / services / journal. */
export const resource = (path) => ({
  list: (params) => getFresh(`/${path}`, params),
  create: (data) => post(`/${path}`, data),
  update: (id, data) => put(`/${path}/${id}`, data),
  remove: (id) => del(`/${path}/${id}`),
  reorder: (items) => put(`/${path}/reorder`, { items }),
});

export const adminArticleById = (id) => getFresh(`/journal/id/${id}`);

export const adminEnquiries = (params) => getFresh('/enquiries', params);
export const updateEnquiry = (id, data) => put(`/enquiries/${id}`, data);
export const deleteEnquiry = (id) => del(`/enquiries/${id}`);
export const adminSubscribers = (params) => getFresh('/newsletter', params);

export const updateSettings = (data) => put('/settings', data);
