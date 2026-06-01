import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';

export const api = axios.create({ baseURL: BASE, timeout: 15_000 });

const T = {
  get access()  { return localStorage.getItem('pt_access'); },
  get refresh() { return localStorage.getItem('pt_refresh'); },
  set(a: string, r: string) {
    localStorage.setItem('pt_access', a);
    localStorage.setItem('pt_refresh', r);
  },
  clear() {
    localStorage.removeItem('pt_access');
    localStorage.removeItem('pt_refresh');
  },
};
export { T as tokens };

// Attach token
api.interceptors.request.use(cfg => {
  if (T.access) cfg.headers.Authorization = `Bearer ${T.access}`;
  return cfg;
});

// Auto-refresh on 401
let refreshing = false;
let queue: ((token: string) => void)[] = [];

api.interceptors.response.use(
  r => r,
  async err => {
    const orig = err.config;
    if (
      err.response?.status !== 401 ||
      orig._retry ||
      (orig.url as string)?.includes('/auth/')
    ) {
      return Promise.reject(err);
    }
    orig._retry = true;

    if (refreshing) {
      return new Promise(resolve => {
        queue.push(token => {
          orig.headers.Authorization = `Bearer ${token}`;
          resolve(api(orig));
        });
      });
    }

    refreshing = true;
    try {
      if (!T.refresh) throw new Error('no refresh token');
      const { data } = await axios.post(`${BASE}/auth/refresh`, {
        refreshToken: T.refresh,
      });
      T.set(data.accessToken, data.refreshToken);
      queue.forEach(cb => cb(data.accessToken));
      queue = [];
      orig.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(orig);
    } catch {
      T.clear();
      window.location.href = '/login';
      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  },
);

export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    T.set(data.accessToken, data.refreshToken);
    return data;
  },
  logout: async () => {
    if (T.refresh)
      await api.post('/auth/logout', { refreshToken: T.refresh }).catch(() => {});
    T.clear();
  },
  me: () => api.get('/employees/me').then(r => r.data),
};

export const employeesApi = {
  list:       ()                        => api.get('/employees').then(r => r.data),
  get:        (id: string)              => api.get(`/employees/${id}`).then(r => r.data),
  create:     (dto: object)             => api.post('/employees', dto).then(r => r.data),
  update:     (id: string, dto: object) => api.patch(`/employees/${id}`, dto).then(r => r.data),
  deactivate: (id: string)              => api.delete(`/employees/${id}`),
};

export const entriesApi = {
  punch:  (dto: object) => api.post('/time-entries/punch', dto).then(r => r.data),
  status: ()            => api.get('/time-entries/status').then(r => r.data),
  my:     (from?: string, to?: string) =>
    api.get('/time-entries/my', { params: { from, to } }).then(r => r.data),
  byEmployee: (id: string, from?: string, to?: string) =>
    api.get(`/time-entries/employee/${id}`, { params: { from, to } }).then(r => r.data),
};

export const reportsApi = {
  my:       (year: number, month: number) =>
    api.get(`/reports/my/${year}/${month}`).then(r => r.data),
  employee: (id: string, year: number, month: number) =>
    api.get(`/reports/employee/${id}/${year}/${month}`).then(r => r.data),
  all:      (year: number, month: number) =>
    api.get(`/reports/all/${year}/${month}`).then(r => r.data),
  exportXlsx: (id: string, year: number, month: number) =>
    api.get(`/reports/export/xlsx/${id}/${year}/${month}`, { responseType: 'blob' }),
};

export const adjustmentsApi = {
  create:  (dto: object) => api.post('/adjustments', dto).then(r => r.data),
  byEntry: (id: string)  => api.get(`/adjustments/entry/${id}`).then(r => r.data),
};

export const schedulesApi = {
  create:     (dto: object) => api.post('/schedules', dto).then(r => r.data),
  byEmployee: (id: string)  => api.get(`/schedules/${id}`).then(r => r.data),
};

export const auditApi = {
  list: (params?: object) => api.get('/audit', { params }).then(r => r.data),
};
