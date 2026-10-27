"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Droplet,
  Plus,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export function WaterView() {
  const {
    todayWaterTotal,
    waterLogs,
    todayDate,
    logWater,
    undoLastWater,
    userProfile,
    updateUserProfile,
  } = useLifeOS();

  const [targetInput, setTargetInput] = useState<number>(
    userProfile.waterSettings.dailyTargetMl || 2000
  );
  const [isEditingTarget, setIsEditingTarget] = useState(false);

  const dailyTarget = userProfile.waterSettings.dailyTargetMl || 2000;
  const percent = Math.min(100, Math.round((todayWaterTotal / dailyTarget) * 100));

  const cupSizes = userProfile.waterSettings.cupSizesMl || [200, 250, 350, 500];

  const handleSaveTarget = async () => {
    await updateUserProfile({
      waterSettings: {
        ...userProfile.waterSettings,
        dailyTargetMl: Math.max(800, targetInput),
      },
    });
    setIsEditingTarget(false);
  };

  const todayLogs = waterLogs.filter((w) => w.date === todayDate);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-surface-border">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <Droplet className="w-5 h-5 text-cyan-400" />
          <span>Водный баланс (Hydration)</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Индивидуальная цель без насильного выпивания чрезмерных объемов. Жидкость также поступает с пищей.
        </p>
      </div>

      {/* Warning if excessive target */}
      {dailyTarget > 4200 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            Внимание: цель более 4.2 л может быть чрезмерной для повседневной жизни без профессиональных спортивных нагрузок в жару. Рекомендуется комфортный ориентир 1.8–2.5 л.
          </p>
        </div>
      )}

      {/* Main Water Progress Gauge */}
      <div className="bg-[#121215] border border-surface-border rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          {/* Circular SVG Progress */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-surface-subtle"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className="text-cyan-400 transition-all duration-700 ease-out"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - percent / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-3xl sm:text-4xl font-bold text-zinc-100">
              {todayWaterTotal}
            </span>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5">
              из {dailyTarget} мл
            </span>
            <span className="text-xs font-semibold text-cyan-400 font-mono mt-1">
              {percent}%
            </span>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="w-full max-w-md pt-6">
          <span className="block text-xs font-medium text-zinc-400 mb-3">
            Быстро добавить порцию воды:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {cupSizes.map((ml) => (
              <button
                key={ml}
                onClick={() => logWater(ml)}
                className="py-2.5 px-1 rounded-xl bg-surface-subtle hover:bg-cyan-500/20 border border-surface-border hover:border-cyan-500/40 text-zinc-100 font-mono font-semibold text-xs transition-all flex flex-col items-center gap-0.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>+{ml}</span>
                <span className="text-[9px] text-zinc-500 font-normal">мл</span>
              </button>
            ))}
          </div>
        </div>

        {/* Undo and Target edit */}
        <div className="flex items-center gap-3 mt-5 text-xs">
          <button
            onClick={undoLastWater}
            disabled={todayLogs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-border text-zinc-400 hover:text-zinc-200 border border-surface-border disabled:opacity-40 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Отменить последнюю</span>
          </button>

          <button
            onClick={() => setIsEditingTarget(!isEditingTarget)}
            className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-border text-zinc-300 border border-surface-border transition-colors"
          >
            {isEditingTarget ? "Закрыть цель" : "Изменить цель"}
          </button>
        </div>

        {/* Target Edit Drawer */}
        {isEditingTarget && (
          <div className="mt-4 p-4 rounded-xl bg-surface-subtle border border-surface-border max-w-xs w-full text-xs space-y-3 animate-in fade-in">
            <label className="block text-zinc-300 font-medium">Дневная норма чистой воды (мл):</label>
            <input
              type="number"
              min="800"
              max="5000"
              step="100"
              value={targetInput}
              onChange={(e) => setTargetInput(Number(e.target.value))}
              className="w-full px-3 py-2 bg-[#121215] border border-surface-border rounded-lg text-center font-mono text-zinc-100 text-sm focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={handleSaveTarget}
              className="w-full py-2 rounded-lg bg-cyan-500 text-black font-semibold text-xs"
            >
              Сохранить цель
            </button>
          </div>
        )}
      </div>

      {/* Today's History */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Записи за сегодня</span>
        </h2>

        {todayLogs.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Сегодня вода еще не добавлялась.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
            {todayLogs.slice().reverse().map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-border/40 border border-surface-border text-xs"
              >
                <span className="text-zinc-400 font-mono text-[11px]">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : "Сегодня"}
                </span>
                <span className="font-mono font-semibold text-cyan-400">
                  +{log.volumeMl} мл
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
