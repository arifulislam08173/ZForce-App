import axios from 'axios';
import { getItem, removeItem, TOKEN_KEY, USER_KEY } from '../storage/token';
import { API_URL } from '../config/env';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async config => {
  const token = await getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let onUnauthorized: null | (() => void) = null;
let alreadyHandling401 = false;

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  res => res,
  async err => {
    const status = err?.response?.status;
    if (status === 401 && !alreadyHandling401) {
      alreadyHandling401 = true;
      try {
        await removeItem(TOKEN_KEY);
        await removeItem(USER_KEY);
        onUnauthorized?.();
      } finally {
        setTimeout(() => {
          alreadyHandling401 = false;
        }, 300);
      }
    }
    return Promise.reject(err);
  }
);

export default api;