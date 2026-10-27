"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  Repeat,
  Menu,
  X,
  GraduationCap,
  Dumbbell,
  Utensils,
  Droplet,
  PhoneOff,
  Moon,
  Calendar,
  BarChart3,
  Settings,
} from "lucide-react";

export function BottomNav() {
  const { activeTab, setActiveTab } = useLifeOS();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const mainTabs = [
    { id: "dashboard", label: "Главная", icon: LayoutDashboard },
    { id: "today", label: "План", icon: CalendarCheck },
    { id: "tasks", label: "Задачи", icon: CheckSquare },
    { id: "habits", label: "Привычки", icon: Repeat },
  ];

  const drawerItems = [
    { id: "education", label: "Учёба & Фокус-таймер", icon: GraduationCap },
    { id: "fitness", label: "Тренировки & Нагрузка", icon: Dumbbell },
    { id: "nutrition", label: "Питание & Контроль сахара", icon: Utensils },
    { id: "water", label: "Водный баланс", icon: Droplet },
    { id: "digital", label: "Цифровая дисциплина", icon: PhoneOff },
    { id: "recovery", label: "Сон & Восстановление", icon: Moon },
    { id: "calendar", label: "Общий календарь", icon: Calendar },
    { id: "analytics", label: "Аналитика прогресса", icon: BarChart3 },
    { id: "settings", label: "Настройки & Экспорт", icon: Settings },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-surface-border px-2 py-1.5 flex items-center justify-around">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}

        {/* More Menu Button */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition-colors ${
            isMenuOpen || !mainTabs.some((t) => t.id === activeTab)
              ? "text-primary"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Ещё</span>
        </button>
      </nav>

      {/* More Drawer Modal for Mobile */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#121215] border-t border-surface-border rounded-t-2xl max-h-[80vh] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-3">
              <span className="text-sm font-semibold text-zinc-100">Все разделы LIFE OS</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-6">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium text-left border transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-surface-subtle border-surface-border text-zinc-300 hover:bg-surface-border"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-primary" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
