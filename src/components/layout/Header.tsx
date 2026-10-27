"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Bell,
  Flame,
  CheckCircle2,
  Timer,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenCheckIn: () => void;
}

export function Header({ onOpenNotifications, onOpenCheckIn }: HeaderProps) {
  const {
    todayDate,
    unreadNotifCount,
    todayCheckin,
    focusTimer,
    setActiveTab,
    recalculateCurrentDay,
    getAnalytics,
  } = useLifeOS();

  const [isRecalculating, setIsRecalculating] = useState(false);

  // Format date in Russian: "Среда, 28 октября"
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(todayDate + "T12:00:00");
      const weekday = d.toLocaleDateString("ru-RU", { weekday: "long" });
      const dayMonth = d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
      return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${dayMonth}`;
    } catch {
      return todayDate;
    }
  }, [todayDate]);

  const analytics = getAnalytics(7);
  const streakDays = analytics.currentStreakDays;

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await recalculateCurrentDay();
    } finally {
      setTimeout(() => setIsRecalculating(false), 500);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-[#09090b]/80 backdrop-blur-md border-b border-surface-border">
      {/* Date & Greeting */}
      <div>
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <span>{formattedDate}</span>
          <span className="hidden md:inline-block text-xs font-normal px-2 py-0.5 rounded-full bg-surface-subtle text-zinc-400 border border-surface-border">
            LIFE OS
          </span>
        </h1>
        <p className="text-xs text-zinc-400">
          Сфокусируйтесь на главном. Дисциплина без выгорания.
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Streak Badge */}
        <div
          title={`Текущая серия активности: ${streakDays} дн.`}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-subtle border border-surface-border text-xs font-medium text-amber-400"
        >
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{streakDays} дн.</span>
        </div>

        {/* Focus Timer Status Pill (if running) */}
        {focusTimer.isRunning && (
          <button
            onClick={() => setActiveTab("education")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-muted border border-primary-border text-xs font-medium text-primary animate-pulse"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Фокус: </span>
            <span>
              {Math.floor((focusTimer.targetSeconds - focusTimer.accumulatedSeconds) / 60)}:
              {String((focusTimer.targetSeconds - focusTimer.accumulatedSeconds) % 60).padStart(2, "0")}
            </span>
          </button>
        )}

        {/* Daily Check-In Button */}
        {!todayCheckin ? (
          <button
            onClick={onOpenCheckIn}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface-subtle hover:bg-surface-border text-xs font-medium text-lime-400 border border-lime-500/30 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-lime-400" />
            <span className="hidden sm:inline">Чек-ин</span>
          </button>
        ) : (
          <div
            title="Дневной чек-ин пройден"
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-500"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
            <span>Чек-ин ✓</span>
          </div>
        )}

        {/* Recalculate Day Button */}
        <button
          onClick={handleRecalculate}
          disabled={isRecalculating}
          title="Пересчитать оставшееся расписание дня"
          className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg bg-surface-subtle hover:bg-surface-border text-xs font-medium text-zinc-300 border border-surface-border transition-colors flex items-center gap-1.5"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 text-zinc-400 ${isRecalculating ? "animate-spin" : ""}`}
          />
          <span className="hidden md:inline">Пересчет</span>
        </button>

        {/* Notifications Center Toggle */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-surface-subtle hover:bg-surface-border border border-surface-border text-zinc-300 transition-colors"
          aria-label="Уведомления"
        >
          <Bell className="w-4 h-4 text-zinc-300" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-black font-bold text-[10px] flex items-center justify-center">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
