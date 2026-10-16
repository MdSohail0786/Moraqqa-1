import axios from 'axios';
import { API_URL } from '../config/site.js';

export const TOKEN_KEY = 'moraqqa_admin_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable (private mode) */
  }
};

const client = axios.create({ baseURL: API_URL, timeout: 30000, withCredentials: false });

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Turns every failure into an Error with a human readable message plus optional field errors. */
client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);
    const res = error.response;
    let message;
    if (!res) {
      message =
        error.code === 'ECONNABORTED'
          ? 'The request took too long. Please try again.'
          : 'Network error. Please check your connection and try again.';
    } else {
      message = res.data?.message || `Request failed (${res.status})`;
    }
    const err = new Error(message);
    err.status = res?.status;
    err.details = res?.data?.details;
    err.data = res?.data;
    if (res?.status === 401 && getToken()) window.dispatchEvent(new Event('moraqqa:unauthorized'));
    return Promise.reject(err);
  }
);

/* ---- tiny in-memory cache for public GET requests (60s) ---- */
const cache = new Map();
const TTL = 60 * 1000;

export async function get(url, params, { ttl = TTL, signal, fresh = false } = {}) {
  const key = url + JSON.stringify(params || {});
  const hit = cache.get(key);
  if (!fresh && hit && Date.now() - hit.time < ttl) return hit.data;
  const { data } = await client.get(url, { params, signal });
  if (ttl > 0) cache.set(key, { time: Date.now(), data });
  return data;
}

export const clearCache = () => cache.clear();

/** Mutations clear the cache so public pages never show stale content after an admin edit. */
const mutate = async (method, url, body, config) => {
  const { data } = await client.request({ method, url, data: body, ...config });
  clearCache();
  return data;
};

export const post = (url, body, config) => mutate('post', url, body, config);
export const put = (url, body, config) => mutate('put', url, body, config);
export const del = (url, config) => mutate('delete', url, undefined, config);
export const getFresh = (url, params, signal) => get(url, params, { ttl: 0, signal });

export default client;
