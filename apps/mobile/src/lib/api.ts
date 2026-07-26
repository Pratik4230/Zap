import axios from "axios";
import { authClient } from "./auth-client";
import { API_URL } from "./env";

/**
 * Axios client for the production API.
 * Attaches Better Auth session cookies from SecureStore on every request.
 *
 * @see https://better-auth.com/docs/integrations/expo#making-authenticated-requests-to-your-server
 */
export const api = axios.create({
  baseURL: API_URL,
  // Manual Cookie header — credentials would fight SecureStore cookies
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const cookies = authClient.getCookie();
  if (cookies) {
    config.headers.set("Cookie", cookies);
  }
  return config;
});
