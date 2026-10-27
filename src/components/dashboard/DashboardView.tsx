"use client";

import React from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  CheckCircle2,
  Circle,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Flame,
  Droplet,
  GraduationCap,
  Dumbbell,
  PhoneOff,
  Moon,
  ChevronRight,
  Plus,
} from "lucide-react";
import type { ScheduledTimeSlot } from "@/types";

export function DashboardView() {
  const {
    todayDate,
    todayPlan,
    tasks,
    habits,
    habitLogs,
    studySessions,
    todayWaterTotal,
    userProfile,
    recalculateCurrentDay,
    updateSlotStatus,
    toggleHabitForDate,
    logWater,
    setActiveTab,
    startFocusTimer,
  } = useLifeOS();

  // Metrics for Today
  const todayTasks = tasks.filter((t) => t.date === todayDate);
  const eligibleTasks = todayTasks.filter((t) => t.status !== "cancelled");
  const completedTasksCount = eligibleTasks.filter((t) => t.status === "completed").length;

  const todayHabitLogs = habitLogs.filter((l) => l.date === todayDate && l.completed);
  const activeHabitsTodayCount = habits.filter(
    (h) => h.isActive && !h.isArchived && h.daysOfWeek.includes(new Date(todayDate + "T12:00:00").getDay() as any)
  ).length;

  const todayStudyActualMinutes = Math.round(
    studySessions
      .filter((s) => s.date === todayDate)
      .reduce((sum, s) => sum + s.durationSeconds, 0) / 60
  );

  const waterTarget = userProfile.waterSettings.dailyTargetMl;
  const waterPercent = Math.min(100, Math.round((todayWaterTotal / waterTarget) * 100));

  // Minimum for Today items (selected key habits or high priority tasks)
  const minimumHabits = habits.filter(
    (h) => userProfile.minimumForTodayHabitIds?.includes(h.id) || h.category === "self_care"
  ).slice(0, 4);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 1. Minimum for Today Block */}
      <section className="bg-[#121215] border border-surface-border rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-100 uppercase">
              Минимум на сегодня
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">
            Ключевые действия дня
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {minimumHabits.map((h) => {
            const isCompleted = habitLogs.some(
              (l) => l.habitId === h.id && l.date === todayDate && l.completed
            );
            return (
              <button
                key={h.id}
                onClick={() => toggleHabitForDate(h.id)}
                className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isCompleted
                    ? "bg-primary/10 border-primary/30 text-zinc-100"
                    : "bg-surface-subtle border-surface-border text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <span className={`block text-xs font-medium truncate ${isCompleted ? "line-through text-zinc-400" : ""}`}>
                    {h.title}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {h.preferredTime || h.timeOfDay || "В течение дня"}
                  </span>
                </div>
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Today's Key Metrics Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Tasks */}
        <div
          onClick={() => setActiveTab("tasks")}
          className="bg-surface-subtle border border-surface-border hover:border-zinc-600 rounded-xl p-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Задачи</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-zinc-100 font-mono">
            {completedTasksCount} / {eligibleTasks.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {eligibleTasks.length > 0
              ? `${Math.round((completedTasksCount / eligibleTasks.length) * 100)}% выполнено`
              : "Нет задач"}
          </div>
        </div>

        {/* Study */}
        <div
          onClick={() => setActiveTab("education")}
          className="bg-surface-subtle border border-surface-border hover:border-zinc-600 rounded-xl p-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Учёба</span>
            <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-lg font-bold text-zinc-100 font-mono">
            {todayStudyActualMinutes} мин
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Фактическое время</div>
        </div>

        {/* Habits */}
        <div
          onClick={() => setActiveTab("habits")}
          className="bg-surface-subtle border border-surface-border hover:border-zinc-600 rounded-xl p-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Привычки</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-zinc-100 font-mono">
            {todayHabitLogs.length} / {activeHabitsTodayCount}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Отмечено сегодня</div>
        </div>

        {/* Water */}
        <div
          onClick={() => setActiveTab("water")}
          className="bg-surface-subtle border border-surface-border hover:border-zinc-600 rounded-xl p-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Вода</span>
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-zinc-100 font-mono">
            {todayWaterTotal} мл
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">
            {waterPercent}% от нормы ({waterTarget} мл)
          </div>
        </div>

        {/* Screen Off */}
        <div
          onClick={() => setActiveTab("digital")}
          className="bg-surface-subtle border border-surface-border hover:border-zinc-600 rounded-xl p-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Экран</span>
            <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-base font-bold text-zinc-100 font-mono">
            {userProfile.digitalSettings.screenOffTime}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Режим отдыха</div>
        </div>

        {/* Sleep Target */}
        <div
          onClick={() => setActiveTab("recovery")}
          className="bg-surface-subtle border border-surface-border hover:border-zinc-600 rounded-xl p-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
            <span>Сон</span>
            <Moon className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-base font-bold text-zinc-100 font-mono">
            {userProfile.sleepSettings.targetBedtime}
          </div>
          <div className="text-[10px] text-zinc-400 mt-1">Целевой отход</div>
        </div>
      </section>

      {/* 3. Quick Actions Toolbar */}
      <section className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => {
            setActiveTab("education");
            startFocusTimer();
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs font-medium text-zinc-200 shrink-0 transition-colors"
        >
          <Play className="w-3.5 h-3.5 text-primary fill-primary" />
          <span>Начать фокус-таймер</span>
        </button>

        <button
          onClick={() => logWater(250)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs font-medium text-zinc-200 shrink-0 transition-colors"
        >
          <Droplet className="w-3.5 h-3.5 text-cyan-400" />
          <span>+250 мл воды</span>
        </button>

        <button
          onClick={() => setActiveTab("fitness")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs font-medium text-zinc-200 shrink-0 transition-colors"
        >
          <Dumbbell className="w-3.5 h-3.5 text-emerald-400" />
          <span>Записать тренировку</span>
        </button>

        <button
          onClick={() => setActiveTab("nutrition")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs font-medium text-zinc-200 shrink-0 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-amber-400" />
          <span>Записать еду</span>
        </button>

        <button
          onClick={recalculateCurrentDay}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs font-medium text-zinc-200 shrink-0 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          <span>Пересчитать план</span>
        </button>

        <button
          onClick={() => setActiveTab("digital")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs font-medium text-zinc-200 shrink-0 transition-colors"
        >
          <PhoneOff className="w-3.5 h-3.5 text-rose-400" />
          <span>Цифровой отдых</span>
        </button>
      </section>

      {/* 4. Conflict Warning (if overloaded) */}
      {todayPlan?.isOverloaded && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Внимание: перегрузка расписания на сегодня</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-200/90">
            Запланированные задачи превышают доступное свободное время. LIFE OS не забирает время сна. Рекомендуется перенести неприоритетные задачи или воспользоваться кнопкой &quot;Пересчитать план&quot;.
          </p>
          {todayPlan.conflictDetails && todayPlan.conflictDetails.length > 0 && (
            <ul className="list-disc list-inside text-[10px] text-amber-300/80 pt-1">
              {todayPlan.conflictDetails.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 5. Today's Plan Timeline */}
      <section className="bg-[#121215] border border-surface-border rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Расписание дня (Автоплан)</span>
            </h2>
            <span className="text-[11px] text-zinc-400">
              Построено автоматически с учетом режима и приоритетов
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("tasks")}
              className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-border text-xs text-zinc-300 border border-surface-border transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3 text-primary" />
              <span>Добавить задачу</span>
            </button>
          </div>
        </div>

        {/* Slot List */}
        {!todayPlan || todayPlan.slots.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            Нет запланированных блоков на сегодня.
          </div>
        ) : (
          <div className="space-y-2">
            {todayPlan.slots.map((slot) => {
              const isDone = slot.isCompleted;
              const isSkipped = slot.isSkipped;

              return (
                <div
                  key={slot.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                    isDone
                      ? "bg-surface-subtle/40 border-surface-border/50 text-zinc-400"
                      : isSkipped
                      ? "bg-surface-subtle/20 border-surface-border text-zinc-400 opacity-60"
                      : "bg-surface-subtle border-surface-border text-zinc-200 hover:border-zinc-500"
                  }`}
                >
                  {/* Left: Time & Details */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="font-mono text-xs font-semibold text-primary px-2 py-1 rounded-md bg-surface-subtle border border-surface-border shrink-0">
                      {slot.startTime} – {slot.endTime}
                    </div>
                    <div>
                      <span className={`text-xs font-medium block ${isDone ? "line-through text-zinc-400" : ""}`}>
                        {slot.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        <span>{slot.durationMinutes} мин</span>
                        <span>•</span>
                        <span className="capitalize">{slot.category}</span>
                        {slot.isFixed && (
                          <span className="px-1.5 py-0.2 rounded bg-surface-border text-zinc-400">
                            Фиксированное
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 mt-2 sm:mt-0 self-end sm:self-auto">
                    {slot.type === "study" && !isDone && (
                      <button
                        onClick={() => {
                          setActiveTab("education");
                          startFocusTimer(slot.referenceId, undefined, slot.title);
                        }}
                        title="Начать фокус-таймер"
                        className="px-2 py-1 rounded bg-primary-muted text-primary border border-primary-border text-[11px] font-medium hover:bg-primary/20 flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-primary" />
                        <span>Фокус</span>
                      </button>
                    )}

                    {!slot.isFixed && (
                      <>
                        <button
                          onClick={() =>
                            updateSlotStatus(slot.id, isDone ? "scheduled" : "completed")
                          }
                          className={`p-1.5 rounded-lg border text-xs transition-colors ${
                            isDone
                              ? "bg-primary text-black border-primary"
                              : "bg-surface-subtle text-zinc-400 border-surface-border hover:text-zinc-100 hover:border-zinc-500"
                          }`}
                          title={isDone ? "Вернуть в план" : "Отметить выполненным"}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            updateSlotStatus(slot.id, isSkipped ? "scheduled" : "skipped")
                          }
                          className={`p-1.5 rounded-lg border text-[10px] font-medium transition-colors ${
                            isSkipped
                              ? "bg-zinc-700 text-zinc-200 border-zinc-600"
                              : "bg-surface-subtle text-zinc-400 border-surface-border hover:text-zinc-300"
                          }`}
                          title="Пропустить без чувства вины"
                        >
                          {isSkipped ? "Пропущено" : "Пропуск"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
