import axios from "axios";
import { endpoints } from "./endpoints";
import { ROUTES, STORAGE_KEY } from "./constants";

const api = axios.create({ baseURL: "/", withCredentials: true });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem(STORAGE_KEY.ACCESS_TOKEN);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Shared promise so multiple parallel 401s coalesce into one refresh call.
let refreshing = null;

async function refreshAccessToken() {
  if (!refreshing) {
    refreshing = api
      .post(endpoints.auth.refresh)
      .then((res) => {
        const token = res?.data?.accessToken;
        if (token && typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY.ACCESS_TOKEN, token);
        }
        return token;
      })
      .finally(() => {
        // Clear the cache *after* the success branch has read the token so
        // future 401s start a fresh refresh.
        setTimeout(() => {
          refreshing = null;
        }, 0);
      });
  }
  return refreshing;
}

function forceSignOut() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY.ACCESS_TOKEN);
  // Avoid a redirect loop if the user is already on the auth screens.
  if (
    !window.location.pathname.startsWith(ROUTES.LOGIN) &&
    !window.location.pathname.startsWith(ROUTES.REGISTER)
  ) {
    window.location.href = ROUTES.LOGIN;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err.response?.status;
    const url = err.config?.url ?? "";

    // Never try to refresh the refresh call itself — that's the hard failure
    // case that should redirect to /login.
    if (status === 401 && url.includes(endpoints.auth.refresh)) {
      forceSignOut();
      return Promise.reject(err);
    }

    if (status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        const fresh = await refreshAccessToken();
        if (fresh) {
          err.config.headers = err.config.headers ?? {};
          err.config.headers.Authorization = `Bearer ${fresh}`;
        }
        return api(err.config);
      } catch {
        forceSignOut();
        return Promise.reject(err);
      }
    }
    return Promise.reject(err);
  },
);

export default api;
