"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Moon,
  Clock,
  Star,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
} from "lucide-react";
import type { SleepLog } from "@/types";

export function RecoveryView() {
  const {
    sleepLogs,
    todayDate,
    logSleep,
    userProfile,
    updateUserProfile,
  } = useLifeOS();

  const todaySleepLog = sleepLogs.find((s) => s.date === todayDate);

  const [targetBedtime, setTargetBedtime] = useState(
    userProfile.sleepSettings.targetBedtime || "22:45"
  );
  const [targetWakeTime, setTargetWakeTime] = useState(
    userProfile.sleepSettings.targetWakeTime || "07:00"
  );

  // Form state
  const [bedTime, setBedTime] = useState(todaySleepLog?.bedTime || "23:00");
  const [wakeTime, setWakeTime] = useState(todaySleepLog?.wakeTime || "07:00");
  const [qualityRating, setQualityRating] = useState<1 | 2 | 3 | 4 | 5>(
    todaySleepLog?.qualityRating || 4
  );
  const [wakeFeeling, setWakeFeeling] = useState<"refreshed" | "normal" | "tired" | "exhausted">(
    todaySleepLog?.wakeFeeling || "refreshed"
  );
  const [sleepNotes, setSleepNotes] = useState(todaySleepLog?.notes || "");
  const [isSaved, setIsSaved] = useState(false);

  // Compute total sleep duration in minutes
  const computeSleepMinutes = (bed: string, wake: string) => {
    const [bH, bM] = bed.split(":").map(Number);
    const [wH, wM] = wake.split(":").map(Number);
    let bedMins = bH * 60 + bM;
    let wakeMins = wH * 60 + wM;
    if (wakeMins <= bedMins) {
      // Overnight sleep, past midnight
      wakeMins += 24 * 60;
    }
    return Math.max(0, wakeMins - bedMins);
  };

  const currentSleepMinutes = computeSleepMinutes(bedTime, wakeTime);
  const currentSleepHours = Math.floor(currentSleepMinutes / 60);
  const currentSleepRestMins = currentSleepMinutes % 60;

  const handleSaveSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    await logSleep({
      bedTime,
      wakeTime,
      totalSleepMinutes: currentSleepMinutes,
      qualityRating,
      wakeFeeling,
      notes: sleepNotes.trim() || undefined,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleUpdateSettings = async () => {
    await updateUserProfile({
      sleepSettings: {
        ...userProfile.sleepSettings,
        targetBedtime,
        targetWakeTime,
      },
    });
  };

  const feelingOptions: { id: SleepLog["wakeFeeling"]; label: string; icon: string }[] = [
    { id: "refreshed", label: "Бодрый", icon: "⚡" },
    { id: "normal", label: "Нормальное", icon: "👌" },
    { id: "tired", label: "Уставший", icon: "🥱" },
    { id: "exhausted", label: "Разбитый", icon: "💤" },
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-surface-border">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Moon className="w-5 h-5 text-purple-400" />
          <span>Сон и восстановление (Recovery)</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Сон — фундамент дисциплины и концентрации. Приложение не ставит медицинских диагнозов.
        </p>
      </div>

      {/* Target Schedule Card */}
      <div className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Целевой режим сна</h2>
            <span className="text-[11px] text-zinc-500">
              Оптимальное время отхода ко сну и подъема для вашего распорядка
            </span>
          </div>

          <button
            onClick={handleUpdateSettings}
            className="px-3 py-1.5 rounded-lg bg-surface-border hover:bg-surface-border/80 text-xs text-zinc-200 self-start sm:self-auto"
          >
            Сохранить цели
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Желаемый отход ко сну</label>
            <input
              type="time"
              value={targetBedtime}
              onChange={(e) => setTargetBedtime(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Желаемый подъем</label>
            <input
              type="time"
              value={targetWakeTime}
              onChange={(e) => setTargetWakeTime(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 font-mono text-sm focus:outline-none focus:border-purple-400"
            />
          </div>
        </div>
      </div>

      {/* Log Night Sleep Form */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span>Запись сна за прошедшую ночь ({todayDate})</span>
          </h2>
          {isSaved && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Сохранено!</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveSleep} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Уснул в</label>
              <input
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#121215] border border-surface-border rounded-xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Проснулся в</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#121215] border border-surface-border rounded-xl text-zinc-100 font-mono text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col justify-center bg-[#121215] border border-surface-border rounded-xl px-3 py-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">Общая длительность</span>
              <span className="text-sm font-bold text-primary font-mono">
                {currentSleepHours} ч {currentSleepRestMins} мин
              </span>
            </div>
          </div>

          {/* Quality Rating */}
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium">
              Субъективное качество сна (1 - 5 звезд)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setQualityRating(star as any)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= qualityRating
                        ? "text-amber-400 fill-amber-400"
                        : "text-zinc-600"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Wake Feeling */}
          <div>
            <label className="block text-zinc-400 mb-1.5 font-medium">Самочувствие при пробуждении</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {feelingOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setWakeFeeling(opt.id)}
                  className={`py-2 px-3 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    wakeFeeling === opt.id
                      ? "bg-primary/10 border-primary/40 text-zinc-100 font-semibold"
                      : "bg-[#121215] border-surface-border text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Заметки к ночному сну</label>
            <input
              type="text"
              placeholder="Шум за окном, вечернее чтение, проветренная комната..."
              value={sleepNotes}
              onChange={(e) => setSleepNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#121215] border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs shadow-md shadow-primary/20 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Зафиксировать сон</span>
            </button>
          </div>
        </form>
      </section>

      {/* History Log */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          <span>История сна</span>
        </h2>

        {sleepLogs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Записи сна пока отсутствуют.
          </p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
            {sleepLogs.slice(-7).reverse().map((sl) => (
              <div
                key={sl.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-border/40 border border-surface-border text-xs"
              >
                <div>
                  <span className="font-semibold text-zinc-200">{sl.date}</span>
                  <span className="block text-[11px] text-zinc-500 mt-0.5 font-mono">
                    {sl.bedTime} – {sl.wakeTime} ({Math.floor(sl.totalSleepMinutes / 60)} ч {sl.totalSleepMinutes % 60} мин)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                  <span>★ {sl.qualityRating}/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
