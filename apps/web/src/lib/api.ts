import axios from 'axios';

const api = axios.create({
  // Empty baseURL = relative to current origin → goes through Vite proxy in dev.
  // In production, deploy frontend and backend on the same domain/nginx proxy.
  baseURL: '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

export default api;
