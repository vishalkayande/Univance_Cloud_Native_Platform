// This configuration automatically detects if you are in production or development
const isDefaultPort = window.location.port === '80' || window.location.port === '443' || window.location.port === '';
const isDevelopment = window.location.hostname === 'localhost' && !isDefaultPort;

// In production (Docker/EC2), we use relative paths ('')
// In local development (npm run dev), we point to the backend port 5003
export const API_URL = isDevelopment ? 'http://localhost:5003' : '';

console.log('API_URL Mode:', isDevelopment ? 'Development (localhost:5003)' : 'Production (Relative)');
console.log('Current Origin:', window.location.origin);
console.log('window.location.port:', `'${window.location.port}'`);
console.log('isDefaultPort:', isDefaultPort);
console.log('isDevelopment:', isDevelopment);

