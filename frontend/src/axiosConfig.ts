import axios from "axios";
import { LOCAL_STORAGE__TOKEN } from "./services/auth.services";

// Prefer environment-provided backend URL; fall back to relative base in production
// so that Nginx can proxy /api to the backend. Avoid hardcoding localhost in builds.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL || "/",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem(LOCAL_STORAGE__TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
