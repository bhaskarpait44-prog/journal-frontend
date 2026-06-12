import { useAuthStore } from '../store/authStore';

const BASE = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL + '/api'
  : '/api';

let navigate;
export const setNavigate = (nav) => { navigate = nav; };

async function request(method, path, data, isForm = false) {
  const token = useAuthStore.getState().token;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isForm) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (data) opts.body = isForm ? data : JSON.stringify(data);

  let res;
  try {
    res = await fetch(BASE + path, opts);
  } catch (err) {
    throw new Error('Cannot reach server. Make sure the backend is running.');
  }

  const json = await res.json().catch(() => ({}));

  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (navigate) navigate('/login');
    else window.location.href = '/login';
    throw new Error(json.message || 'Session expired. Please sign in again.');
  }

  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json;
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, data) => request('POST',   path, data),
  put:    (path, data) => request('PUT',    path, data),
  delete: (path)       => request('DELETE', path),
  upload: (path, form) => request('POST',   path, form, true),
};
