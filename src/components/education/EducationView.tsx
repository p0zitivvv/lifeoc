"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  Timer,
} from "lucide-react";
import type { Subject } from "@/types";

export function EducationView() {
  const {
    subjects,
    studySessions,
    focusTimer,
    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    resetFocusTimer,
    finishFocusTimer,
    todayDate,
  } = useLifeOS();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    focusTimer.selectedSubjectId || subjects[0]?.id || ""
  );
  const [topicInput, setTopicInput] = useState<string>(focusTimer.selectedTopic || "");
  const [customMinutes, setCustomMinutes] = useState<number>(25);

  // Time remaining calculation
  const elapsed =
    focusTimer.isRunning && !focusTimer.isPaused && focusTimer.startTimestamp
      ? focusTimer.accumulatedSeconds +
        Math.floor((Date.now() - focusTimer.startTimestamp) / 1000)
      : focusTimer.accumulatedSeconds;

  const secondsRemaining = Math.max(0, focusTimer.targetSeconds - elapsed);
  const minutesDisplay = Math.floor(secondsRemaining / 60);
  const secondsDisplay = secondsRemaining % 60;
  const progressPercent = Math.min(
    100,
    Math.round((elapsed / Math.max(1, focusTimer.targetSeconds)) * 100)
  );

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Calculate study stats per subject for this week
  const getSubjectActualHours = (subId: string) => {
    const totalSecs = studySessions
      .filter((s) => s.subjectId === subId)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
    return Math.round((totalSecs / 3600) * 10) / 10;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-surface-border">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-blue-400" />
          <span>Учёба и Фокус-таймер</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Конкретные измеримые результаты вместо размытого &quot;посидеть за учебником&quot;. Фактический учет времени по меткам времени.
        </p>
      </div>

      {/* Main Focus Timer Card */}
      <div className="bg-[#121215] border border-surface-border rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
        {/* Glow indicator */}
        <div
          className={`absolute inset-0 bg-primary/5 transition-opacity ${
            focusTimer.isRunning && !focusTimer.isPaused ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Phase Badge */}
        <div className="z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-subtle border border-surface-border text-xs font-medium text-primary mb-4 font-mono">
          <Timer className="w-3.5 h-3.5" />
          <span>
            {focusTimer.mode === "work"
              ? "Рабочая сессия"
              : focusTimer.mode === "shortBreak"
              ? "Короткий перерыв"
              : "Длинный отдых"}
          </span>
        </div>

        {/* Timer Numbers */}
        <div className="z-10 font-mono text-5xl sm:text-7xl font-bold tracking-tight text-zinc-100 my-2">
          {String(minutesDisplay).padStart(2, "0")}:{String(secondsDisplay).padStart(2, "0")}
        </div>

        {/* Progress Bar */}
        <div className="z-10 w-full max-w-xs h-2 bg-surface-subtle rounded-full overflow-hidden my-4">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Subject & Topic Selectors */}
        <div className="z-10 w-full max-w-md grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-3 text-xs text-left">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Предмет</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 focus:outline-none focus:border-primary text-xs"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Конкретная цель / тема</label>
            <input
              type="text"
              placeholder="Напр.: Решить 5 задач"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        {/* Timer Controls */}
        <div className="z-10 flex items-center gap-3 mt-4">
          {!focusTimer.isRunning ? (
            <button
              onClick={() => startFocusTimer(selectedSubjectId, undefined, topicInput)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs transition-all shadow-lg shadow-primary/20"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Начать сессию</span>
            </button>
          ) : focusTimer.isPaused ? (
            <button
              onClick={resumeFocusTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs transition-all"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Продолжить</span>
            </button>
          ) : (
            <button
              onClick={pauseFocusTimer}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-100 hover:bg-surface-border font-semibold text-xs transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>Пауза</span>
            </button>
          )}

          {focusTimer.isRunning && (
            <button
              onClick={finishFocusTimer}
              title="Завершить и сохранить фактическое время"
              className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold text-xs transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Завершить</span>
            </button>
          )}

          <button
            onClick={resetFocusTimer}
            title="Сбросить таймер"
            className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-400 hover:text-zinc-200 text-xs transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Subjects Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-100">Учебные предметы и цели</h2>
          <span className="text-xs text-zinc-400">План vs Факт</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {subjects.map((sub) => {
            const actualHours = getSubjectActualHours(sub.id);
            const targetHours = sub.weeklyTargetHours;
            const pct = Math.min(100, Math.round((actualHours / targetHours) * 100));

            return (
              <div
                key={sub.id}
                className="p-4 rounded-2xl bg-surface-subtle border border-surface-border text-zinc-200 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold block">{sub.name}</span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 font-mono">
                      Цель: {targetHours} ч/нед • Экзамен: {sub.examDate || "Не задан"}
                    </span>
                  </div>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sub.color }}
                  />
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span>{actualHours} ч факта</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Topics list */}
                {sub.topics.length > 0 && (
                  <div className="pt-2 border-t border-surface-border/60">
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block mb-1">
                      Темы на проработку:
                    </span>
                    <ul className="space-y-1">
                      {sub.topics.map((t, idx) => (
                        <li key={idx} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                          <span>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Study Session History Log */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>История учебных сессий</span>
        </h2>

        {studySessions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Учебные сессии еще не записаны. Запустите таймер, чтобы зафиксировать прогресс.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {studySessions.slice(-8).reverse().map((s) => {
              const sub = subjects.find((sb) => sb.id === s.subjectId);
              const durationMin = Math.round(s.durationSeconds / 60);

              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-border/40 border border-surface-border text-xs"
                >
                  <div>
                    <span className="font-semibold text-zinc-200">
                      {sub?.name || "Предмет"}
                    </span>
                    {s.topic && <span className="text-zinc-400 ml-1.5">• {s.topic}</span>}
                    <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                      {s.date} в{" "}
                      {new Date(s.startTime).toLocaleTimeString("ru-RU", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="font-mono font-semibold text-primary">
                    +{durationMin} мин
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
