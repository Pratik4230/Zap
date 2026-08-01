import axios from "axios";
import { authClient } from "@/features/auth/utils/client";
import { getBearerTokenSync } from "@/features/auth/utils/bearer";
import { API_URL } from "@/global/config/env";
import { ApiError } from "@/global/api/errors";

/**
 * Axios instance for the production API.
 * Attaches Bearer token and/or Better Auth cookies from SecureStore.
 */
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getBearerTokenSync();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  const cookies = authClient.getCookie();
  if (cookies) {
    config.headers.set("Cookie", cookies);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const isTimeout =
      error.code === "ECONNABORTED" || error.code === "ERR_CANCELED";

    if (isTimeout) {
      return Promise.reject(
        new ApiError(
          "The server is taking too long to respond. It may be temporarily unavailable.",
          undefined,
          true
        )
      );
    }

    if (!error.response) {
      return Promise.reject(
        new ApiError(
          "Unable to reach the server. Check your connection and try again."
        )
      );
    }

    const status = error.response.status;
    const data = error.response.data as { error?: string } | undefined;
    const fallback =
      status === 503
        ? "Service temporarily unavailable. Please try again shortly."
        : `Request failed (${status})`;

    return Promise.reject(new ApiError(data?.error ?? fallback, status));
  }
);
