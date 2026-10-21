import axios, { isAxiosError } from "axios";

import { toAppError } from "@/shared/api/errors";
import { emitSessionExpired } from "@/shared/api/session-events";
import { readSessionToken } from "@/shared/api/session-token";
import { getVisitorId } from "@/shared/api/visitor-id";

const SESSION_HEADER = "Authorization";
const VISITOR_HEADER = "X-Visitor-Id";
const sessionErrorCodes = new Set(["SESSION_EXPIRED", "UNAUTHORIZED"]);

/** The only HTTP client of the app. Transport concerns only — no business rules. */
export const http = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  headers: { Accept: "application/json" },
});

http.interceptors.request.use((config) => {
  const token = readSessionToken();
  if (token) config.headers.set(SESSION_HEADER, `Bearer ${token}`);
  config.headers.set(VISITOR_HEADER, getVisitorId());
  return config;
});

http.interceptors.response.use(undefined, (error: unknown) => {
  const appError = toAppError(error);
  // Only a request that carried a session can "expire", and only a session
  // error counts: a wrong password on login is an ordinary 401 for the caller.
  const hadSession = isAxiosError(error) && error.config?.headers.has(SESSION_HEADER) === true;
  if (hadSession && sessionErrorCodes.has(appError.code)) emitSessionExpired();
  return Promise.reject(appError);
});
