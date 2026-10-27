"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  BarChart3,
  Flame,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  Droplet,
  Dumbbell,
  Moon,
  PhoneOff,
  Info,
} from "lucide-react";

export function AnalyticsView() {
  const { getAnalytics, todayDate } = useLifeOS();
  const [periodDays, setPeriodDays] = useState<7 | 30 | 90>(7);

  const stats = getAnalytics(periodDays);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Period Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>Аналитика и статистика прогресса</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Реальные показатели без выдуманных цифр и без учета будущих дней в знаменателе.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border text-xs self-start sm:self-auto font-mono">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                periodDays === days
                  ? "bg-primary text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {days} дней
            </button>
          ))}
        </div>
      </div>

      {/* Streak Hero Section */}
      <section className="bg-gradient-to-r from-surface-subtle via-[#121215] to-surface-subtle border border-surface-border rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Flame className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            </div>
            <div>
              <span className="text-xs text-zinc-400 uppercase font-mono block">
                Текущая серия активности
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-zinc-100 mt-0.5">
                {stats.currentStreakDays} {stats.currentStreakDays === 1 ? "день" : "дней подряд"}
              </div>
              <span className="text-[11px] text-zinc-500 mt-1 block">
                Активным считается день с хотя бы одной выполненной привычкой, задачей или тренировкой.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 sm:border-l border-surface-border pt-3 sm:pt-0 sm:pl-6 text-xs font-mono">
            <div>
              <span className="text-zinc-500 block">Лучшая серия</span>
              <span className="text-lg font-bold text-primary mt-0.5 block">
                {stats.bestStreakDays} дн.
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Всего активных дней</span>
              <span className="text-lg font-bold text-zinc-100 mt-0.5 block">
                {stats.activeDaysCount} дн.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metric Rates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Task Completion Rate */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Выполнение задач</span>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.eligibleTaskCount > 0 ? `${stats.taskCompletionRate}%` : "Нет данных"}
          </div>
          <p className="text-[10px] text-zinc-500">
            Выполнено {stats.completedTaskCount} из {stats.eligibleTaskCount} подлежащих учету
          </p>
        </div>

        {/* Study Completion Rate */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Учебное время</span>
            <GraduationCap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.actualStudyMinutes > 0 ? `${Math.round(stats.actualStudyMinutes / 60 * 10) / 10} ч` : "0 ч"}
          </div>
          <p className="text-[10px] text-zinc-500">
            {stats.plannedStudyMinutes > 0
              ? `План: ${Math.round(stats.plannedStudyMinutes / 60)} ч (${stats.studyCompletionRate}%)`
              : "Фактически на таймере"}
          </p>
        </div>

        {/* Habit Completion Rate */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Регулярность привычек</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.totalHabitOccurrences > 0
              ? `${stats.habitCompletionRate}%`
              : "Нет данных"}
          </div>
          <p className="text-[10px] text-zinc-500">
            Отмечено {stats.completedHabitOccurrences} из {stats.totalHabitOccurrences} повторений
          </p>
        </div>

        {/* Water Attainment */}
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Водный баланс</span>
            <Droplet className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.avgDailyWaterMl} мл/день
          </div>
          <p className="text-[10px] text-zinc-500">
            В среднем {stats.waterTargetAttainmentRate}% от выбранной нормы
          </p>
        </div>
      </div>

      {/* Fitness & Recovery Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Завершенных тренировок</span>
            <Dumbbell className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.totalWorkoutsCompleted}
          </div>
          <p className="text-[10px] text-zinc-500">Сессий за выбранный период</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Цифровой детокс</span>
            <PhoneOff className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.digitalDetoxSuccessDays} дн.
          </div>
          <p className="text-[10px] text-zinc-500">Дней осознанного отдыха от экрана</p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Средняя продолжительность сна</span>
            <Moon className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-zinc-100">
            {stats.avgSleepMinutes > 0
              ? `${Math.floor(stats.avgSleepMinutes / 60)} ч ${stats.avgSleepMinutes % 60} м`
              : "Нет записей"}
          </div>
          <p className="text-[10px] text-zinc-500">По данным ночного журнала</p>
        </div>
      </div>

      {/* Formula Transparency Note */}
      <div className="p-4 rounded-2xl bg-surface-subtle border border-surface-border text-xs text-zinc-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-semibold text-zinc-200">Честная математика формул:</span>
          <p className="text-[11px]">
            • Процент выполнения задач = <code className="text-zinc-300">выполненные / все подлежащие учету × 100</code> (будущие и отмененные исключены).<br />
            • Процент привычек = <code className="text-zinc-300">отмеченные дни / наступившие дни по расписанию × 100</code>.<br />
            • При пустом знаменателе отображается статус &quot;Нет данных&quot; вместо деления на ноль.
          </p>
        </div>
      </div>
    </div>
  );
}
