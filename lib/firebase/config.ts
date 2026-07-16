"use client"

import { type FirebaseApp, getApps, initializeApp } from "firebase/app"
import {
  type Messaging,
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging"

import { notificationsApi } from "@/lib/api/notifications"
import {
  FCM_TOKEN_STORAGE_KEY,
  FIREBASE_VAPID_KEY,
  FIREBASE_WEB_CONFIG,
} from "@/lib/constants"

const FCM_SW_PATH = "/firebase-messaging-sw.js"
const FCM_SW_SCOPE = "/firebase-cloud-messaging-push-scope"

let app: FirebaseApp | null = null
let messaging: Messaging | null = null
let swRegistrationPromise: Promise<ServiceWorkerRegistration> | null = null

function getFirebaseApp(): FirebaseApp {
  if (app) return app
  app = getApps().length > 0 ? getApps()[0]! : initializeApp(FIREBASE_WEB_CONFIG)
  return app
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null
  if (!(await isSupported())) return null
  if (messaging) return messaging
  messaging = getMessaging(getFirebaseApp())
  return messaging
}

export function getStoredFcmToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(FCM_TOKEN_STORAGE_KEY)
}

function storeFcmToken(token: string) {
  sessionStorage.setItem(FCM_TOKEN_STORAGE_KEY, token)
}

export function clearStoredFcmToken() {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(FCM_TOKEN_STORAGE_KEY)
}

/** Registers (or reuses) the FCM service worker and waits until it is active. */
async function getMessagingServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.")
  }

  if (!swRegistrationPromise) {
    swRegistrationPromise = (async () => {
      const registration = await navigator.serviceWorker.register(FCM_SW_PATH, {
        scope: FCM_SW_SCOPE,
      })
      // Force check for updates so a sticky old SW (e.g. one that previously
      // fetched the /login HTML redirect) gets replaced.
      await registration.update().catch(() => undefined)

      if (registration.active?.scriptURL.endsWith(FCM_SW_PATH)) {
        return registration
      }

      const incoming = registration.installing ?? registration.waiting
      if (incoming) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error("Service worker not activated after 10000 ms")),
            10_000,
          )
          incoming.addEventListener("statechange", () => {
            if (incoming.state === "activated") {
              clearTimeout(timeout)
              resolve()
            } else if (incoming.state === "redundant") {
              clearTimeout(timeout)
              reject(new Error("Service worker became redundant during install."))
            }
          })
        })
      }

      return registration
    })().catch((error) => {
      swRegistrationPromise = null
      throw error
    })
  }

  return swRegistrationPromise
}

/**
 * Requests notification permission, retrieves the FCM device token, and
 * registers it with the backend so offline/background pushes can reach this browser.
 */
export async function registerFcmDeviceToken(): Promise<string | null> {
  const msg = await getFirebaseMessaging()
  if (!msg) return null

  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    const serviceWorkerRegistration = await getMessagingServiceWorker()
    const currentToken = await getToken(msg, {
      vapidKey: FIREBASE_VAPID_KEY,
      serviceWorkerRegistration,
    })
    if (!currentToken) return null

    await notificationsApi.registerDeviceToken(currentToken)
    storeFcmToken(currentToken)
    return currentToken
  } catch (error) {
    console.error("Error retrieving or registering FCM token:", error)
    return null
  }
}

/** Unregisters the stored FCM token on logout so pushes stop for this browser. */
export async function unregisterFcmDeviceToken(): Promise<void> {
  const token = getStoredFcmToken()
  if (!token) return
  try {
    await notificationsApi.deleteDeviceToken(token)
  } catch (error) {
    console.error("Error unregistering FCM token:", error)
  } finally {
    clearStoredFcmToken()
  }
}

export { onMessage }
