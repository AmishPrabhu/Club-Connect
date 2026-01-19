import axios from 'axios';

console.log('%c🚀 CLUB CONNECT API LOADING 🚀', 'background: #002147; color: #DAA520; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('Build Environment:', import.meta.env.MODE);
console.log('VITE_API_URL Value:', import.meta.env.VITE_API_URL);
const envApiUrl = import.meta.env.VITE_API_URL;
console.log('--- API CONFIG DEBUG ---');
console.log('Raw VITE_API_URL from env:', envApiUrl);

const api = axios.create({
    baseURL: envApiUrl || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

if (!envApiUrl) {
    console.warn('⚠️ VITE_API_URL is NOT defined. Falling back to localhost.');
    console.log('Current baseURL:', api.defaults.baseURL);
} else {
    console.log('✅ Connected to API at:', envApiUrl);
}
console.log('------------------------');

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
        return Promise.reject(error);
    }
);

export default api;
