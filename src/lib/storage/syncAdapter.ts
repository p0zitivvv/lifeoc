import { getDb, LifeOSDatabase } from "./db";
import {
  DEFAULT_USER_PROFILE,
  INITIAL_HABITS,
  INITIAL_SUBJECTS,
  INITIAL_EXERCISES,
  INITIAL_SAMPLE_TASKS,
} from "./initialData";
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
} from "@/types";

export interface ExportDataPayload {
  version: string;
  exportedAt: string;
  userProfile?: UserProfile;
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
  dailyPlans: DailyPlan[];
  notifications: NotificationItem[];
}

export async function initializeDatabase(): Promise<void> {
  if (typeof window === "undefined") return;
  const db = getDb();

  const profileCount = await db.userProfile.count();
  if (profileCount === 0) {
    // Seed initial profile
    await db.userProfile.add(DEFAULT_USER_PROFILE);
  }

  const habitCount = await db.habits.count();
  if (habitCount === 0) {
    await db.habits.bulkAdd(INITIAL_HABITS);
  }

  const subjectCount = await db.subjects.count();
  if (subjectCount === 0) {
    await db.subjects.bulkAdd(INITIAL_SUBJECTS);
  }

  const exerciseCount = await db.workoutExercises.count();
  if (exerciseCount === 0) {
    await db.workoutExercises.bulkAdd(INITIAL_EXERCISES);
  }

  const taskCount = await db.tasks.count();
  if (taskCount === 0) {
    await db.tasks.bulkAdd(INITIAL_SAMPLE_TASKS);
  }
}

export async function exportAllData(): Promise<ExportDataPayload> {
  const db = getDb();
  const profiles = await db.userProfile.toArray();
  const tasks = await db.tasks.toArray();
  const habits = await db.habits.toArray();
  const habitLogs = await db.habitLogs.toArray();
  const subjects = await db.subjects.toArray();
  const studyGoals = await db.studyGoals.toArray();
  const studySessions = await db.studySessions.toArray();
  const workoutExercises = await db.workoutExercises.toArray();
  const workoutSessions = await db.workoutSessions.toArray();
  const meals = await db.meals.toArray();
  const waterLogs = await db.waterLogs.toArray();
  const digitalLogs = await db.digitalLogs.toArray();
  const sleepLogs = await db.sleepLogs.toArray();
  const dailyCheckins = await db.dailyCheckins.toArray();
  const dailyPlans = await db.dailyPlans.toArray();
  const notifications = await db.notifications.toArray();

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    userProfile: profiles[0] || DEFAULT_USER_PROFILE,
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
    dailyPlans,
    notifications,
  };
}

export async function importData(payload: ExportDataPayload): Promise<boolean> {
  if (!payload || !payload.version) {
    throw new Error("Неверный формат резервной копии");
  }
  const db = getDb();

  await db.transaction("rw", [
    db.userProfile,
    db.tasks,
    db.habits,
    db.habitLogs,
    db.subjects,
    db.studyGoals,
    db.studySessions,
    db.workoutExercises,
    db.workoutSessions,
    db.meals,
    db.waterLogs,
    db.digitalLogs,
    db.sleepLogs,
    db.dailyCheckins,
    db.dailyPlans,
    db.notifications,
  ], async () => {
    if (payload.userProfile) {
      await db.userProfile.clear();
      await db.userProfile.put(payload.userProfile);
    }
    if (Array.isArray(payload.tasks)) {
      await db.tasks.clear();
      await db.tasks.bulkPut(payload.tasks);
    }
    if (Array.isArray(payload.habits)) {
      await db.habits.clear();
      await db.habits.bulkPut(payload.habits);
    }
    if (Array.isArray(payload.habitLogs)) {
      await db.habitLogs.clear();
      await db.habitLogs.bulkPut(payload.habitLogs);
    }
    if (Array.isArray(payload.subjects)) {
      await db.subjects.clear();
      await db.subjects.bulkPut(payload.subjects);
    }
    if (Array.isArray(payload.studyGoals)) {
      await db.studyGoals.clear();
      await db.studyGoals.bulkPut(payload.studyGoals);
    }
    if (Array.isArray(payload.studySessions)) {
      await db.studySessions.clear();
      await db.studySessions.bulkPut(payload.studySessions);
    }
    if (Array.isArray(payload.workoutExercises)) {
      await db.workoutExercises.clear();
      await db.workoutExercises.bulkPut(payload.workoutExercises);
    }
    if (Array.isArray(payload.workoutSessions)) {
      await db.workoutSessions.clear();
      await db.workoutSessions.bulkPut(payload.workoutSessions);
    }
    if (Array.isArray(payload.meals)) {
      await db.meals.clear();
      await db.meals.bulkPut(payload.meals);
    }
    if (Array.isArray(payload.waterLogs)) {
      await db.waterLogs.clear();
      await db.waterLogs.bulkPut(payload.waterLogs);
    }
    if (Array.isArray(payload.digitalLogs)) {
      await db.digitalLogs.clear();
      await db.digitalLogs.bulkPut(payload.digitalLogs);
    }
    if (Array.isArray(payload.sleepLogs)) {
      await db.sleepLogs.clear();
      await db.sleepLogs.bulkPut(payload.sleepLogs);
    }
    if (Array.isArray(payload.dailyCheckins)) {
      await db.dailyCheckins.clear();
      await db.dailyCheckins.bulkPut(payload.dailyCheckins);
    }
    if (Array.isArray(payload.dailyPlans)) {
      await db.dailyPlans.clear();
      await db.dailyPlans.bulkPut(payload.dailyPlans);
    }
    if (Array.isArray(payload.notifications)) {
      await db.notifications.clear();
      await db.notifications.bulkPut(payload.notifications);
    }
  });

  return true;
}

export async function resetDatabase(): Promise<void> {
  const db = getDb();
  await db.transaction("rw", [
    db.userProfile,
    db.tasks,
    db.habits,
    db.habitLogs,
    db.subjects,
    db.studyGoals,
    db.studySessions,
    db.workoutExercises,
    db.workoutSessions,
    db.meals,
    db.waterLogs,
    db.digitalLogs,
    db.sleepLogs,
    db.dailyCheckins,
    db.dailyPlans,
    db.notifications,
  ], async () => {
    await db.userProfile.clear();
    await db.tasks.clear();
    await db.habits.clear();
    await db.habitLogs.clear();
    await db.subjects.clear();
    await db.studyGoals.clear();
    await db.studySessions.clear();
    await db.workoutExercises.clear();
    await db.workoutSessions.clear();
    await db.meals.clear();
    await db.waterLogs.clear();
    await db.digitalLogs.clear();
    await db.sleepLogs.clear();
    await db.dailyCheckins.clear();
    await db.dailyPlans.clear();
    await db.notifications.clear();

    // Re-seed initial data
    await db.userProfile.add(DEFAULT_USER_PROFILE);
    await db.habits.bulkAdd(INITIAL_HABITS);
    await db.subjects.bulkAdd(INITIAL_SUBJECTS);
    await db.workoutExercises.bulkAdd(INITIAL_EXERCISES);
    await db.tasks.bulkAdd(INITIAL_SAMPLE_TASKS);
  });
}
