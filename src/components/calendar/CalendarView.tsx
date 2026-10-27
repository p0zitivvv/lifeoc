"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
} from "lucide-react";

export function CalendarView() {
  const { tasks, habits, habitLogs, workoutSessions, studySessions, todayDate } =
    useLifeOS();

  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<string>(todayDate);

  // Month generation
  const activeDateObj = new Date(currentDate + "T12:00:00");
  const year = activeDateObj.getFullYear();
  const month = activeDateObj.getMonth();

  const handlePrev = () => {
    const d = new Date(activeDateObj);
    if (viewMode === "day") d.setDate(d.getDate() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const handleNext = () => {
    const d = new Date(activeDateObj);
    if (viewMode === "day") d.setDate(d.getDate() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d.toISOString().split("T")[0]);
  };

  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];

  // Week days
  const weekDays = React.useMemo(() => {
    const curr = new Date(activeDateObj);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    const list: string[] = [];
    for (let i = 0; i < 7; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      list.push(next.toISOString().split("T")[0]);
    }
    return list;
  }, [activeDateObj]);

  const dayHeaders = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <span>Календарь расписания</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Единое расписание задач, привычек, учебных блоков и тренировок
          </p>
        </div>

        {/* View Mode Switcher & Date Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-surface-subtle p-1 rounded-xl border border-surface-border text-xs">
            {(["day", "week", "month"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  viewMode === m
                    ? "bg-surface-border text-zinc-100 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {m === "day" ? "День" : m === "week" ? "Неделя" : "Месяц"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-surface-subtle p-1 rounded-xl border border-surface-border">
            <button
              onClick={handlePrev}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-zinc-200 px-2">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNext}
              className="p-1 rounded text-zinc-400 hover:text-zinc-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Week View */}
      {viewMode === "week" && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5">
          {weekDays.map((dStr, idx) => {
            const isToday = dStr === todayDate;
            const dayTasks = tasks.filter((t) => t.date === dStr);
            const dayWorkouts = workoutSessions.filter((w) => w.date === dStr);

            return (
              <div
                key={dStr}
                className={`p-3 rounded-2xl border flex flex-col min-h-[220px] transition-all ${
                  isToday
                    ? "bg-surface-subtle border-primary/40 shadow-md shadow-primary/5"
                    : "bg-surface-subtle border-surface-border"
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-surface-border/60 mb-2">
                  <span className="font-semibold text-xs text-zinc-400">
                    {dayHeaders[idx]}
                  </span>
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-full font-bold ${
                      isToday ? "bg-primary text-black" : "text-zinc-200"
                    }`}
                  >
                    {dStr.split("-")[2]}
                  </span>
                </div>

                {/* Day events list */}
                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-1.5 rounded-lg text-[11px] border leading-tight ${
                        t.status === "completed"
                          ? "bg-primary/10 border-primary/30 text-zinc-400 line-through"
                          : "bg-surface-border/50 border-surface-border text-zinc-200"
                      }`}
                    >
                      <span className="font-medium truncate block">{t.title}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">
                        {t.startTime || `${t.durationMinutes} мин`}
                      </span>
                    </div>
                  ))}

                  {dayWorkouts.map((w) => (
                    <div
                      key={w.id}
                      className="p-1.5 rounded-lg text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-medium"
                    >
                      🏋️ {w.title}
                    </div>
                  ))}

                  {dayTasks.length === 0 && dayWorkouts.length === 0 && (
                    <span className="block text-[10px] text-zinc-600 text-center pt-8">
                      Свободно
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="bg-surface-subtle border border-surface-border rounded-2xl p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500 font-mono pb-2 border-b border-surface-border">
            {dayHeaders.map((dh) => (
              <div key={dh}>{dh}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 31 }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
                dayNum
              ).padStart(2, "0")}`;
              const isToday = dateStr === todayDate;
              const taskCount = tasks.filter((t) => t.date === dateStr).length;

              return (
                <div
                  key={dayNum}
                  onClick={() => {
                    setCurrentDate(dateStr);
                    setViewMode("day");
                  }}
                  className={`p-2 rounded-xl border min-h-[64px] flex flex-col justify-between text-xs cursor-pointer transition-all ${
                    isToday
                      ? "bg-primary/10 border-primary/40 text-primary font-bold"
                      : "bg-[#121215] border-surface-border text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  <span className="font-mono">{dayNum}</span>
                  {taskCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-border text-primary self-start font-mono">
                      {taskCount} зад.
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="bg-surface-subtle border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-zinc-100">
              События на {currentDate}
            </h2>
          </div>

          <div className="space-y-2">
            {tasks
              .filter((t) => t.date === currentDate)
              .map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#121215] border border-surface-border text-xs"
                >
                  <div>
                    <span
                      className={`font-semibold text-zinc-200 block ${
                        t.status === "completed" ? "line-through text-zinc-500" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-0.5 block font-mono">
                      {t.startTime ? `В ${t.startTime}` : `${t.durationMinutes} мин`} • {t.category}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                      t.status === "completed"
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-surface-border text-zinc-400 border-surface-border"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
