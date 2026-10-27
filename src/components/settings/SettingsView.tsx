"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Bell,
  Clock,
  User,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { requestBrowserPushPermission } from "@/lib/engines/notifications";

export function SettingsView() {
  const {
    userProfile,
    updateUserProfile,
    exportData,
    importBackup,
    resetAllData,
  } = useLifeOS();

  // Profile fields
  const [name, setName] = useState(userProfile.name);
  const [wakeTime, setWakeTime] = useState(userProfile.routine.wakeTime);
  const [sleepTime, setSleepTime] = useState(userProfile.routine.sleepTime);
  const [workStart, setWorkStart] = useState(userProfile.routine.workOrSchoolStart);
  const [workEnd, setWorkEnd] = useState(userProfile.routine.workOrSchoolEnd);
  const [commuteMinutes, setCommuteMinutes] = useState(userProfile.routine.commuteMinutes);

  const [waterTarget, setWaterTarget] = useState(userProfile.waterSettings.dailyTargetMl);
  const [screenOffTime, setScreenOffTime] = useState(userProfile.digitalSettings.screenOffTime);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importError, setImportError] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name: name.trim() || "Пользователь",
      routine: {
        ...userProfile.routine,
        wakeTime,
        sleepTime,
        workOrSchoolStart: workStart,
        workOrSchoolEnd: workEnd,
        commuteMinutes,
      },
      waterSettings: {
        ...userProfile.waterSettings,
        dailyTargetMl: waterTarget,
      },
      digitalSettings: {
        ...userProfile.digitalSettings,
        screenOffTime,
      },
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Export JSON file download
  const handleExportJSON = async () => {
    const data = await exportData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `life_os_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON file upload
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setImportError("");
        const parsed = JSON.parse(event.target?.result as string);
        await importBackup(parsed);
        alert("Резервная копия успешно восстановлена!");
      } catch (err) {
        setImportError("Ошибка импорта: некорректный формат JSON резервной копии.");
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = async () => {
    await resetAllData();
    setResetModalOpen(false);
    alert("Данные сброшены к начальным настройкам.");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-surface-border">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <span>Настройки системы</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Управление расписанием, целями, уведомлениями и резервным копированием данных
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-primary/10 border border-primary/30 text-primary text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Настройки успешно сохранены и применены к расписанию!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6 text-xs">
        {/* Profile Card */}
        <div className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Профиль и предпочтения</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Имя или псевдоним</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Часовой пояс</label>
              <input
                type="text"
                disabled
                value={userProfile.timezone}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-500 text-xs cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Schedule Routine Card */}
        <div className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Базовый распорядок дня</span>
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Время подъема</label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Время сна</label>
              <input
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Начало занятий / работы</label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Окончание занятий / работы</label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">
              Дорога и буфер перемещений ({commuteMinutes} мин)
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={commuteMinutes}
              onChange={(e) => setCommuteMinutes(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </div>

        {/* Goals & Limits */}
        <div className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-100">Цели и лимиты</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1 font-medium">Дневная цель воды (мл)</label>
              <input
                type="number"
                min="800"
                max="4500"
                step="100"
                value={waterTarget}
                onChange={(e) => setWaterTarget(Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-medium">
                Начало цифрового отдыха без экрана
              </label>
              <input
                type="time"
                value={screenOffTime}
                onChange={(e) => setScreenOffTime(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs shadow-md shadow-primary/20 transition-all"
            >
              Сохранить параметры
            </button>
          </div>
        </div>
      </form>

      {/* Notifications Configuration Card */}
      <div className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span>Уведомления и режим тишины</span>
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          В ночное время (22:30 – 07:00) активен режим тишины. Вы можете запросить системные браузерные Push-уведомления.
        </p>
        <button
          onClick={async () => {
            const res = await requestBrowserPushPermission();
            alert(`Статус разрешений Web Push: ${res}`);
          }}
          className="px-4 py-2 rounded-xl bg-surface-subtle hover:bg-surface-border border border-surface-border text-xs text-zinc-200 transition-colors"
        >
          Проверить / запросить системный Web Push
        </button>
      </div>

      {/* Data Backup & Reset Card */}
      <div className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span>Управление данными (Резервное копирование и сброс)</span>
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Все ваши привычки, тренировки, расписание и журнал хранятся локально в IndexedDB на вашем устройстве. Вы можете экспортировать или импортировать полный JSON-файл в любое время.
        </p>

        {importError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl">
            {importError}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-border text-zinc-200 border border-surface-border text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-primary" />
            <span>Экспорт данных (JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle hover:bg-surface-border text-zinc-200 border border-surface-border text-xs font-semibold cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Импорт из файла (JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Сбросить данные к начальным</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Reset */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121215] border border-surface-border rounded-2xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Подтверждение сброса данных</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Вы уверены, что хотите сбросить базу данных? Все созданные задачи, записи сна, тренировок и привычек будут удалены и возвращены к исходным шаблонам.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-border">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-subtle text-zinc-300 text-xs hover:bg-surface-border"
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-lg bg-rose-500 text-white font-semibold text-xs hover:bg-rose-600"
              >
                Сбросить всё
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
