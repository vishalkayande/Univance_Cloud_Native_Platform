// This configuration automatically detects if you are in production or development
const hostname = window.location.hostname;
const port = window.location.port;
const isDefaultPort = port === '80' || port === '443' || port === '';
const isLocalHostname = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
const isDevelopment = isLocalHostname && !isDefaultPort;

// In production (Vercel / hosted domains), we use the Render backend URL
// In local development (npm run dev on any local IP), we point to localhost:5003
// Also: if page is loaded on port 80 (Docker local), proxy /api via same origin
export const API_URL = isDevelopment
  ? 'http://localhost:5003'
  : (isLocalHostname && isDefaultPort)
    ? window.location.origin   // Docker Compose on http://localhost → nginx proxies /api
    : 'https://univance-5eyc.onrender.com';  // True production

console.log('API_URL Mode:', isDevelopment ? 'Development (localhost:5003)' : ((isLocalHostname && isDefaultPort) ? 'Docker (same-origin /api proxy)' : 'Production (Render URL)'));
console.log('Current Origin:', window.location.origin);
console.log('window.location.port:', `'${port}'`);
console.log('window.location.hostname:', hostname);
console.log('isDefaultPort:', isDefaultPort);
console.log('isLocalHostname:', isLocalHostname);
console.log('isDevelopment:', isDevelopment);