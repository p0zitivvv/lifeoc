"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Tag,
  ArrowRight,
} from "lucide-react";
import type { Task, TaskCategory, Priority, SubTask } from "@/types";

export function TasksView() {
  const { tasks, todayDate, createTask, updateTask, deleteTask, toggleTaskStatus, toggleSubtask } =
    useLifeOS();

  const [activeFilter, setActiveFilter] = useState<"today" | "all" | "upcoming" | "completed">("today");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // Modal Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("education");
  const [date, setDate] = useState(todayDate);
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priority, setPriority] = useState<Priority>("medium");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState("");

  const handleAddSubtask = () => {
    if (!newSubtaskInput.trim()) return;
    setSubtasks([...subtasks, newSubtaskInput.trim()]);
    setNewSubtaskInput("");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formattedSubtasks: SubTask[] = subtasks.map((st, i) => ({
      id: "st_" + Date.now() + "_" + i,
      title: st,
      completed: false,
    }));

    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      date,
      startTime: startTime || undefined,
      durationMinutes,
      priority,
      status: "scheduled",
      subtasks: formattedSubtasks,
    });

    // Reset and close
    setTitle("");
    setDescription("");
    setStartTime("");
    setSubtasks([]);
    setIsModalOpen(false);
  };

  const handlePostponeTomorrow = async (task: Task) => {
    const cur = new Date(task.date + "T12:00:00");
    cur.setDate(cur.getDate() + 1);
    const nextDate = cur.toISOString().split("T")[0];
    await updateTask(task.id, { date: nextDate });
  };

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;

    if (activeFilter === "today") {
      return t.date === todayDate;
    } else if (activeFilter === "upcoming") {
      return t.date > todayDate && t.status !== "completed";
    } else if (activeFilter === "completed") {
      return t.status === "completed";
    }
    return true; // 'all'
  });

  const priorityColors: Record<Priority, string> = {
    urgent: "text-rose-400 bg-rose-500/10 border-rose-500/30",
    high: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    medium: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    low: "text-zinc-400 bg-zinc-500/10 border-zinc-500/30",
  };

  const categoryLabels: Record<TaskCategory, string> = {
    education: "Учёба",
    fitness: "Спорт",
    nutrition: "Питание",
    self_care: "Уход",
    work: "Работа",
    chores: "Быт",
    recovery: "Отдых",
    other: "Другое",
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header & New Task Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-zinc-100">Менеджер задач</h1>
          <p className="text-xs text-zinc-400">
            Детерминированное планирование без дублирования и фиктивных слотов
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs transition-all shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Новая задача</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-surface-subtle p-1 rounded-xl border border-surface-border text-xs">
          {[
            { id: "today", label: "Сегодня" },
            { id: "upcoming", label: "Предстоящие" },
            { id: "all", label: "Все" },
            { id: "completed", label: "Выполненные" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeFilter === tab.id
                  ? "bg-surface-border text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Pill Filters */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-surface-subtle border border-surface-border rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-primary"
        >
          <option value="all">Все категории</option>
          {Object.entries(categoryLabels).map(([catKey, label]) => (
            <option key={catKey} value={catKey}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs bg-surface-subtle/50 border border-surface-border rounded-2xl">
            Задачи не найдены в этой категории.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "completed";
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isDone
                    ? "bg-surface-subtle/30 border-surface-border/50 text-zinc-500 opacity-70"
                    : "bg-surface-subtle border-surface-border text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left: Complete Checkbox + Title */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 text-zinc-400 hover:text-primary transition-colors shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-primary fill-primary/10" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-semibold block leading-tight ${
                          isDone ? "line-through text-zinc-500" : "text-zinc-100"
                        }`}
                      >
                        {task.title}
                      </span>

                      {task.description && (
                        <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Meta chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded-full border font-mono uppercase font-semibold ${
                            priorityColors[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-surface-border text-zinc-400">
                          {categoryLabels[task.category] || task.category}
                        </span>

                        <span className="flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-3 h-3" />
                          <span>{task.date}</span>
                        </span>

                        <span className="flex items-center gap-1 text-zinc-400">
                          <Clock className="w-3 h-3" />
                          <span>{task.durationMinutes} мин</span>
                          {task.startTime && <span>(в {task.startTime})</span>}
                        </span>

                        {task.subtasks.length > 0 && (
                          <button
                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                            className="flex items-center gap-1 text-primary font-medium hover:underline ml-1"
                          >
                            <span>
                              Подзадачи: {task.subtasks.filter((s) => s.completed).length}/
                              {task.subtasks.length}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handlePostponeTomorrow(task)}
                      title="Перенести на завтра"
                      className="p-1.5 rounded-lg bg-surface-border text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      title="Удалить"
                      className="p-1.5 rounded-lg bg-surface-border text-zinc-400 hover:text-rose-400 text-xs transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Subtasks */}
                {isExpanded && task.subtasks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-border/60 pl-8 space-y-1.5">
                    {task.subtasks.map((st) => (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300"
                      >
                        <input
                          type="checkbox"
                          checked={st.completed}
                          onChange={() => toggleSubtask(task.id, st.id)}
                          className="w-3.5 h-3.5 accent-primary rounded"
                        />
                        <span className={st.completed ? "line-through text-zinc-500" : ""}>
                          {st.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#121215] border border-surface-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="font-semibold text-sm text-zinc-100">Создать новую задачу</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="block font-medium text-zinc-300 mb-1">
                  Название задачи <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Решить 10 задач по математике"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-1">Описание (опционально)</label>
                <textarea
                  rows={2}
                  placeholder="Конкретные детали и ожидаемый результат"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-primary text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Категория</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 focus:outline-none focus:border-primary text-xs"
                  >
                    {Object.entries(categoryLabels).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Приоритет</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 focus:outline-none focus:border-primary text-xs"
                  >
                    <option value="low">Низкий (Low)</option>
                    <option value="medium">Средний (Medium)</option>
                    <option value="high">Высокий (High)</option>
                    <option value="urgent">Срочный (Urgent)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Дата</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">
                    Фикс. время <span className="text-zinc-500">(опц.)</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-1">Длительность (мин)</label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    step="5"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 focus:outline-none focus:border-primary text-xs"
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <label className="block font-medium text-zinc-300 mb-1">Подзадачи</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Добавить подзадачу..."
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 text-xs focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-3 py-1.5 rounded-lg bg-surface-border hover:bg-surface-border/80 text-zinc-200 text-xs"
                  >
                    +
                  </button>
                </div>

                {subtasks.length > 0 && (
                  <ul className="space-y-1">
                    {subtasks.map((st, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1 bg-surface-subtle border border-surface-border rounded-md text-[11px]"
                      >
                        <span>• {st}</span>
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.filter((_, i) => i !== idx))}
                          className="text-zinc-500 hover:text-rose-400"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
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
                  Создать задачу
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
