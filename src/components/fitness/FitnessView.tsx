"use client";

import React, { useState, useEffect } from "react";
import { useLifeOS } from "@/context/LifeOSContext";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Circle,
  Plus,
  Clock,
  Timer,
  RotateCcw,
  Sparkles,
  Flame,
} from "lucide-react";
import type {
  WorkoutExercise,
  WorkoutSet,
  WorkoutSession,
  WorkoutSessionExercise,
} from "@/types";

export function FitnessView() {
  const {
    workoutExercises,
    workoutSessions,
    saveWorkoutSession,
    todayDate,
    userProfile,
  } = useLifeOS();

  // Active workout draft state
  const [sessionTitle, setSessionTitle] = useState("Домашняя тренировка");
  const [activeExercises, setActiveExercises] = useState<WorkoutSessionExercise[]>(() => {
    // Pick default 3 exercises
    return workoutExercises.slice(0, 3).map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      type: ex.type,
      sets: Array.from({ length: ex.defaultSets || 3 }).map((_, i) => ({
        setNumber: i + 1,
        plannedReps: ex.defaultReps || 12,
        actualReps: ex.defaultReps || 12,
        plannedWeightKg: ex.defaultWeightKg || 0,
        actualWeightKg: ex.defaultWeightKg || 0,
        durationSeconds: ex.defaultDurationSeconds || 60,
        completed: false,
      })),
    }));
  });

  const [feelingScore, setFeelingScore] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [notes, setNotes] = useState("");
  const [isResting, setIsResting] = useState(false);
  const [restSecondsLeft, setRestSecondsLeft] = useState(60);
  const [sessionSavedSuccess, setSessionSavedSuccess] = useState(false);

  // Rest Timer Interval
  useEffect(() => {
    if (!isResting) return;
    const interval = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsResting(false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting]);

  const startRestTimer = (seconds = 60) => {
    setRestSecondsLeft(seconds);
    setIsResting(true);
  };

  const toggleSetComplete = (exIdx: number, setIdx: number) => {
    const updated = [...activeExercises];
    const targetSet = updated[exIdx].sets[setIdx];
    const wasCompleted = targetSet.completed;
    targetSet.completed = !wasCompleted;

    setActiveExercises(updated);

    // If just completed a set, trigger rest timer!
    if (!wasCompleted) {
      startRestTimer(60);
    }
  };

  const updateSetActualReps = (exIdx: number, setIdx: number, val: number) => {
    const updated = [...activeExercises];
    updated[exIdx].sets[setIdx].actualReps = Math.max(0, val);
    setActiveExercises(updated);
  };

  const updateSetActualWeight = (exIdx: number, setIdx: number, val: number) => {
    const updated = [...activeExercises];
    updated[exIdx].sets[setIdx].actualWeightKg = Math.max(0, val);
    setActiveExercises(updated);
  };

  const handleFinishWorkout = async () => {
    await saveWorkoutSession({
      title: sessionTitle,
      date: todayDate,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      exercises: activeExercises,
      completed: true,
      feelingScore,
      notes: notes.trim() || undefined,
      restTimerSeconds: 60,
    });
    setSessionSavedSuccess(true);
    setTimeout(() => setSessionSavedSuccess(false), 4000);
  };

  const dayOfWeek = new Date(todayDate + "T12:00:00").getDay();
  const isRestDay = userProfile.routine.restDays.includes(dayOfWeek as any);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
            <span>Тренировки и активность</span>
          </h1>
          <p className="text-xs text-zinc-400">
            Фактический объем упражнений. Тренировки с учетом восстановления, без боли и чувства вины.
          </p>
        </div>

        {isRestDay && (
          <div className="px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium self-start sm:self-auto">
            Сегодня плановый день отдыха и восстановления 🛌
          </div>
        )}
      </div>

      {/* Rest Timer Float Banner if active */}
      {isResting && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Timer className="w-4 h-4" />
            <span>Отдых между подходами:</span>
            <span className="font-mono text-base">{restSecondsLeft} сек</span>
          </div>
          <button
            onClick={() => setIsResting(false)}
            className="px-2.5 py-1 rounded-lg bg-surface-subtle text-zinc-300 border border-surface-border text-[11px]"
          >
            Пропустить
          </button>
        </div>
      )}

      {sessionSavedSuccess && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Тренировка успешно сохранена в историю! Отличная работа.</span>
        </div>
      )}

      {/* Active Workout Session Builder */}
      <section className="bg-[#121215] border border-surface-border rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              className="bg-transparent font-semibold text-sm sm:text-base text-zinc-100 border-b border-dashed border-zinc-600 focus:outline-none focus:border-primary pb-0.5"
            />
            <span className="block text-[11px] text-zinc-500 mt-1">
              Дата: {todayDate} • Введите повторения и отметьте подходы
            </span>
          </div>

          <button
            onClick={handleFinishWorkout}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black font-semibold text-xs shadow-lg shadow-primary/20 transition-all self-start sm:self-auto"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Завершить тренировку</span>
          </button>
        </div>

        {/* Exercises & Sets */}
        <div className="space-y-4">
          {activeExercises.map((ex, exIdx) => (
            <div
              key={ex.exerciseId}
              className="p-4 rounded-xl bg-surface-subtle border border-surface-border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-zinc-100">{ex.exerciseName}</span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {ex.sets.filter((s) => s.completed).length} / {ex.sets.length} подходов
                </span>
              </div>

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 text-[10px] text-zinc-500 uppercase font-mono px-2">
                  <div className="col-span-2">Сет</div>
                  <div className="col-span-4">Повторения / Сек</div>
                  <div className="col-span-4">Вес (кг)</div>
                  <div className="col-span-2 text-right">Готово</div>
                </div>

                {ex.sets.map((set, setIdx) => (
                  <div
                    key={set.setNumber}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-lg text-xs transition-colors ${
                      set.completed
                        ? "bg-primary/5 border border-primary/20 text-zinc-300"
                        : "bg-surface-border/40 border border-surface-border text-zinc-200"
                    }`}
                  >
                    <div className="col-span-2 font-mono font-semibold text-zinc-400 pl-1">
                      #{set.setNumber}
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        min="0"
                        value={set.actualReps ?? 10}
                        onChange={(e) =>
                          updateSetActualReps(exIdx, setIdx, Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 bg-surface-subtle border border-surface-border rounded text-center text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="col-span-4">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.actualWeightKg ?? 0}
                        onChange={(e) =>
                          updateSetActualWeight(exIdx, setIdx, Number(e.target.value))
                        }
                        className="w-16 px-2 py-1 bg-surface-subtle border border-surface-border rounded text-center text-xs font-mono focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="col-span-2 flex justify-end pr-1">
                      <button
                        onClick={() => toggleSetComplete(exIdx, setIdx)}
                        className="text-zinc-500 hover:text-primary transition-colors"
                      >
                        {set.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Self-Rating & Notes */}
        <div className="pt-3 border-t border-surface-border grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Самочувствие (1 - 5)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFeelingScore(s as any)}
                  className={`w-9 h-9 rounded-xl font-bold font-mono text-xs transition-all ${
                    feelingScore === s
                      ? "bg-primary text-black"
                      : "bg-surface-subtle text-zinc-400 border border-surface-border hover:bg-surface-border"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 font-medium">Заметки к тренировке</label>
            <input
              type="text"
              placeholder="Как прошла разминка, комфортный темп"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </section>

      {/* Workout History */}
      <section className="bg-surface-subtle border border-surface-border rounded-2xl p-4 sm:p-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Flame className="w-4 h-4 text-emerald-400" />
          <span>История выполненных тренировок</span>
        </h2>

        {workoutSessions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            Тренировки еще не записаны. Завершите первую сессию выше.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
            {workoutSessions.slice(-6).reverse().map((ws) => (
              <div
                key={ws.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-border/40 border border-surface-border text-xs"
              >
                <div>
                  <span className="font-semibold text-zinc-200">{ws.title}</span>
                  <span className="block text-[10px] text-zinc-500 mt-0.5 font-mono">
                    {ws.date} • Упражнений: {ws.exercises.length} • Оценка: {ws.feelingScore || 4}/5
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Выполнено ✓</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
