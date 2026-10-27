"use client";

import React from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  Repeat,
  GraduationCap,
  Dumbbell,
  Utensils,
  Droplet,
  PhoneOff,
  Moon,
  Calendar,
  BarChart3,
  Settings,
  Sparkles,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export function Sidebar() {
  const { activeTab, setActiveTab, tasks, habits, todayDate } = useLifeOS();

  // Calculate pending counts
  const pendingTasksToday = tasks.filter(
    (t) => t.date === todayDate && t.status === "scheduled"
  ).length;

  const activeHabitsCount = habits.filter((h) => h.isActive && !h.isArchived).length;

  const navItems: NavItem[] = [
    { id: "dashboard", label: "Главная", icon: LayoutDashboard },
    { id: "today", label: "План на день", icon: CalendarCheck },
    { id: "tasks", label: "Задачи", icon: CheckSquare, badge: pendingTasksToday || undefined },
    { id: "habits", label: "Привычки", icon: Repeat, badge: activeHabitsCount || undefined },
    { id: "education", label: "Учёба & Фокус", icon: GraduationCap },
    { id: "fitness", label: "Тренировки", icon: Dumbbell },
    { id: "nutrition", label: "Питание & Сахар", icon: Utensils },
    { id: "water", label: "Водный баланс", icon: Droplet },
    { id: "digital", label: "Экранный режим", icon: PhoneOff },
    { id: "recovery", label: "Сон & Отдых", icon: Moon },
    { id: "calendar", label: "Календарь", icon: Calendar },
    { id: "analytics", label: "Аналитика", icon: BarChart3 },
    { id: "settings", label: "Настройки", icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#0c0c0e] border-r border-surface-border select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <span className="font-bold text-sm tracking-wide text-zinc-100">LIFE OS</span>
          <span className="block text-[10px] text-zinc-400 font-mono tracking-tighter">
            DISCIPLINE & BALANCE
          </span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/25 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-surface-subtle border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-primary" : "text-zinc-400 group-hover:text-zinc-200"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                    isActive
                      ? "bg-primary text-black"
                      : "bg-surface-subtle text-zinc-400 border border-surface-border"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer system status */}
      <div className="p-4 border-t border-surface-border text-[11px] text-zinc-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span>Локальное хранилище</span>
        </div>
        <span className="text-[10px] text-zinc-400">v1.0 PWA</span>
      </div>
    </aside>
  );
}
