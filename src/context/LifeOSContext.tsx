"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { getDb } from "@/lib/storage/db";
import {
  initializeDatabase,
  exportAllData,
  importData,
  resetDatabase,
  type ExportDataPayload,
} from "@/lib/storage/syncAdapter";
import { generateDailyPlan, recalculateDay } from "@/lib/engines/scheduler";
import { computeAnalyticsSummary } from "@/lib/engines/analytics";
import {
  createNotification,
  shouldDeliverNotification,
  triggerBrowserNotification,
} from "@/lib/engines/notifications";
import type {
  UserProfile,
  Task,
  Habit,
  HabitLog,
  Subject,
  StudyGoal,
  StudySession,
  WorkoutExercise,
  WorkoutSession,
  Meal,
  WaterLog,
  DigitalDisciplineLog,
  SleepLog,
  DailyCheckIn,
  DailyPlan,
  NotificationItem,
  FocusTimerState,
  AnalyticsSummary,
} from "@/types";
import { DEFAULT_USER_PROFILE } from "@/lib/storage/initialData";

export interface LifeOSContextValue {
  isInitialized: boolean;
  todayDate: string;
  userProfile: UserProfile;
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  subjects: Subject[];
  studyGoals: StudyGoal[];
  studySessions: StudySession[];
  workoutExercises: WorkoutExercise[];
  workoutSessions: WorkoutSession[];
  meals: Meal[];
  waterLogs: WaterLog[];
  digitalLogs: DigitalDisciplineLog[];
  sleepLogs: SleepLog[];
  dailyCheckins: DailyCheckIn[];
  todayPlan: DailyPlan | null;
  notifications: NotificationItem[];
  focusTimer: FocusTimerState;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Onboarding & Profile
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;

  // Daily Check-in
  todayCheckin: DailyCheckIn | null;
  submitDailyCheckIn: (data: Omit<DailyCheckIn, "id" | "date" | "timestamp">) => Promise<void>;

  // Auto-Scheduler
  recalculateCurrentDay: () => Promise<void>;
  updateSlotStatus: (slotId: string, status: "completed" | "skipped" | "scheduled") => Promise<void>;

  // Tasks CRUD
  createTask: (task: Omit<Task, "id" | "createdAt" | "updatedAt">) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string, newStatus?: "completed" | "scheduled" | "skipped") => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;

  // Habits CRUD & 1-tap logging
  createHabit: (habit: Omit<Habit, "id" | "createdAt">) => Promise<Habit>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  archiveHabit: (id: string, isArchived: boolean) => Promise<void>;
  toggleHabitForDate: (habitId: string, date?: string) => Promise<void>;
  logHabitValue: (habitId: string, value: number, date?: string) => Promise<void>;

  // Hydration
  todayWaterTotal: number;
  logWater: (ml: number) => Promise<void>;
  undoLastWater: () => Promise<void>;

  // Focus Timer
  startFocusTimer: (subjectId?: string, taskId?: string, topic?: string) => void;
  pauseFocusTimer: () => void;
  resumeFocusTimer: () => void;
  resetFocusTimer: () => void;
  finishFocusTimer: () => Promise<void>;

  // Workouts
  createWorkoutExercise: (ex: Omit<WorkoutExercise, "id">) => Promise<WorkoutExercise>;
  saveWorkoutSession: (session: Omit<WorkoutSession, "id">) => Promise<WorkoutSession>;

  // Nutrition
  logMeal: (meal: Omit<Meal, "id">) => Promise<Meal>;
  deleteMeal: (id: string) => Promise<void>;

  // Digital discipline & Recovery
  logDigitalChecklist: (data: Partial<DigitalDisciplineLog>) => Promise<void>;
  logSleep: (data: Omit<SleepLog, "id" | "date">, date?: string) => Promise<void>;

  // Notifications
  unreadNotifCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  sendSystemNotification: (title: string, message: string, category?: any) => Promise<void>;

  // Data management
  exportData: () => Promise<ExportDataPayload>;
  importBackup: (data: ExportDataPayload) => Promise<boolean>;
  resetAllData: () => Promise<void>;

  // Analytics helper
  getAnalytics: (periodDays: 7 | 30 | 90) => AnalyticsSummary;
}

const LifeOSContext = createContext<LifeOSContextValue | null>(null);

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function LifeOSProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [todayDate, setTodayDate] = useState<string>(getTodayString());
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // State caches
  const [userProfile, setUserProfile] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
  const [digitalLogs, setDigitalLogs] = useState<DigitalDisciplineLog[]>([]);
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [dailyCheckins, setDailyCheckins] = useState<DailyCheckIn[]>([]);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Focus Timer state (persisted in localStorage for page refresh survival!)
  const [focusTimer, setFocusTimer] = useState<FocusTimerState>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lifeos_focus_timer");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      isRunning: false,
      isPaused: false,
      mode: "work",
      workDurationMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      cyclesBeforeLongBreak: 4,
      currentCycle: 1,
      accumulatedSeconds: 0,
      targetSeconds: 25 * 60,
    };
  });

  // Sync timer state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("lifeos_focus_timer", JSON.stringify(focusTimer));
    }
  }, [focusTimer]);

  // Focus Timer Interval engine using real timestamps
  useEffect(() => {
    if (!focusTimer.isRunning || focusTimer.isPaused) return;

    const interval = setInterval(() => {
      setFocusTimer((prev) => {
        if (!prev.isRunning || prev.isPaused) return prev;
        const now = Date.now();
        const start = prev.startTimestamp || now;
        const elapsedSinceStart = Math.floor((now - start) / 1000);
        const total = prev.accumulatedSeconds + elapsedSinceStart;

        if (total >= prev.targetSeconds) {
          // Timer finished current phase
          return {
            ...prev,
            isRunning: false,
            isPaused: false,
            accumulatedSeconds: prev.targetSeconds,
            startTimestamp: undefined,
          };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [focusTimer.isRunning, focusTimer.isPaused]);

  // Load all initial data from IndexedDB
  const refreshAll = useCallback(async () => {
    if (typeof window === "undefined") return;
    const db = getDb();

    await initializeDatabase();

    const [
      pList,
      tList,
      hList,
      hlList,
      sList,
      sgList,
      ssList,
      weList,
      wsList,
      mList,
      wList,
      dList,
      slList,
      dcList,
      dpList,
      nList,
    ] = await Promise.all([
      db.userProfile.toArray(),
      db.tasks.toArray(),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.subjects.toArray(),
      db.studyGoals.toArray(),
      db.studySessions.toArray(),
      db.workoutExercises.toArray(),
      db.workoutSessions.toArray(),
      db.meals.toArray(),
      db.waterLogs.toArray(),
      db.digitalLogs.toArray(),
      db.sleepLogs.toArray(),
      db.dailyCheckins.toArray(),
      db.dailyPlans.toArray(),
      db.notifications.toArray(),
    ]);

    const activeProfile = pList[0] || DEFAULT_USER_PROFILE;
    setUserProfile(activeProfile);
    setTasks(tList);
    setHabits(hList);
    setHabitLogs(hlList);
    setSubjects(sList);
    setStudyGoals(sgList);
    setStudySessions(ssList);
    setWorkoutExercises(weList);
    setWorkoutSessions(wsList);
    setMeals(mList);
    setWaterLogs(wList);
    setDigitalLogs(dList);
    setSleepLogs(slList);
    setDailyCheckins(dcList);
    setNotifications(nList);

    const curToday = getTodayString();
    setTodayDate(curToday);

    // Find or generate today's plan
    let plan = dpList.find((p) => p.date === curToday);
    if (!plan) {
      plan = generateDailyPlan({
        date: curToday,
        routine: activeProfile.routine,
        tasks: tList,
        habits: hList,
      });
      await db.dailyPlans.put(plan);
    }
    setTodayPlan(plan);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Today check-in
  const todayCheckin = useMemo(() => {
    return dailyCheckins.find((c) => c.date === todayDate) || null;
  }, [dailyCheckins, todayDate]);

  // Today's water total
  const todayWaterTotal = useMemo(() => {
    return waterLogs
      .filter((w) => w.date === todayDate)
      .reduce((sum, w) => sum + w.volumeMl, 0);
  }, [waterLogs, todayDate]);

  // Unread notifications
  const unreadNotifCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Profile update
  const updateUserProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      const db = getDb();
      const updated = { ...userProfile, ...updates, updatedAt: new Date().toISOString() };
      await db.userProfile.put(updated);
      setUserProfile(updated);
    },
    [userProfile]
  );

  const completeOnboarding = useCallback(
    async (data: Partial<UserProfile>) => {
      const db = getDb();
      const updated: UserProfile = {
        ...userProfile,
        ...data,
        onboardingCompleted: true,
        updatedAt: new Date().toISOString(),
      };
      await db.userProfile.put(updated);
      setUserProfile(updated);

      // Immediately generate first fresh plan with user routine
      const newPlan = generateDailyPlan({
        date: todayDate,
        routine: updated.routine,
        tasks,
        habits,
      });
      await db.dailyPlans.put(newPlan);
      setTodayPlan(newPlan);
    },
    [userProfile, todayDate, tasks, habits]
  );

  // Daily Check-In
  const submitDailyCheckIn = useCallback(
    async (data: Omit<DailyCheckIn, "id" | "date" | "timestamp">) => {
      const db = getDb();
      const item: DailyCheckIn = {
        id: "checkin_" + todayDate,
        date: todayDate,
        timestamp: new Date().toISOString(),
        ...data,
      };
      await db.dailyCheckins.put(item);
      setDailyCheckins((prev) => [...prev.filter((c) => c.date !== todayDate), item]);

      // If user requested lighter load, recalculate day with adjusted expectations
      if (todayPlan) {
        const adjustedPlan = generateDailyPlan({
          date: todayDate,
          routine: userProfile.routine,
          tasks,
          habits,
          lightenLoadRequested: data.lightenLoadRequested,
          existingPlan: todayPlan,
        });
        await db.dailyPlans.put(adjustedPlan);
        setTodayPlan(adjustedPlan);
      }
    },
    [todayDate, todayPlan, userProfile.routine, tasks, habits]
  );

  // Recalculate Day
  const recalculateCurrentDay = useCallback(async () => {
    if (!todayPlan) return;
    const db = getDb();
    const now = new Date();
    const currentTimeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newPlan = recalculateDay(todayPlan, currentTimeStr, userProfile.routine);
    await db.dailyPlans.put(newPlan);
    setTodayPlan(newPlan);
  }, [todayPlan, userProfile.routine]);

  // Update Slot Status in Today's Plan
  const updateSlotStatus = useCallback(
    async (slotId: string, status: "completed" | "skipped" | "scheduled") => {
      if (!todayPlan) return;
      const db = getDb();

      const updatedSlots = todayPlan.slots.map((s) => {
        if (s.id === slotId) {
          return {
            ...s,
            isCompleted: status === "completed",
            isSkipped: status === "skipped",
          };
        }
        return s;
      });

      const updatedPlan: DailyPlan = {
        ...todayPlan,
        slots: updatedSlots,
      };
      await db.dailyPlans.put(updatedPlan);
      setTodayPlan(updatedPlan);

      // If slot had a linked task or habit, sync its state too!
      const targetSlot = todayPlan.slots.find((s) => s.id === slotId);
      if (targetSlot?.referenceId) {
        if (targetSlot.type === "task" || targetSlot.type === "study") {
          const t = tasks.find((item) => item.id === targetSlot.referenceId);
          if (t) {
            await db.tasks.update(t.id, {
              status,
              completedAt: status === "completed" ? new Date().toISOString() : undefined,
            });
            setTasks((prev) =>
              prev.map((item) => (item.id === t.id ? { ...item, status } : item))
            );
          }
        } else if (targetSlot.type === "habit") {
          const isDone = status === "completed";
          const logId = `hl_${targetSlot.referenceId}_${todayDate}`;
          const habitLogItem: HabitLog = {
            id: logId,
            habitId: targetSlot.referenceId,
            date: todayDate,
            value: isDone ? 1 : 0,
            completed: isDone,
            completedAt: isDone ? new Date().toISOString() : undefined,
          };
          await db.habitLogs.put(habitLogItem);
          setHabitLogs((prev) => [
            ...prev.filter((l) => l.habitId !== targetSlot.referenceId || l.date !== todayDate),
            habitLogItem,
          ]);
        }
      }
    },
    [todayPlan, todayDate, tasks]
  );

  // Tasks CRUD
  const createTask = useCallback(
    async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task> => {
      const db = getDb();
      const newTask: Task = {
        ...taskData,
        id: "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.tasks.add(newTask);
      setTasks((prev) => [...prev, newTask]);

      // If task is for today, refresh or regenerate today plan
      if (newTask.date === todayDate) {
        const newPlan = generateDailyPlan({
          date: todayDate,
          routine: userProfile.routine,
          tasks: [...tasks, newTask],
          habits,
          existingPlan: todayPlan || undefined,
        });
        await db.dailyPlans.put(newPlan);
        setTodayPlan(newPlan);
      }

      return newTask;
    },
    [todayDate, userProfile.routine, tasks, habits, todayPlan]
  );

  const updateTask = useCallback(
    async (id: string, updates: Partial<Task>) => {
      const db = getDb();
      await db.tasks.update(id, { ...updates, updatedAt: new Date().toISOString() });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
      );
    },
    []
  );

  const deleteTask = useCallback(
    async (id: string) => {
      const db = getDb();
      await db.tasks.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (todayPlan) {
        const updatedSlots = todayPlan.slots.filter((s) => s.referenceId !== id);
        const updatedPlan = { ...todayPlan, slots: updatedSlots };
        await db.dailyPlans.put(updatedPlan);
        setTodayPlan(updatedPlan);
      }
    },
    [todayPlan]
  );

  const toggleTaskStatus = useCallback(
    async (id: string, newStatus?: "completed" | "scheduled" | "skipped") => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const targetStatus =
        newStatus || (task.status === "completed" ? "scheduled" : "completed");
      const db = getDb();

      await db.tasks.update(id, {
        status: targetStatus,
        completedAt: targetStatus === "completed" ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: targetStatus,
                completedAt: targetStatus === "completed" ? new Date().toISOString() : undefined,
              }
            : t
        )
      );

      // Sync with today's plan
      if (todayPlan) {
        const updatedSlots = todayPlan.slots.map((s) => {
          if (s.referenceId === id) {
            return {
              ...s,
              isCompleted: targetStatus === "completed",
              isSkipped: targetStatus === "skipped",
            };
          }
          return s;
        });
        const updatedPlan = { ...todayPlan, slots: updatedSlots };
        await db.dailyPlans.put(updatedPlan);
        setTodayPlan(updatedPlan);
      }
    },
    [tasks, todayPlan]
  );

  const toggleSubtask = useCallback(
    async (taskId: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const db = getDb();

      const updatedSubtasks = task.subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      );
      await db.tasks.update(taskId, { subtasks: updatedSubtasks, updatedAt: new Date().toISOString() });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, subtasks: updatedSubtasks } : t))
      );
    },
    [tasks]
  );

  // Habits CRUD & 1-tap logging
  const createHabit = useCallback(
    async (habitData: Omit<Habit, "id" | "createdAt">): Promise<Habit> => {
      const db = getDb();
      const newHabit: Habit = {
        ...habitData,
        id: "h_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
        createdAt: new Date().toISOString(),
      };
      await db.habits.add(newHabit);
      setHabits((prev) => [...prev, newHabit]);
      return newHabit;
    },
    []
  );

  const updateHabit = useCallback(
    async (id: string, updates: Partial<Habit>) => {
      const db = getDb();
      await db.habits.update(id, updates);
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)));
    },
    []
  );

  const archiveHabit = useCallback(
    async (id: string, isArchived: boolean) => {
      const db = getDb();
      await db.habits.update(id, { isArchived });
      setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, isArchived } : h)));
    },
    []
  );

  const toggleHabitForDate = useCallback(
    async (habitId: string, date = todayDate) => {
      const db = getDb();
      const existing = habitLogs.find((l) => l.habitId === habitId && l.date === date);
      const isNowCompleted = !existing?.completed;

      const log: HabitLog = {
        id: existing?.id || `hl_${habitId}_${date}`,
        habitId,
        date,
        value: isNowCompleted ? 1 : 0,
        completed: isNowCompleted,
        completedAt: isNowCompleted ? new Date().toISOString() : undefined,
      };

      await db.habitLogs.put(log);
      setHabitLogs((prev) => [...prev.filter((l) => l.habitId !== habitId || l.date !== date), log]);

      // If toggled for today, update slot in todayPlan
      if (date === todayDate && todayPlan) {
        const updatedSlots = todayPlan.slots.map((s) => {
          if (s.referenceId === habitId) {
            return { ...s, isCompleted: isNowCompleted };
          }
          return s;
        });
        const updatedPlan = { ...todayPlan, slots: updatedSlots };
        await db.dailyPlans.put(updatedPlan);
        setTodayPlan(updatedPlan);
      }
    },
    [habitLogs, todayDate, todayPlan]
  );

  const logHabitValue = useCallback(
    async (habitId: string, value: number, date = todayDate) => {
      const habit = habits.find((h) => h.id === habitId);
      const target = habit?.targetValue || 1;
      const completed = value >= target;

      const db = getDb();
      const existing = habitLogs.find((l) => l.habitId === habitId && l.date === date);
      const log: HabitLog = {
        id: existing?.id || `hl_${habitId}_${date}`,
        habitId,
        date,
        value,
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      };

      await db.habitLogs.put(log);
      setHabitLogs((prev) => [...prev.filter((l) => l.habitId !== habitId || l.date !== date), log]);
    },
    [habits, habitLogs, todayDate]
  );

  // Hydration
  const logWater = useCallback(
    async (ml: number) => {
      const db = getDb();
      const entry: WaterLog = {
        id: "w_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
        date: todayDate,
        timestamp: new Date().toISOString(),
        volumeMl: ml,
      };
      await db.waterLogs.add(entry);
      setWaterLogs((prev) => [...prev, entry]);

      // Also update water habit log if present
      const waterHabit = habits.find((h) => h.category === "hydration");
      if (waterHabit) {
        const newTotal = todayWaterTotal + ml;
        await logHabitValue(waterHabit.id, newTotal, todayDate);
      }
    },
    [todayDate, habits, todayWaterTotal, logHabitValue]
  );

  const undoLastWater = useCallback(async () => {
    const todayLogs = waterLogs.filter((w) => w.date === todayDate);
    if (todayLogs.length === 0) return;
    const last = todayLogs[todayLogs.length - 1];
    const db = getDb();
    await db.waterLogs.delete(last.id);
    setWaterLogs((prev) => prev.filter((w) => w.id !== last.id));

    const waterHabit = habits.find((h) => h.category === "hydration");
    if (waterHabit) {
      const newTotal = Math.max(0, todayWaterTotal - last.volumeMl);
      await logHabitValue(waterHabit.id, newTotal, todayDate);
    }
  }, [waterLogs, todayDate, habits, todayWaterTotal, logHabitValue]);

  // Focus Timer
  const startFocusTimer = useCallback(
    (subjectId?: string, taskId?: string, topic?: string) => {
      setFocusTimer((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        selectedSubjectId: subjectId || prev.selectedSubjectId,
        selectedTaskId: taskId || prev.selectedTaskId,
        selectedTopic: topic || prev.selectedTopic,
        startTimestamp: Date.now(),
      }));
    },
    []
  );

  const pauseFocusTimer = useCallback(() => {
    setFocusTimer((prev) => {
      if (!prev.isRunning || prev.isPaused) return prev;
      const now = Date.now();
      const elapsed = prev.startTimestamp ? Math.floor((now - prev.startTimestamp) / 1000) : 0;
      return {
        ...prev,
        isPaused: true,
        accumulatedSeconds: prev.accumulatedSeconds + elapsed,
        startTimestamp: undefined,
      };
    });
  }, []);

  const resumeFocusTimer = useCallback(() => {
    setFocusTimer((prev) => {
      if (!prev.isRunning || !prev.isPaused) return prev;
      return {
        ...prev,
        isPaused: false,
        startTimestamp: Date.now(),
      };
    });
  }, []);

  const resetFocusTimer = useCallback(() => {
    setFocusTimer((prev) => ({
      ...prev,
      isRunning: false,
      isPaused: false,
      accumulatedSeconds: 0,
      startTimestamp: undefined,
    }));
  }, []);

  const finishFocusTimer = useCallback(async () => {
    const now = Date.now();
    const elapsed =
      focusTimer.isRunning && !focusTimer.isPaused && focusTimer.startTimestamp
        ? Math.floor((now - focusTimer.startTimestamp) / 1000)
        : 0;
    const totalActualSeconds = focusTimer.accumulatedSeconds + elapsed;

    if (totalActualSeconds > 0 && focusTimer.selectedSubjectId) {
      const db = getDb();
      const session: StudySession = {
        id: "ss_" + Date.now(),
        subjectId: focusTimer.selectedSubjectId,
        taskId: focusTimer.selectedTaskId,
        topic: focusTimer.selectedTopic,
        startTime: new Date(now - totalActualSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        durationSeconds: totalActualSeconds,
        plannedDurationSeconds: focusTimer.workDurationMinutes * 60,
        breakDurationSeconds: focusTimer.shortBreakMinutes * 60,
        completed: totalActualSeconds >= focusTimer.workDurationMinutes * 60 * 0.7,
        date: todayDate,
      };

      await db.studySessions.add(session);
      setStudySessions((prev) => [...prev, session]);
    }

    resetFocusTimer();
  }, [focusTimer, todayDate, resetFocusTimer]);

  // Fitness
  const createWorkoutExercise = useCallback(
    async (ex: Omit<WorkoutExercise, "id">): Promise<WorkoutExercise> => {
      const db = getDb();
      const newEx: WorkoutExercise = {
        ...ex,
        id: "ex_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      };
      await db.workoutExercises.add(newEx);
      setWorkoutExercises((prev) => [...prev, newEx]);
      return newEx;
    },
    []
  );

  const saveWorkoutSession = useCallback(
    async (sessionData: Omit<WorkoutSession, "id">): Promise<WorkoutSession> => {
      const db = getDb();
      const newSession: WorkoutSession = {
        ...sessionData,
        id: "ws_" + Date.now(),
      };
      await db.workoutSessions.add(newSession);
      setWorkoutSessions((prev) => [...prev, newSession]);
      return newSession;
    },
    []
  );

  // Nutrition
  const logMeal = useCallback(
    async (mealData: Omit<Meal, "id">): Promise<Meal> => {
      const db = getDb();
      const newMeal: Meal = {
        ...mealData,
        id: "meal_" + Date.now() + "_" + Math.random().toString(36).substring(2, 5),
      };
      await db.meals.add(newMeal);
      setMeals((prev) => [...prev, newMeal]);
      return newMeal;
    },
    []
  );

  const deleteMeal = useCallback(async (id: string) => {
    const db = getDb();
    await db.meals.delete(id);
    setMeals((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Digital discipline & Recovery
  const logDigitalChecklist = useCallback(
    async (data: Partial<DigitalDisciplineLog>) => {
      const db = getDb();
      const existing = digitalLogs.find((d) => d.date === todayDate);
      const updated: DigitalDisciplineLog = {
        id: existing?.id || "dl_" + todayDate,
        date: todayDate,
        screenOffObserved: data.screenOffObserved ?? existing?.screenOffObserved ?? false,
        screenOffTimeActual: data.screenOffTimeActual ?? existing?.screenOffTimeActual,
        isDetoxDay: data.isDetoxDay ?? existing?.isDetoxDay ?? false,
        detoxObserved: data.detoxObserved ?? existing?.detoxObserved ?? false,
        checklistCompleted: {
          workFinished: data.checklistCompleted?.workFinished ?? existing?.checklistCompleted.workFinished ?? false,
          phonePutAway: data.checklistCompleted?.phonePutAway ?? existing?.checklistCompleted.phonePutAway ?? false,
          readyForTomorrow: data.checklistCompleted?.readyForTomorrow ?? existing?.checklistCompleted.readyForTomorrow ?? false,
          eveningCareDone: data.checklistCompleted?.eveningCareDone ?? existing?.checklistCompleted.eveningCareDone ?? false,
        },
      };
      await db.digitalLogs.put(updated);
      setDigitalLogs((prev) => [...prev.filter((d) => d.date !== todayDate), updated]);
    },
    [digitalLogs, todayDate]
  );

  const logSleep = useCallback(
    async (data: Omit<SleepLog, "id" | "date">, date = todayDate) => {
      const db = getDb();
      const entry: SleepLog = {
        id: "sleep_" + date,
        date,
        ...data,
      };
      await db.sleepLogs.put(entry);
      setSleepLogs((prev) => [...prev.filter((s) => s.date !== date), entry]);
    },
    [todayDate]
  );

  // Notifications
  const markNotificationAsRead = useCallback(async (id: string) => {
    const db = getDb();
    await db.notifications.update(id, { read: true });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const clearAllNotifications = useCallback(async () => {
    const db = getDb();
    await db.notifications.clear();
    setNotifications([]);
  }, []);

  const sendSystemNotification = useCallback(
    async (title: string, message: string, category: any = "general") => {
      const db = getDb();
      const notif = createNotification({ title, message, category });
      await db.notifications.add(notif);
      setNotifications((prev) => [notif, ...prev]);

      // Trigger browser push if active
      triggerBrowserNotification(title, { body: message });
    },
    []
  );

  // Backup & Reset
  const exportData = useCallback(async () => {
    return await exportAllData();
  }, []);

  const importBackup = useCallback(
    async (payload: ExportDataPayload) => {
      const success = await importData(payload);
      if (success) {
        await refreshAll();
      }
      return success;
    },
    [refreshAll]
  );

  const resetAllData = useCallback(async () => {
    await resetDatabase();
    await refreshAll();
  }, [refreshAll]);

  // Analytics computation on-the-fly
  const getAnalytics = useCallback(
    (periodDays: 7 | 30 | 90) => {
      return computeAnalyticsSummary({
        periodDays,
        todayDate,
        tasks,
        habits,
        habitLogs,
        studySessions,
        waterLogs,
        workoutSessions,
        digitalLogs,
        sleepLogs,
        waterDailyTargetMl: userProfile.waterSettings.dailyTargetMl,
      });
    },
    [
      todayDate,
      tasks,
      habits,
      habitLogs,
      studySessions,
      waterLogs,
      workoutSessions,
      digitalLogs,
      sleepLogs,
      userProfile.waterSettings.dailyTargetMl,
    ]
  );

  const value: LifeOSContextValue = {
    isInitialized,
    todayDate,
    userProfile,
    tasks,
    habits,
    habitLogs,
    subjects,
    studyGoals,
    studySessions,
    workoutExercises,
    workoutSessions,
    meals,
    waterLogs,
    digitalLogs,
    sleepLogs,
    dailyCheckins,
    todayPlan,
    notifications,
    focusTimer,
    activeTab,
    setActiveTab,

    updateUserProfile,
    completeOnboarding,

    todayCheckin,
    submitDailyCheckIn,

    recalculateCurrentDay,
    updateSlotStatus,

    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    toggleSubtask,

    createHabit,
    updateHabit,
    archiveHabit,
    toggleHabitForDate,
    logHabitValue,

    todayWaterTotal,
    logWater,
    undoLastWater,

    startFocusTimer,
    pauseFocusTimer,
    resumeFocusTimer,
    resetFocusTimer,
    finishFocusTimer,

    createWorkoutExercise,
    saveWorkoutSession,

    logMeal,
    deleteMeal,

    logDigitalChecklist,
    logSleep,

    unreadNotifCount,
    markNotificationAsRead,
    clearAllNotifications,
    sendSystemNotification,

    exportData,
    importBackup,
    resetAllData,

    getAnalytics,
  };

  return <LifeOSContext.Provider value={value}>{children}</LifeOSContext.Provider>;
}

export function useLifeOS() {
  const context = useContext(LifeOSContext);
  if (!context) {
    throw new Error("useLifeOS must be used within a LifeOSProvider");
  }
  return context;
}
