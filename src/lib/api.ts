import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors (token expired)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // FIX: Don't trigger global logout for Login page errors (wrong password)
            const isLoginRequest = error.config && error.config.url && error.config.url.includes('/auth/login');

            if (!isLoginRequest) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Dispatch a custom event so the AuthContext can update its state
                window.dispatchEvent(new Event('auth:unauthorized'));

                // Only redirect if not already on the landing page
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
