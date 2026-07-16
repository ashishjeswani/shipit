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

let app: FirebaseApp | null = null
let messaging: Messaging | null = null

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

    const currentToken = await getToken(msg, { vapidKey: FIREBASE_VAPID_KEY })
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
