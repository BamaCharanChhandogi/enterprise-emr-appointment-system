import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://enterprise-emr-appointment-system-90u6.onrender.com/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach Access Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('emr_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle Refresh Token rotation transparently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('emr_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
            refreshToken
          });

          if (res.data?.success && res.data?.data?.accessToken) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            localStorage.setItem('emr_access_token', accessToken);
            if (newRefreshToken) {
              localStorage.setItem('emr_refresh_token', newRefreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('emr_access_token');
          localStorage.removeItem('emr_refresh_token');
          localStorage.removeItem('emr_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
