import axios, { AxiosError } from 'axios';

// Users can toggle backend vs mock mode
const BACKEND_URL = 'http://localhost:8080';

export const getApiMode = (): 'real' | 'mock' => {
  // If we are in the cloud sandbox (usually indicated by non-localhost client origins or specific hostnames),
  // we can default to 'mock' first so it's fully populated, but allow toggling.
  const stored = localStorage.getItem('eventhub_api_mode');
  if (stored === 'real' || stored === 'mock') {
    return stored;
  }
  
  // Default to mock if on cloud deployment so users can experience it immediately
  const isCloud = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  return isCloud ? 'mock' : 'real';
};

export const setApiMode = (mode: 'real' | 'mock') => {
  localStorage.setItem('eventhub_api_mode', mode);
  window.dispatchEvent(new Event('storage')); // trigger update
};

const axiosClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Authorization Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventhub_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Redirect to /login on 401
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('eventhub_access_token');
      localStorage.removeItem('eventhub_current_user');
      // Use standard window redirect to /login to force clean state
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = `/login?message=${encodeURIComponent('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')}`;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
