import axios, { AxiosError } from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const axiosClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventhub_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.status === 403
      ? (error.response?.data?.message || 'Bạn không có quyền thực hiện thao tác này.')
      : (error.response?.data?.message || error.message || 'Request failed');

    if (error.response?.status === 401) {
      localStorage.removeItem('eventhub_access_token');
      localStorage.removeItem('eventhub_current_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?message=${encodeURIComponent('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')}`;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
