"use client";

import React, { useState } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  PhoneOff,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Info,
  Calendar,
  AlertCircle,
} from "lucide-react";

export function DigitalDisciplineView() {
  const {
    userProfile,
    updateUserProfile,
    digitalLogs,
    todayDate,
    logDigitalChecklist,
  } = useLifeOS();

  const currentLog = digitalLogs.find((d) => d.date === todayDate);

  const [screenOffTime, setScreenOffTime] = useState(
    userProfile.digitalSettings.screenOffTime || "22:00"
  );
  const [checklist, setChecklist] = useState({
    workFinished: currentLog?.checklistCompleted.workFinished || false,
    phonePutAway: currentLog?.checklistCompleted.phonePutAway || false,
    readyForTomorrow: currentLog?.checklistCompleted.readyForTomorrow || false,
    eveningCareDone: currentLog?.checklistCompleted.eveningCareDone || false,
  });

  const toggleCheck = async (key: keyof typeof checklist) => {
    const updated = { ...checklist, [key]: !checklist[key] };
    setChecklist(updated);

    const allDone = Object.values(updated).every(Boolean);
    await logDigitalChecklist({
      checklistCompleted: updated,
      screenOffObserved: allDone,
    });
  };

  const handleUpdateScreenOff = async () => {
    await updateUserProfile({
      digitalSettings: {
        ...userProfile.digitalSettings,
        screenOffTime,
      },
    });
  };

  const dayOfWeek = new Date(todayDate + "T12:00:00").getDay();
  const isDetoxDay = dayOfWeek === userProfile.digitalSettings.detoxDayOfWeek;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-3 border-b border-surface-border">
        <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <PhoneOff className="w-5 h-5 text-rose-400" />
          <span>Цифровая дисциплина</span>
        </h1>
        <p className="text-xs text-zinc-400">
          Контроль необязательного экранного времени, вечерний цифровой отдых и разгрузочные дни.
        </p>
      </div>

      {/* Honesty Notice */}
      <div className="p-4 rounded-xl bg-surface-subtle border border-surface-border text-xs text-zinc-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-zinc-200">Ограничения браузерной платформы:</span>
          <p className="leading-relaxed">
            Веб-приложение не блокирует системные приложения смартфона. LIFE OS ориентирована на осознанность, добровольные отметки, таймеры и своевременные напоминания. Экстренная связь всегда в приоритете.
          </p>
        </div>
      </div>

      {/* Main Evening Screen-Off Card */}
      <div className="bg-[#121215] border border-surface-border rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Правило &quot;Без экрана после {userProfile.digitalSettings.screenOffTime}&quot;</span>
            </h2>
            <span className="text-[11px] text-zinc-500">
              За 45–60 минут до сна нервная система переходит в режим выработки мелатонина.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="time"
              value={screenOffTime}
              onChange={(e) => setScreenOffTime(e.target.value)}
              className="px-2.5 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-xs font-mono text-zinc-100 focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleUpdateScreenOff}
              className="px-3 py-1.5 rounded-lg bg-surface-border hover:bg-surface-border/80 text-xs font-medium text-zinc-200"
            >
              Сохранить
            </button>
          </div>
        </div>

        {/* Evening Wind-Down Checklist */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-zinc-200 block">
            Вечерний чек-лист цифрового покоя:
          </span>

          {[
            {
              key: "workFinished" as const,
              title: "Завершить рабочие и учебные дела",
              desc: "Закрыть все вкладки, перенести оставшееся на завтра",
            },
            {
              key: "phonePutAway" as const,
              title: "Убрать телефон на зарядку подальше от кровати",
              desc: "Включить беззвучный режим с доступом для избранных контактов",
            },
            {
              key: "readyForTomorrow" as const,
              title: "Подготовить одежду и вещи на завтра",
              desc: "Избавиться от утренней спешки",
            },
            {
              key: "eveningCareDone" as const,
              title: "Выполнить вечерний уход за собой",
              desc: "Умывание, чистка зубов, приглушенный теплый свет",
            },
          ].map((item) => {
            const isChecked = checklist[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleCheck(item.key)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                  isChecked
                    ? "bg-primary/10 border-primary/30 text-zinc-200"
                    : "bg-surface-subtle border-surface-border text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <div className="pr-3">
                  <span className={`text-xs font-medium block ${isChecked ? "line-through text-zinc-400" : ""}`}>
                    {item.title}
                  </span>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block">{item.desc}</span>
                </div>
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Digital Detox Day */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Еженедельный цифровой детокс (Воскресенье)
            </h2>
          </div>
          {isDetoxDay && (
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold">
              Сегодня детокс
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Один день в неделю без новостных лент и бесконечной прокрутки. Разрешено: звонки родным, навигация, книги и живое общение.
        </p>

        <button
          onClick={() =>
            logDigitalChecklist({
              isDetoxDay: true,
              detoxObserved: !currentLog?.detoxObserved,
            })
          }
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
            currentLog?.detoxObserved
              ? "bg-primary text-black border-primary"
              : "bg-surface-subtle border-surface-border text-zinc-300 hover:border-zinc-500"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{currentLog?.detoxObserved ? "Детокс соблюден ✓" : "Отметить соблюдение детокса"}</span>
        </button>
      </section>
    </div>
  );
}
