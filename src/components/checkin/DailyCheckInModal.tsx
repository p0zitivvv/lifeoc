"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import { X, Sparkles, BatteryCharging, Check } from "lucide-react";

export interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyCheckInModal({ isOpen, onClose }: DailyCheckInModalProps) {
  const { submitDailyCheckIn } = useLifeOS();

  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [availableHours, setAvailableHours] = useState<number>(4);
  const [hasConstraints, setHasConstraints] = useState(false);
  const [constraintNotes, setConstraintNotes] = useState("");
  const [lightenLoad, setLightenLoad] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitDailyCheckIn({
      energyLevel,
      availableFreeHours: availableHours,
      hasSpecialConstraints: hasConstraints,
      constraintNotes: hasConstraints ? constraintNotes : undefined,
      lightenLoadRequested: lightenLoad,
    });
    onClose();
  };

  const energyLabels = [
    { value: 1, label: "Очень низкий", desc: "Усталость, нужен щадящий режим" },
    { value: 2, label: "Пониженный", desc: "Тяжело концентрироваться" },
    { value: 3, label: "Нормальный", desc: "Рабочее спокойное состояние" },
    { value: 4, label: "Бодрый", desc: "Готов к активной учебе и спорту" },
    { value: 5, label: "Максимум энергии", desc: "Отличное самочувствие" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#121215] border border-surface-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-semibold text-sm text-zinc-100">Дневной чек-ин (5 секунд)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Energy Level */}
          <div>
            <label className="block font-medium text-zinc-300 mb-2">
              Как вы себя чувствуете прямо сейчас?
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {energyLabels.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setEnergyLevel(item.value as any);
                    if (item.value <= 2) {
                      setLightenLoad(true);
                    }
                  }}
                  className={`py-2.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                    energyLevel === item.value
                      ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                      : "bg-surface-subtle text-zinc-300 border border-surface-border hover:bg-surface-border"
                  }`}
                >
                  <span className="text-base mb-0.5">{item.value}</span>
                  <span className="text-[9px] text-center leading-tight">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Available Free Time */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1">
              Сколько свободного времени у вас сегодня? ({availableHours} ч)
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="0.5"
              value={availableHours}
              onChange={(e) => setAvailableHours(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          {/* Lighten Load Toggle */}
          <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={lightenLoad}
                onChange={(e) => setLightenLoad(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="font-semibold text-zinc-200">
                Снизить плановую нагрузку на сегодня
              </span>
            </label>
            <p className="text-[11px] text-zinc-400 pl-6 leading-relaxed">
              Если вы устали или чувствуете недомогание, система сократит длительность тренировки и оставит только ключевые задачи.
            </p>
          </div>

          {/* Special Constraints Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={hasConstraints}
                onChange={(e) => setHasConstraints(e.target.checked)}
                className="w-4 h-4 accent-primary rounded"
              />
              <span className="text-zinc-300">Есть непредвиденные обстоятельства или ограничения</span>
            </label>
            {hasConstraints && (
              <input
                type="text"
                placeholder="Например: визит к врачу в 17:00 или внеплановый выезд"
                value={constraintNotes}
                onChange={(e) => setConstraintNotes(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-zinc-100 placeholder-zinc-500 text-xs focus:outline-none focus:border-primary"
              />
            )}
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-surface-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-surface-subtle text-zinc-400 hover:text-zinc-200 text-xs"
            >
              Пропустить
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Применить</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
