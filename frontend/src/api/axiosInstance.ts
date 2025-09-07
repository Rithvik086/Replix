import axios from 'axios';

const axiosInstance = axios.create({
    // Backend serves routes at root (e.g. GET /qr, /status). Remove the '/api' suffix
    // so the frontend default matches the backend's routing.
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosInstance;
