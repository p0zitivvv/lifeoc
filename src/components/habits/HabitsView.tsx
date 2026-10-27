"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Circle,
  Archive,
  RotateCcw,
  Clock,
  Calendar,
  X,
  Droplet,
  Utensils,
  Moon,
  PhoneOff,
  Flame,
  Check,
} from "lucide-react";
import type { Habit, HabitCategory, HabitMeasurementType, DayOfWeek } from "@/types";

export function HabitsView() {
  const {
    habits,
    habitLogs,
    todayDate,
    createHabit,
    updateHabit,
    archiveHabit,
    toggleHabitForDate,
    logHabitValue,
  } = useLifeOS();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Habit Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<HabitCategory>("self_care");
  const [measurementType, setMeasurementType] = useState<HabitMeasurementType>("boolean");
  const [targetValue, setTargetValue] = useState(1);
  const [unit, setUnit] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekdays" | "weekends" | "specific_days">("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>([0, 1, 2, 3, 4, 5, 6]);
  const [preferredTime, setPreferredTime] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "afternoon" | "evening" | "anytime">("anytime");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");

  // Generate last 7 days list for the bubble grid
  const last7Days = React.useMemo(() => {
    const list: string[] = [];
    const base = new Date(todayDate + "T12:00:00");
    for (let i = 6; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      list.push(d.toISOString().split("T")[0]);
    }
    return list;
  }, [todayDate]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let computedDays = daysOfWeek;
    if (frequency === "daily") computedDays = [0, 1, 2, 3, 4, 5, 6];
    else if (frequency === "weekdays") computedDays = [1, 2, 3, 4, 5];
    else if (frequency === "weekends") computedDays = [0, 6];

    await createHabit({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      measurementType,
      targetValue,
      unit: unit.trim() || undefined,
      frequency,
      daysOfWeek: computedDays,
      preferredTime: preferredTime || undefined,
      timeOfDay,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      startDate: todayDate,
      isActive: true,
      isArchived: false,
    });

    setTitle("");
    setDescription("");
    setIsModalOpen(false);
  };

  const categoriesList: { id: HabitCategory | "all"; label: string }[] = [
    { id: "all", label: "Все" },
    { id: "self_care", label: "Уход за собой" },
    { id: "micro_habit", label: "Микропривычки" },
    { id: "hydration", label: "Вода" },
    { id: "nutrition", label: "Питание" },
    { id: "cold_shower", label: "Холодный душ" },
    { id: "digital_discipline", label: "Цифровой режим" },
    { id: "recovery", label: "Сон и отдых" },
    { id: "custom", label: "Свои" },
  ];

  const filteredHabits = habits.filter((h) => {
    if (showArchived ? !h.isArchived : h.isArchived) return false;
    if (selectedCategory !== "all" && h.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-zinc-100">Трекер привычек</h1>
          <p className="text-xs text-zinc-400">
            Регулярность важнее идеальности. Единичный пропуск не сбрасывает весь прогресс.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
              showArchived
                ? "bg-surface-border text-zinc-200 border-zinc-500"
                : "bg-surface-subtle text-zinc-400 border-surface-border hover:text-zinc-200"
            }`}
          >
            {showArchived ? "Активные" : "Архив"}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs transition-all shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>Новая привычка</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 border transition-colors ${
              selectedCategory === cat.id
                ? "bg-primary text-black border-primary font-semibold"
                : "bg-surface-subtle text-zinc-400 border-surface-border hover:text-zinc-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Habits List */}
      <div className="space-y-3">
        {filteredHabits.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs bg-surface-subtle/50 border border-surface-border rounded-2xl">
            {showArchived ? "В архиве нет привычек." : "Привычки в этой категории не найдены."}
          </div>
        ) : (
          filteredHabits.map((habit) => {
            const todayLog = habitLogs.find(
              (l) => l.habitId === habit.id && l.date === todayDate
            );
            const isCompletedToday = todayLog?.completed || false;

            return (
              <div
                key={habit.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isCompletedToday
                    ? "bg-surface-subtle/40 border-surface-border/60 text-zinc-300"
                    : "bg-surface-subtle border-surface-border text-zinc-100 hover:border-zinc-500"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Checkmark & Info */}
                  <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleHabitForDate(habit.id)}
                      className="mt-0.5 sm:mt-0 text-zinc-400 hover:text-primary transition-colors shrink-0"
                    >
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-6 h-6 text-primary fill-primary/15" />
                      ) : (
                        <Circle className="w-6 h-6 text-zinc-500 hover:text-zinc-300" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            isCompletedToday ? "line-through text-zinc-400" : ""
                          }`}
                        >
                          {habit.title}
                        </span>
                        {habit.isOptional && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-surface-border text-zinc-400">
                            Опционально
                          </span>
                        )}
                      </div>

                      {habit.description && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                          {habit.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-1.5 font-mono">
                        {habit.preferredTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <span>{habit.preferredTime}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{habit.frequency}</span>
                        {habit.measurementType !== "boolean" && (
                          <>
                            <span>•</span>
                            <span>
                              Цель: {habit.targetValue} {habit.unit || ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: 7-Day History Bubbles */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <div className="flex items-center gap-1 bg-surface-border/50 p-1.5 rounded-xl border border-surface-border">
                      {last7Days.map((dStr) => {
                        const dObj = new Date(dStr + "T12:00:00");
                        const dayLetter = ["В", "П", "В", "С", "Ч", "П", "С"][dObj.getDay()];
                        const log = habitLogs.find((l) => l.habitId === habit.id && l.date === dStr);
                        const done = log?.completed || false;
                        const isToday = dStr === todayDate;

                        return (
                          <button
                            key={dStr}
                            onClick={() => toggleHabitForDate(habit.id, dStr)}
                            title={`${dStr} (${done ? "Выполнено" : "Не отмечено"})`}
                            className={`w-5 h-6 rounded-md flex flex-col items-center justify-center text-[9px] font-mono transition-all ${
                              done
                                ? "bg-primary text-black font-bold"
                                : isToday
                                ? "bg-zinc-700 text-zinc-300"
                                : "text-zinc-400 hover:bg-zinc-800"
                            }`}
                          >
                            <span>{dayLetter}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Archive Button */}
                    <button
                      onClick={() => archiveHabit(habit.id, !habit.isArchived)}
                      title={habit.isArchived ? "Восстановить" : "В архив"}
                      className="p-2 rounded-lg bg-surface-border text-zinc-400 hover:text-zinc-200 text-xs"
                    >
                      {habit.isArchived ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Archive className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121215] border border-surface-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="font-semibold text-sm text-zinc-100">Создать новую привычку</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Название привычки <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Проветрить комнату перед сном"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">Описание / Мотивация</label>
                <input
                  type="text"
                  placeholder="Спокойное пояснение пользы"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="self_care">Уход за собой</option>
                    <option value="micro_habit">Микропривычка</option>
                    <option value="education">Учеба</option>
                    <option value="fitness">Фитнес</option>
                    <option value="nutrition">Питание</option>
                    <option value="hydration">Водный баланс</option>
                    <option value="cold_shower">Холодный душ</option>
                    <option value="digital_discipline">Цифровой режим</option>
                    <option value="recovery">Сон и отдых</option>
                    <option value="custom">Другое</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Тип измерения</label>
                  <select
                    value={measurementType}
                    onChange={(e) => setMeasurementType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="boolean">Да / Нет (1 отметка)</option>
                    <option value="duration">Длительность (минуты)</option>
                    <option value="count">Количество (раз, страниц)</option>
                    <option value="volume">Объем (мл)</option>
                  </select>
                </div>
              </div>

              {measurementType !== "boolean" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Целевое значение</label>
                    <input
                      type="number"
                      min="1"
                      value={targetValue}
                      onChange={(e) => setTargetValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-zinc-300 mb-1">Единица измерения</label>
                    <input
                      type="text"
                      placeholder="мин, стр, раз, мл"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Регулярность</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                  >
                    <option value="daily">Каждый день</option>
                    <option value="weekdays">Будни</option>
                    <option value="weekends">Выходные</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Желаемое время <span className="text-zinc-500">(опц.)</span>
                  </label>
                  <input
                    type="time"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black font-semibold text-xs transition-all"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
