// LIFE OS — Smart Notification Engine
import type { NotificationItem, NotificationSettings, HabitCategory } from "@/types";

export interface CreateNotificationParams {
  title: string;
  message: string;
  category: HabitCategory | "general";
  scheduledTime?: string;
  actionUrl?: string;
}

export function isWithinQuietHours(
  timeStr: string, // "HH:MM"
  quietStartStr: string, // "22:30"
  quietEndStr: string // "07:00"
): boolean {
  const [h, m] = timeStr.split(":").map(Number);
  const current = h * 60 + m;

  const [sH, sM] = quietStartStr.split(":").map(Number);
  const start = sH * 60 + sM;

  const [eH, eM] = quietEndStr.split(":").map(Number);
  const end = eH * 60 + eM;

  if (start > end) {
    // Overnight quiet hours, e.g. 22:30 to 07:00
    return current >= start || current <= end;
  }
  return current >= start && current <= end;
}

export function shouldDeliverNotification(
  category: HabitCategory | "general",
  settings: NotificationSettings,
  currentTimeStr: string
): boolean {
  if (!settings.inAppEnabled && !settings.browserPushEnabled) {
    return false;
  }

  // Check quiet hours
  if (isWithinQuietHours(currentTimeStr, settings.quietHoursStart, settings.quietHoursEnd)) {
    return false;
  }

  // Check category settings if applicable
  if (category !== "general" && settings.categories) {
    if (settings.categories[category] === false) {
      return false;
    }
  }

  return true;
}

export function createNotification(params: CreateNotificationParams): NotificationItem {
  return {
    id: "notif_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: params.title,
    message: params.message,
    category: params.category,
    scheduledTime: params.scheduledTime || new Date().toISOString(),
    delivered: false,
    read: false,
    actionUrl: params.actionUrl,
    createdAt: new Date().toISOString(),
  };
}

// Request Browser Web Notification Permission
export async function requestBrowserPushPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

// Trigger a browser notification if permitted and supported
export function triggerBrowserNotification(title: string, options?: NotificationOptions): void {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    try {
      new Notification(title, {
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        ...options,
      });
    } catch {
      // Ignore if push was blocked or failed
    }
  }
}
