"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import { X, CheckCheck, Trash2, Bell, AlertCircle, Sparkles } from "lucide-react";
import { requestBrowserPushPermission } from "@/lib/engines/notifications";

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    sendSystemNotification,
  } = useLifeOS();

  const [pushStatus, setPushStatus] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission;
    }
    return "unsupported";
  });

  if (!isOpen) return null;

  const handleRequestPush = async () => {
    const res = await requestBrowserPushPermission();
    setPushStatus(res);
    if (res === "granted") {
      await sendSystemNotification(
        "Уведомления активированы",
        "LIFE OS будет деликатно напоминать о ключевых привычках и расписании дня",
        "general"
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md h-full bg-[#121215] border-l border-surface-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm text-zinc-100">Центр уведомлений</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Status Banner */}
        <div className="p-3 bg-surface-subtle border-b border-surface-border text-xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <span
              className={`w-2 h-2 rounded-full ${
                pushStatus === "granted" ? "bg-primary" : "bg-amber-400"
              }`}
            />
            <span>
              Push:{" "}
              {pushStatus === "granted"
                ? "Разрешены"
                : pushStatus === "denied"
                ? "Заблокированы в браузере"
                : "Не настроены"}
            </span>
          </div>
          {pushStatus !== "granted" && (
            <button
              onClick={handleRequestPush}
              className="px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 font-medium"
            >
              Включить
            </button>
          )}
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 border-b border-surface-border text-xs text-zinc-400">
            <span>Всего: {notifications.length}</span>
            <button
              onClick={clearAllNotifications}
              className="flex items-center gap-1 text-zinc-400 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить всё</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-400 text-xs text-center">
              <Sparkles className="w-8 h-8 text-zinc-400 mb-2" />
              <span>Все уведомления прочитаны.</span>
              <span className="text-zinc-400 mt-1">
                Система соблюдает режим спокойствия и не создает лишнего шума.
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => markNotificationAsRead(n.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  n.read
                    ? "bg-surface-subtle/50 border-surface-border text-zinc-400 opacity-70"
                    : "bg-surface-subtle border-surface-border text-zinc-100 hover:border-primary/40 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-xs text-zinc-200">{n.title}</span>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{n.message}</p>
                <div className="mt-2 text-[10px] text-zinc-400 flex items-center justify-between">
                  <span>{new Date(n.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="capitalize">{n.category}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
