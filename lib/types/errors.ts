// Mirrors the live backend's ErrorResponse shape (code/message/status/timestamp),
// used for handled exceptions (404, 400, auth failures raised by the app itself).
// Raw Spring Security rejections (missing/invalid bearer token) fall back to the
// framework's default {timestamp,status,error,path} body with no `code` — the
// client normalizes both into ApiError so callers only ever branch on `code`.
export type ErrorCode =
  | "ENTITY_NOT_FOUND"
  | "BAD_REQUEST"
  | "VALIDATION_FAILED"
  | "INTERNAL_SERVER_ERROR"
  | "UNAUTHENTICATED" // normalized from the code-less 401/403 Spring Security body

export interface ApiError {
  code: ErrorCode | (string & {})
  message: string
  status: number
  timestamp: string
}

export class ApiClientError extends Error {
  constructor(public readonly error: ApiError) {
    super(error.message)
  }
}
