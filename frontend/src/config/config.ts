// Environment configuration
// For production, change isDev to false and update the production URL
const isDev = true;

const config = {
    API_BASE_URL: isDev
        ? 'http://localhost:5000/api'
        : 'https://your-production-domain.com/api'
};

export default config;
