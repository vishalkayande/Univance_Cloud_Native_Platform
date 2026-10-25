// This configuration automatically detects if you are in production, Docker, or local development
const hostname = window.location.hostname;
const port = window.location.port;
const isDefaultPort = port === '80' || port === '443' || port === '';
const isLocalHostname = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
const isDevelopment = isLocalHostname && !isDefaultPort;

// In local development (npm run dev on port 5173/3000), point to localhost:5003 (safe for local faculty demo)
// If VITE_API_URL is explicitly set during build, use it
// In Docker Compose or AWS EKS (served on standard port 80/443), Nginx proxies /api via same origin
// Fallback to Render only when accessed elsewhere without proxy
export const API_URL = isDevelopment
  ? 'http://localhost:5003'
  : (import.meta.env.VITE_API_URL || (isDefaultPort ? window.location.origin : 'https://univance-5eyc.onrender.com'));

console.log('API_URL Mode:', isDevelopment ? 'Development (localhost:5003)' : (isDefaultPort ? `Proxy on ${window.location.origin}` : 'Production (Render URL)'));
console.log('Current Origin:', window.location.origin);
console.log('window.location.port:', `'${port}'`);
console.log('window.location.hostname:', hostname);
console.log('isDefaultPort:', isDefaultPort);
console.log('isLocalHostname:', isLocalHostname);
console.log('isDevelopment:', isDevelopment);