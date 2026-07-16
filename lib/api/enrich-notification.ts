import type { Notification } from "@/lib/types/api"

/** Live BE NotificationReadDto — payload is a string; no title/message fields. */
export interface NotificationDto {
  id: number
  type: string
  read: boolean
  payload?: string | Record<string, unknown> | null
  eventId?: number | null
  createdAt: string
  title?: string
  message?: string
}

function humanizeType(type: string): string {
  return type
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function payloadToMessage(
  payload: NotificationDto["payload"],
): { message: string; parsed: Record<string, unknown> | string } {
  if (payload == null || payload === "") {
    return { message: "", parsed: {} }
  }
  if (typeof payload === "object") {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : typeof payload.body === "string"
          ? payload.body
          : JSON.stringify(payload)
    return { message, parsed: payload }
  }
  try {
    const parsed = JSON.parse(payload) as unknown
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>
      const message =
        typeof obj.message === "string"
          ? obj.message
          : typeof obj.body === "string"
            ? obj.body
            : payload
      return { message, parsed: obj }
    }
  } catch {
    // plain string payload
  }
  return { message: payload, parsed: payload }
}

export function enrichNotification(dto: NotificationDto): Notification {
  const { message: fromPayload, parsed } = payloadToMessage(dto.payload)
  const title = dto.title?.trim() || humanizeType(dto.type || "Notification")
  const message = dto.message?.trim() || fromPayload || title
  return {
    id: dto.id,
    type: dto.type,
    title,
    message,
    read: !!dto.read,
    payload: typeof parsed === "object" ? parsed : { raw: parsed },
    createdAt: dto.createdAt,
    eventId: dto.eventId ?? undefined,
  }
}
