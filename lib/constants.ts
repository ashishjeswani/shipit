export const ROLES = ["DEVELOPER", "APPROVER"] as const
export type Role = (typeof ROLES)[number]

export const RELEASE_STATUSES = ["OPEN", "READY_FOR_DEPLOYMENT", "CLOSED"] as const
export type ReleaseStatus = (typeof RELEASE_STATUSES)[number]

// Live BE/swagger uses PENDING_APPROVAL; older payloads used PENDING_REVIEW.
// Both are reviewable — normalize to PENDING_REVIEW in enrich-request so the
// rest of the UI speaks one vocabulary.
export const REQUEST_STATUSES = [
  "DRAFT",
  "PENDING_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

/** Raw BE statuses that mean "awaiting an approver decision". */
export const REVIEWABLE_RAW_STATUSES = ["PENDING_REVIEW", "PENDING_APPROVAL"] as const

export const FIELD_LIMITS = {
  messageText: { min: 1, max: 2000 },
  releaseName: { min: 1, max: 100 },
  requestTitle: { min: 1, max: 150 },
  requestDescription: { min: 1, max: 5000 },
} as const

// Live BE + Storage upload validation (BE §0 / swagger Storage).
export const SCRIPT_EXTENSIONS = ["py", "js", "sh"] as const
export type ScriptExtension = (typeof SCRIPT_EXTENSIONS)[number]
export const MAX_SCRIPT_FILE_BYTES = 5 * 1024 * 1024

export const SCRIPT_LANGUAGE_BY_EXT: Record<
  ScriptExtension,
  "python" | "javascript" | "shell"
> = {
  py: "python",
  js: "javascript",
  sh: "shell",
}

// The live backend requires a bearer token but has no usable login flow for
// this pass (docs/frontend/07-auth-and-permissions.md's login UI is out of
// scope here) — see lib/auth/token.ts for the silent bootstrap this backs.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://hackathon-backend-948a.onrender.com"

// Live notification/presence transport (explicit FE guide, 2026-07-16):
// Pusher presence + FCM push sit alongside the BE §7 REST notification APIs.
// Override via NEXT_PUBLIC_* in deploy; defaults are the shared public client keys.
export const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY ?? "3f5f6accdb30847d9e95"
export const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER ?? "ap2"

export const FIREBASE_VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ??
  "BDRJPILKGuK8DQroUqgtQcW2FOz5KF2EIs66-nAeEOYeRqgZP5h1HgCexqGTdXdFGmRxDtBSVglhTgSd8UiiVJM"

export const FIREBASE_WEB_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "AIzaSyBvYx54QkWTXVepwlhgha9K0eK5q4Oq83Y",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "e-commerce-a1343.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "e-commerce-a1343",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "e-commerce-a1343.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "232609413862",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:232609413862:web:5c62bcc2f37a46bbb4d927",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "G-V0ZLV8W6SS",
} as const

export const FCM_TOKEN_STORAGE_KEY = "shipit_fcm_token"
