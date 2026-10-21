import axios, { isAxiosError } from "axios";

import { toAppError } from "@/shared/api/errors";
import { emitSessionExpired } from "@/shared/api/session-events";
import { readSessionToken } from "@/shared/api/session-token";

const SESSION_HEADER = "Authorization";

/** The only HTTP client of the app. Transport concerns only — no business rules. */
export const http = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  const token = readSessionToken();
  if (token) config.headers.set(SESSION_HEADER, `Bearer ${token}`);
  return config;
});

http.interceptors.response.use(undefined, (error: unknown) => {
  const appError = toAppError(error);
  // Only a request that carried a session can "expire"; anonymous 401s (e.g. a
  // failed login) are ordinary errors for the caller to handle.
  const hadSession = isAxiosError(error) && error.config?.headers.has(SESSION_HEADER) === true;
  if (appError.status === 401 && hadSession) emitSessionExpired();
  return Promise.reject(appError);
});
