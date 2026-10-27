"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Clock,
  Target,
  GraduationCap,
  Dumbbell,
  CheckCircle2,
  PhoneOff,
  Bell,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { requestBrowserPushPermission } from "@/lib/engines/notifications";
import type { DayOfWeek } from "@/types";

export function OnboardingWizard() {
  const { userProfile, completeOnboarding } = useLifeOS();
  const [step, setStep] = useState(1);

  // Form State initialized from default profile
  const [name, setName] = useState(userProfile.name || "Пользователь");
  const [wakeTime, setWakeTime] = useState(userProfile.routine.wakeTime || "07:00");
  const [sleepTime, setSleepTime] = useState(userProfile.routine.sleepTime || "23:00");
  const [schoolStart, setSchoolStart] = useState(userProfile.routine.workOrSchoolStart || "09:00");
  const [schoolEnd, setSchoolEnd] = useState(userProfile.routine.workOrSchoolEnd || "15:00");
  const [commuteMinutes, setCommuteMinutes] = useState(userProfile.routine.commuteMinutes || 30);

  const [workoutDays, setWorkoutDays] = useState<DayOfWeek[]>(userProfile.routine.workoutDays || [1, 3, 5]);
  const [screenOffTime, setScreenOffTime] = useState(userProfile.digitalSettings.screenOffTime || "22:00");
  const [waterTarget, setWaterTarget] = useState(userProfile.waterSettings.dailyTargetMl || 2000);

  const totalSteps = 7;

  const toggleWorkoutDay = (day: DayOfWeek) => {
    setWorkoutDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Step 7: Complete
      await completeOnboarding({
        name,
        routine: {
          ...userProfile.routine,
          wakeTime,
          sleepTime,
          workOrSchoolStart: schoolStart,
          workOrSchoolEnd: schoolEnd,
          commuteMinutes,
          workoutDays,
        },
        digitalSettings: {
          ...userProfile.digitalSettings,
          screenOffTime,
        },
        waterSettings: {
          ...userProfile.waterSettings,
          dailyTargetMl: waterTarget,
        },
      });
    }
  };

  const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-[#121215] border border-surface-border rounded-2xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2 font-mono">
            <span>ШАГ {step} ИЗ {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Daily Routine */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Режим дня и бодрствования</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Задайте реалистичное время подъема и сна. LIFE OS не использует время сна для планирования и оставляет буфер для восстановления.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Ваше имя / псевдоним</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Время подъема</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Время отхода ко сну</label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Начало учебы / работы</label>
                  <input
                    type="time"
                    value={schoolStart}
                    onChange={(e) => setSchoolStart(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Окончание учебы / работы</label>
                  <input
                    type="time"
                    value={schoolEnd}
                    onChange={(e) => setSchoolEnd(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Дорога в одну сторону ({commuteMinutes} мин)
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
          </div>
        )}

        {/* Step 2: Key Focus Areas */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Target className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Основные направления системы</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Все 10 направлений LIFE OS интегрированы в единый центр: от учебы и гигиены до контроля экранного времени и сна.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-200">
                <span className="font-semibold text-primary">1. Учёба</span>
                <p className="text-[11px] text-zinc-400 mt-1">Темы, цели и фокус-таймер без перегрузки</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-200">
                <span className="font-semibold text-primary">2. Фитнес</span>
                <p className="text-[11px] text-zinc-400 mt-1">Подходы, вес и дни восстановления</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-200">
                <span className="font-semibold text-primary">3. Уход за собой</span>
                <p className="text-[11px] text-zinc-400 mt-1">Утренняя и вечерняя гигиена без спешки</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-200">
                <span className="font-semibold text-primary">4. Водный баланс</span>
                <p className="text-[11px] text-zinc-400 mt-1">Реалистичная дневная норма (2 л)</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-200">
                <span className="font-semibold text-primary">5. Питание & Сахар</span>
                <p className="text-[11px] text-zinc-400 mt-1">Осознанное уменьшение добавленного сахара</p>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-zinc-200">
                <span className="font-semibold text-primary">6. Цифровой режим</span>
                <p className="text-[11px] text-zinc-400 mt-1">Без экранов после 22:00 и воскресный детокс</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Education */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <GraduationCap className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Учёба и предметы</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Мы подготовили стартовый набор предметов с измеримыми целями (Математика, Информатика, Английский). Вы сможете добавить любые предметы в настройках.
            </p>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-zinc-200">Математика / Алгебра</span>
                  <span className="block text-[11px] text-zinc-400">Цель: 5 ч / нед • Экзамен в июне</span>
                </div>
                <span className="text-blue-400 font-mono text-[11px]">Высокий приоритет</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-zinc-200">Информатика & Разработка</span>
                  <span className="block text-[11px] text-zinc-400">Цель: 6 ч / нед • Практика алгоритмов</span>
                </div>
                <span className="text-emerald-400 font-mono text-[11px]">Высокий приоритет</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-zinc-200">Английский язык</span>
                  <span className="block text-[11px] text-zinc-400">Цель: 3 ч / нед • 15 новых слов в день</span>
                </div>
                <span className="text-purple-400 font-mono text-[11px]">Средний приоритет</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Fitness & Rest */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Dumbbell className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Спорт и дни восстановления</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Выберите комфортные дни для физических упражнений. Система автоматически оставит дни отдыха без лишней нагрузки.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-2">Дни тренировок в неделю</label>
              <div className="grid grid-cols-7 gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const isSelected = workoutDays.includes(day as DayOfWeek);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWorkoutDay(day as DayOfWeek)}
                      className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-primary text-black"
                          : "bg-surface-subtle text-zinc-400 border border-surface-border hover:bg-surface-border"
                      }`}
                    >
                      {dayNames[day]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle border border-surface-border text-xs text-zinc-300">
              <span className="font-semibold text-primary">Базовые упражнения:</span>
              <p className="text-[11px] text-zinc-400 mt-1">
                Отжимания, подтягивания, приседания, планка, работа с гантелями. Система ведет учет фактических подходов и повторений.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Habits & Self-Care */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Привычки и уход за собой</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Мы настроили спокойные утренние и вечерние ритуалы. Пропуск привычки не обнуляет прогресс и не наказывает вас.
            </p>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
                <span>Утреннее умывание и чистка зубов</span>
                <span className="text-primary font-mono text-[11px]">07:15 – 07:30</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
                <span>Вечерний уход и гигиена полости рта</span>
                <span className="text-primary font-mono text-[11px]">22:15 – 22:25</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
                <span>Микропривычка: уборка стола и проветривание</span>
                <span className="text-zinc-400 font-mono text-[11px]">5 минут</span>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border flex items-center justify-between">
                <span>Холодный душ (необязательно, при желании)</span>
                <span className="text-zinc-400 font-mono text-[11px]">Опционально</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Digital Discipline */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <PhoneOff className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Цифровой режим и сон</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Задайте время завершения работы с гаджетами вечером. Это помогает глазам и нервной системе переключиться в режим глубокого сна.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Время начала вечернего отдыха без экрана
                </label>
                <input
                  type="time"
                  value={screenOffTime}
                  onChange={(e) => setScreenOffTime(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Дневная цель чистой воды ({waterTarget} мл)
                </label>
                <input
                  type="range"
                  min="1200"
                  max="3500"
                  step="100"
                  value={waterTarget}
                  onChange={(e) => setWaterTarget(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <span className="text-[11px] text-zinc-400">
                  Безопасный комфортный ориентир: около 2000 мл (без учета чая и супов).
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Notifications & Final Plan */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Bell className="w-5 h-5" />
              <h2 className="text-lg font-semibold text-zinc-100">Уведомления и запуск</h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              LIFE OS присылает короткие и деликатные уведомления вовремя. В ночное время действует режим тишины.
            </p>

            <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border text-xs text-zinc-300 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Сейчас система автоматически сгенерирует ваш первый детерминированный план дня на основе заданного расписания.
                </span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await requestBrowserPushPermission();
                }}
                className="w-full py-2 px-3 rounded-lg bg-surface-border hover:bg-surface-border/80 text-xs font-medium text-zinc-100 flex items-center justify-center gap-2"
              >
                <Bell className="w-3.5 h-3.5 text-primary" />
                <span>Запросить разрешение браузера на push-уведомления</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-surface-border">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-subtle hover:bg-surface-border text-xs font-medium text-zinc-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Назад</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-semibold shadow-lg shadow-primary/20 transition-all"
          >
            <span>{step === totalSteps ? "Сформировать план дня" : "Далее"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
